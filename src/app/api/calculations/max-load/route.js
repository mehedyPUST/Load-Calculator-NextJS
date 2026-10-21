import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Calculation from "@/lib/models/Calculation";
import { purgeExpiredTrash } from "@/lib/trash";

export const dynamic = "force-dynamic";

const activeFilter = {
  $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
};

export async function GET(request) {
  try {
    await connectDB();
    await purgeExpiredTrash();

    const { searchParams } = new URL(request.url);
    const now = new Date();
    let year = parseInt(searchParams.get("year") || "", 10);
    let month = parseInt(searchParams.get("month") || "", 10);

    if (!Number.isFinite(year) || year < 2000 || year > 2100) {
      year = now.getFullYear();
    }
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      month = now.getMonth() + 1;
    }

    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);

    const dateMatch = {
      $or: [
        { calculatedAt: { $gte: start, $lt: end } },
        {
          calculatedAt: { $exists: false },
          createdAt: { $gte: start, $lt: end },
        },
      ],
    };

    const hourlyMatch = {
      $and: [
        activeFilter,
        dateMatch,
        {
          $or: [
            { isHourly: true },
            { hourSlot: { $type: "string", $ne: "" } },
          ],
        },
      ],
    };
    const anyMatch = { $and: [activeFilter, dateMatch] };

    const hourlyCount = await Calculation.countDocuments(hourlyMatch);
    const baseMatch = hourlyCount > 0 ? hourlyMatch : anyMatch;

    const pipeline = [
      { $match: baseMatch },
      { $unwind: "$feeders" },
      {
        $addFields: {
          eventAt: { $ifNull: ["$calculatedAt", "$createdAt"] },
        },
      },
      { $sort: { "feeders.mw": -1, eventAt: 1 } },
      {
        $group: {
          _id: "$feeders.id",
          name: { $first: "$feeders.name" },
          bus: { $first: "$feeders.bus" },
          peaks: {
            $push: {
              maxMW: "$feeders.mw",
              maxLoadAt: "$eventAt",
              ampsAtMax: "$feeders.amps",
              hourSlot: "$hourSlot",
            },
          },
          recordCount: { $sum: 1 },
        },
      },
      {
        $project: {
          name: 1,
          bus: 1,
          recordCount: 1,
          peaks: { $slice: ["$peaks", 5] },
          maxMW: { $arrayElemAt: ["$peaks.maxMW", 0] },
          maxLoadAt: { $arrayElemAt: ["$peaks.maxLoadAt", 0] },
          ampsAtMax: { $arrayElemAt: ["$peaks.ampsAtMax", 0] },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const rows = await Calculation.aggregate(pipeline);

    const totalPeak = await Calculation.aggregate([
      { $match: baseMatch },
      { $addFields: { eventAt: { $ifNull: ["$calculatedAt", "$createdAt"] } } },
      { $sort: { totalMW: -1, eventAt: 1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          maxTotalMW: "$totalMW",
          maxTotalAt: "$eventAt",
          hourSlot: 1,
        },
      },
    ]);

    const sampleCount = await Calculation.countDocuments(baseMatch);

    return NextResponse.json({
      success: true,
      year,
      month,
      start: start.toISOString(),
      end: end.toISOString(),
      sampleCount,
      hourlyOnly: hourlyCount > 0,
      data: rows.map((r) => ({
        feederId: r._id,
        name: r.name,
        bus: r.bus,
        maxMW: r.maxMW ?? 0,
        maxLoadAt: r.maxLoadAt,
        ampsAtMax: r.ampsAtMax ?? 0,
        recordCount: r.recordCount ?? 0,
        peaks: (r.peaks || []).map((p) => ({
          maxMW: p.maxMW ?? 0,
          maxLoadAt: p.maxLoadAt,
          ampsAtMax: p.ampsAtMax ?? 0,
          hourSlot: p.hourSlot || null,
        })),
      })),
      totalPeak: totalPeak[0] || null,
    });
  } catch (err) {
    console.error("GET /api/calculations/max-load:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to compute max load" },
      { status: 500 }
    );
  }
}
