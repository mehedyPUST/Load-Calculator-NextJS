import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = "disconnected";
  try {
    await connectDB();
    db = mongoose.connection.readyState === 1 ? "connected" : "error";
  } catch {
    db = "error";
  }

  return NextResponse.json({
    success: true,
    message: "Load Calculator API is running",
    db,
  });
}
