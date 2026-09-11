import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query<{ postgis_version: string; now: string }>(
      "select postgis_version() as postgis_version, now() as now"
    );
    return NextResponse.json({ ok: true, db: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "error desconocido" },
      { status: 500 }
    );
  }
}
