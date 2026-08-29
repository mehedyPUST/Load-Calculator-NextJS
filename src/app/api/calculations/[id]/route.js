import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Calculation from "@/lib/models/Calculation";
import { purgeExpiredTrash } from "@/lib/trash";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    await connectDB();
    await purgeExpiredTrash();
    const { id } = await params;
    const doc = await Calculation.findById(id).lean();
    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}

/** Soft-delete (to trash) or permanent delete (?permanent=1) */
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    await purgeExpiredTrash();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent =
      searchParams.get("permanent") === "1" ||
      searchParams.get("permanent") === "true";

    if (permanent) {
      const doc = await Calculation.findOneAndDelete({
        _id: id,
        deletedAt: { $ne: null },
      });
      if (!doc) {
        return NextResponse.json(
          {
            success: false,
            message: "Not found in trash (only trash items can be permanently deleted)",
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Permanently deleted",
      });
    }

    const doc = await Calculation.findOneAndUpdate(
      {
        _id: id,
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Not found or already in trash" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Moved to trash",
      data: doc,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to delete" },
      { status: 500 }
    );
  }
}

/** Restore from trash: PATCH with { action: 'restore' } */
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    await purgeExpiredTrash();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.action !== "restore") {
      return NextResponse.json(
        { success: false, message: "Unsupported action" },
        { status: 400 }
      );
    }

    const doc = await Calculation.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Not found in trash" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Restored",
      data: doc,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to restore" },
      { status: 500 }
    );
  }
}
