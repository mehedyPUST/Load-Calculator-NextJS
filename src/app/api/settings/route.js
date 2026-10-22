import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/lib/models/Settings";

export const dynamic = "force-dynamic";

function normalizeRingMap(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  if (raw instanceof Map) {
    for (const [k, v] of raw.entries()) {
      if (v === true || v === "true" || v === 1) out[String(k)] = true;
    }
    return out;
  }
  for (const [k, v] of Object.entries(raw)) {
    if (v === true || v === "true" || v === 1) out[String(k)] = true;
  }
  return out;
}

async function getOrCreateSettings() {
  let doc = await Settings.findOne({ key: "app" });
  if (!doc) {
    doc = await Settings.create({
      key: "app",
      maxLoadRingMode: "with",
      calculatorRingActive: {},
    });
  }
  return doc;
}

function settingsPayload(doc) {
  const lean =
    typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    maxLoadRingMode:
      lean.maxLoadRingMode === "without" ? "without" : "with",
    calculatorRingActive: normalizeRingMap(lean.calculatorRingActive),
  };
}

/** GET /api/settings */
export async function GET() {
  try {
    await connectDB();
    const doc = await getOrCreateSettings();
    return NextResponse.json({
      success: true,
      data: settingsPayload(doc),
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
 * Body may include maxLoadRingMode and/or calculatorRingActive
 */
export async function PATCH(request) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const $set = {};

    if (body.maxLoadRingMode != null) {
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
      $set.maxLoadRingMode = mode;
    }

    if (body.calculatorRingActive != null) {
      if (
        typeof body.calculatorRingActive !== "object" ||
        Array.isArray(body.calculatorRingActive)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "calculatorRingActive must be an object map",
          },
          { status: 400 }
        );
      }
      $set.calculatorRingActive = normalizeRingMap(body.calculatorRingActive);
    }

    if (Object.keys($set).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid settings fields to update",
        },
        { status: 400 }
      );
    }

    // Prefer markModified path for Mixed fields
    let doc = await Settings.findOne({ key: "app" });
    if (!doc) {
      doc = new Settings({
        key: "app",
        maxLoadRingMode: "with",
        calculatorRingActive: {},
      });
    }
    if ($set.maxLoadRingMode != null) doc.maxLoadRingMode = $set.maxLoadRingMode;
    if ($set.calculatorRingActive != null) {
      doc.calculatorRingActive = $set.calculatorRingActive;
      doc.markModified("calculatorRingActive");
    }
    await doc.save();

    return NextResponse.json({
      success: true,
      data: settingsPayload(doc),
    });
  } catch (err) {
    console.error("PATCH /api/settings:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
