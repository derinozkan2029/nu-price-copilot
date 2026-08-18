import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseClient";

// POST { page: "dorm" | "textbooks", itemTitle: string, note?: string }
// A lightweight feedback loop, not a full request-tracking system: stores
// what people wish was in the catalog. Writes to Supabase (see
// supabase/schema.sql for the `suggestions` table) when configured; if
// Supabase isn't set up yet, falls back to a server log line so the
// submission isn't just silently dropped, and still tells the client it
// went through either way, since the user's side of this doesn't change.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const page =
    body?.page === "dorm" || body?.page === "textbooks" ? body.page : null;
  const itemTitle =
    typeof body?.itemTitle === "string" ? body.itemTitle.trim().slice(0, 200) : "";
  const note =
    typeof body?.note === "string" ? body.note.trim().slice(0, 500) || null : null;

  if (!page || !itemTitle) {
    return NextResponse.json(
      { error: "'page' and 'itemTitle' are required." },
      { status: 400 }
    );
  }

  try {
    const client = getServiceClient();
    const { error } = await client
      .from("suggestions")
      .insert({ page, item_title: itemTitle, note });
    if (error) throw error;
  } catch (err) {
    console.log(`[suggestion:${page}] "${itemTitle}"${note ? ` — ${note}` : ""}`);
  }

  return NextResponse.json({ ok: true });
}
