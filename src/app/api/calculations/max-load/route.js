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
 * Asia/Dhaka (UTC+6) calendar helpers — station local time for range bounds.
 * Avoids UTC server midnight cutting off BD evening/morning records.
 */
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

function bdParts(date = new Date()) {
  const t = new Date(date.getTime() + BD_OFFSET_MS);
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth() + 1,
    d: t.getUTCDate(),
    dow: t.getUTCDay(), // 0 Sun .. 6 Sat in BD calendar
  };
}

/** Midnight BD on y-m-d as a real UTC Instant */
function bdMidnight(y, m, d) {
  // BD 00:00 = UTC 18:00 previous calendar day → Date.UTC(y,m-1,d,0,0,0) - 6h
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - BD_OFFSET_MS);
}

/**
 * Resolve [start, end) for a range in Bangladesh local calendar.
 */
function resolveRange(range, year, month) {
  const nowBd = bdParts();
  const y = Number.isFinite(year) && year >= 2000 && year <= 2100 ? year : nowBd.y;
  const m =
    Number.isFinite(month) && month >= 1 && month <= 12 ? month : nowBd.m;

  let start = null;
  let end = null;
  let label = "";

  switch (range) {
    case "today": {
      start = bdMidnight(nowBd.y, nowBd.m, nowBd.d);
      end = new Date(Date.UTC(nowBd.y, nowBd.m - 1, nowBd.d + 1, 0, 0, 0, 0) - BD_OFFSET_MS);
      label = "Today";
      break;
    }
    case "last7days": {
      end = new Date(Date.UTC(nowBd.y, nowBd.m - 1, nowBd.d + 1, 0, 0, 0, 0) - BD_OFFSET_MS);
      start = new Date(Date.UTC(nowBd.y, nowBd.m - 1, nowBd.d + 1 - 7, 0, 0, 0, 0) - BD_OFFSET_MS);
      label = "Last 7 days";
      break;
    }
    case "lastweek": {
      // Previous Mon 00:00 BD → this Mon 00:00 BD
      const daysSinceMon = nowBd.dow === 0 ? 6 : nowBd.dow - 1;
      end = new Date(Date.UTC(nowBd.y, nowBd.m - 1, nowBd.d - daysSinceMon, 0, 0, 0, 0) - BD_OFFSET_MS);
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = "Last week";
      break;
    }
    case "yearly": {
      start = bdMidnight(y, 1, 1);
      end = bdMidnight(y + 1, 1, 1);
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
      start = bdMidnight(y, m, 1);
      end = m === 12 ? bdMidnight(y + 1, 1, 1) : bdMidnight(y, m + 1, 1);
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

/**
 * Include a record if calculatedAt OR createdAt falls in [start, end).
 * Broad match so no day is dropped when one timestamp is off.
 */
function buildDateMatch(start, end) {
  if (!start && !end) return null;
  const range = {};
  if (start) range.$gte = start;
  if (end) range.$lt = end;
  return {
    $or: [
      { calculatedAt: range },
      { createdAt: range },
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
    //   without = only NO active ring
    //   with / all = ALL records (ring + non-ring) — default for true max
    let ringMode = (searchParams.get("ringMode") || "with").toLowerCase();
    if (!["without", "with", "all"].includes(ringMode)) ringMode = "with";
    if (ringMode === "without") {
      andParts.push({
        $or: [
          { hasActiveRing: false },
          { hasActiveRing: { $exists: false } },
        ],
      });
    }

    // All records in range (hourly + non-hourly)
    const baseMatch = { $and: andParts };

    // Station peak always uses ALL data in the date range (ignore ring filter)
    // so the headline max is never limited to ring-off-only days.
    const stationPeakMatch = {
      $and: [activeFilter, ...(dateMatch ? [dateMatch] : [])],
    };

    const hourlyCount = await Calculation.countDocuments({
      $and: [
        ...andParts,
        {
          $or: [
            { isHourly: true },
            { hourSlot: { $type: "string", $ne: "" } },
          ],
        },
      ],
    });

        const pipeline = [
      { $match: baseMatch },
      { $unwind: "$feeders" },
      {
        $addFields: {
          eventAt: { $ifNull: ["$calculatedAt", "$createdAt"] },
        },
      },
      {
        $addFields: {
          feederMwNum: {
            $convert: {
              input: "$feeders.mw",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
      { $sort: { feederMwNum: -1, eventAt: 1 } },
      {
        $group: {
          _id: "$feeders.id",
          name: { $first: "$feeders.name" },
          bus: { $first: "$feeders.bus" },
          peaks: {
            $push: {
              maxMW: "$feederMwNum",
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
      { $match: stationPeakMatch },
      {
        $addFields: {
          eventAt: { $ifNull: ["$calculatedAt", "$createdAt"] },
          totalMWNum: {
            $convert: {
              input: "$totalMW",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
      { $sort: { totalMWNum: -1, eventAt: 1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          maxTotalMW: "$totalMWNum",
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
