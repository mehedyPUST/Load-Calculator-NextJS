import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Calculation from "@/lib/models/Calculation";
import { purgeExpiredTrash } from "@/lib/trash";

export const dynamic = "force-dynamic";

const activeFilter = {
  $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
};
const trashFilter = { deletedAt: { $ne: null } };

export async function GET(request) {
  try {
    await connectDB();
    const purged = await purgeExpiredTrash();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const trash =
      searchParams.get("trash") === "1" || searchParams.get("trash") === "true";

    const filter = trash ? trashFilter : activeFilter;

    const [docs, inboxCount, trashCount] = await Promise.all([
      Calculation.find(filter)
        .sort(trash ? { deletedAt: -1 } : { createdAt: -1 })
        .limit(limit)
        .lean(),
      Calculation.countDocuments(activeFilter),
      Calculation.countDocuments(trashFilter),
    ]);

    return NextResponse.json({
      success: true,
      count: docs.length,
      inboxCount,
      trashCount,
      purged,
      trash,
      data: docs,
    });
  } catch (err) {
    console.error("GET /api/calculations:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (body.action && Array.isArray(body.ids)) {
      return handleBulk(body);
    }

    // Empty entire trash
    if (body.action === "empty_trash") {
      await purgeExpiredTrash();
      const result = await Calculation.deleteMany(trashFilter);
      return NextResponse.json({
        success: true,
        message: "Trash emptied",
        deleted: result.deletedCount,
      });
    }

    const { busVoltages, feeders, bottail11kV, totalMW, note } = body;

    if (
      !busVoltages ||
      busVoltages.bus1 == null ||
      busVoltages.bus2 == null ||
      !Array.isArray(feeders)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: busVoltages and feeders",
        },
        { status: 400 }
      );
    }

    const doc = await Calculation.create({
      busVoltages: {
        bus1: Number(busVoltages.bus1),
        bus2: Number(busVoltages.bus2),
      },
      feeders,
      bottail11kV: Number(bottail11kV) || 0,
      totalMW: Number(totalMW) || 0,
      note: note || "",
      calculatedAt: new Date(),
      deletedAt: null,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Calculation saved successfully",
        data: doc,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/calculations:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to save" },
      { status: 500 }
    );
  }
}

async function handleBulk(body) {
  const { action, ids } = body;
  const uniqueIds = [...new Set((ids || []).filter(Boolean).map(String))];

  if (uniqueIds.length === 0) {
    return NextResponse.json(
      { success: false, message: "No items selected" },
      { status: 400 }
    );
  }

  await connectDB();
  await purgeExpiredTrash();

  if (action === "trash") {
    // Only move active items
    const result = await Calculation.updateMany(
      {
        _id: { $in: uniqueIds },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      },
      { $set: { deletedAt: new Date() } }
    );
    return NextResponse.json({
      success: true,
      message: "Moved to trash",
      modified: result.modifiedCount,
    });
  }

  if (action === "restore") {
    // Only restore trashed items
    const result = await Calculation.updateMany(
      { _id: { $in: uniqueIds }, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } }
    );
    return NextResponse.json({
      success: true,
      message: "Restored to history",
      modified: result.modifiedCount,
    });
  }

  if (action === "purge") {
    // Only permanently delete items already in trash
    const result = await Calculation.deleteMany({
      _id: { $in: uniqueIds },
      deletedAt: { $ne: null },
    });
    return NextResponse.json({
      success: true,
      message: "Permanently deleted",
      deleted: result.deletedCount,
    });
  }

  return NextResponse.json(
    { success: false, message: "Unknown action" },
    { status: 400 }
  );
}
