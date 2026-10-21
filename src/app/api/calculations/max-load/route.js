import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Calculation from "@/lib/models/Calculation";
import { purgeExpiredTrash } from "@/lib/trash";

export const dynamic = "force-dynamic";

const activeFilter = {
  $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
};

const VALID_RANGES = new Set([
  "today",
  "last7days",
  "lastweek",
  "monthly",
  "yearly",
  "alltime",
]);

/**
 * Resolve [start, end) for a range. end is exclusive.
 * Local timezone of the server.
 */
function resolveRange(range, year, month) {
  const now = new Date();
  const y = Number.isFinite(year) && year >= 2000 && year <= 2100
    ? year
    : now.getFullYear();
  const m =
    Number.isFinite(month) && month >= 1 && month <= 12
      ? month
      : now.getMonth() + 1;

  let start = null;
  let end = null;
  let label = "";

  switch (range) {
    case "today": {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      label = "Today";
      break;
    }
    case "last7days": {
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      start = new Date(end);
      start.setDate(start.getDate() - 7);
      label = "Last 7 days";
      break;
    }
    case "lastweek": {
      // Previous ISO-style week: Mon 00:00 → next Mon 00:00
      const day = now.getDay(); // 0 Sun … 6 Sat
      const daysSinceMon = day === 0 ? 6 : day - 1;
      const thisMon = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - daysSinceMon,
        0,
        0,
        0,
        0
      );
      end = thisMon;
      start = new Date(thisMon);
      start.setDate(start.getDate() - 7);
      label = "Last week";
      break;
    }
    case "yearly": {
      start = new Date(y, 0, 1, 0, 0, 0, 0);
      end = new Date(y + 1, 0, 1, 0, 0, 0, 0);
      label = `Year ${y}`;
      break;
    }
    case "alltime": {
      start = null;
      end = null;
      label = "All time";
      break;
    }
    case "monthly":
    default: {
      start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      end = new Date(y, m, 1, 0, 0, 0, 0);
      const names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      label = `${names[m - 1]} ${y}`;
      break;
    }
  }

  return { start, end, year: y, month: m, label, range };
}

function buildDateMatch(start, end) {
  if (!start && !end) return null;
  const range = {};
  if (start) range.$gte = start;
  if (end) range.$lt = end;
  return {
    $or: [
      { calculatedAt: range },
      {
        calculatedAt: { $exists: false },
        createdAt: range,
      },
    ],
  };
}

export async function GET(request) {
  try {
    await connectDB();
    await purgeExpiredTrash();

    const { searchParams } = new URL(request.url);
    let range = (searchParams.get("range") || "monthly").toLowerCase();
    if (!VALID_RANGES.has(range)) range = "monthly";

    const yearQ = parseInt(searchParams.get("year") || "", 10);
    const monthQ = parseInt(searchParams.get("month") || "", 10);

    const resolved = resolveRange(range, yearQ, monthQ);
    const dateMatch = buildDateMatch(resolved.start, resolved.end);

    const andParts = [activeFilter];
    if (dateMatch) andParts.push(dateMatch);

    // ringMode:
    //   without (default) = only records with NO active ring → max from non-ring data
    //   with / all        = consider ALL records for max (ring + non-ring);
    //                       peaks carry hasActiveRing so UI can show ring indicator
    let ringMode = (searchParams.get("ringMode") || "without").toLowerCase();
    if (!["without", "with", "all"].includes(ringMode)) ringMode = "without";
    if (ringMode === "without") {
      andParts.push({
        $or: [
          { hasActiveRing: false },
          { hasActiveRing: { $exists: false } },
        ],
      });
    }
    // ringMode === "with" | "all": no hasActiveRing filter — max from all data

    const hourlyMatch = {
      $and: [
        ...andParts,
        {
          $or: [
            { isHourly: true },
            { hourSlot: { $type: "string", $ne: "" } },
          ],
        },
      ],
    };
    const anyMatch = { $and: andParts };

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
              hasActiveRing: { $eq: ["$hasActiveRing", true] },
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
          hasActiveRing: { $eq: ["$hasActiveRing", true] },
        },
      },
    ]);

    const bottail11Peaks = await Calculation.aggregate([
      { $match: baseMatch },
      { $addFields: { eventAt: { $ifNull: ["$calculatedAt", "$createdAt"] } } },
      { $sort: { bottail11kV: -1, eventAt: 1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          maxMW: { $ifNull: ["$bottail11kV", 0] },
          maxLoadAt: "$eventAt",
          hourSlot: 1,
          hasActiveRing: { $eq: ["$hasActiveRing", true] },
          ampsAtMax: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$feeders",
                    as: "f",
                    cond: { $in: ["$$f.id", [8, 9]] },
                  },
                },
                as: "f",
                in: { $ifNull: ["$$f.amps", 0] },
              },
            },
          },
        },
      },
    ]);

    const sampleCount = await Calculation.countDocuments(baseMatch);

    return NextResponse.json({
      success: true,
      range: resolved.range,
      label: resolved.label,
      ringMode,
      year: resolved.year,
      month: resolved.month,
      start: resolved.start ? resolved.start.toISOString() : null,
      end: resolved.end ? resolved.end.toISOString() : null,
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
          hasActiveRing: !!p.hasActiveRing,
        })),
      })),
      bottail11Peaks: (bottail11Peaks || []).map((p) => ({
        maxMW: p.maxMW ?? 0,
        maxLoadAt: p.maxLoadAt,
        ampsAtMax: p.ampsAtMax ?? 0,
        hourSlot: p.hourSlot || null,
        hasActiveRing: !!p.hasActiveRing,
      })),
      totalPeak: totalPeak[0]
        ? {
            ...totalPeak[0],
            hasActiveRing: !!totalPeak[0].hasActiveRing,
          }
        : null,
    });
  } catch (err) {
    console.error("GET /api/calculations/max-load:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to compute max load" },
      { status: 500 }
    );
  }
}
