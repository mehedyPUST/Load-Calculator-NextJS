import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/lib/models/Settings";

export const dynamic = "force-dynamic";

async function getOrCreateSettings() {
  let doc = await Settings.findOne({ key: "app" }).lean();
  if (!doc) {
    const created = await Settings.create({
      key: "app",
      maxLoadRingMode: "with",
    });
    doc = created.toObject();
  }
  return doc;
}

/** GET /api/settings — public read of app preferences */
export async function GET() {
  try {
    await connectDB();
    const doc = await getOrCreateSettings();
    return NextResponse.json({
      success: true,
      data: {
        maxLoadRingMode:
          doc.maxLoadRingMode === "without" ? "without" : "with",
      },
    });
  } catch (err) {
    console.error("GET /api/settings:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings
 * Body: { maxLoadRingMode: "with" | "without" }
 * Saves ring toggle preference to the database.
 */
export async function PATCH(request) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    let mode = String(body.maxLoadRingMode || "").toLowerCase();
    if (mode !== "with" && mode !== "without") {
      return NextResponse.json(
        {
          success: false,
          message: 'maxLoadRingMode must be "with" or "without"',
        },
        { status: 400 }
      );
    }

    const doc = await Settings.findOneAndUpdate(
      { key: "app" },
      { $set: { maxLoadRingMode: mode } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      data: {
        maxLoadRingMode:
          doc.maxLoadRingMode === "without" ? "without" : "with",
      },
    });
  } catch (err) {
    console.error("PATCH /api/settings:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
