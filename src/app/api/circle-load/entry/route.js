import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      message: "Circle entry recorded successfully",
      data: body,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to save circle entry" },
      { status: 500 }
    );
  }
}
