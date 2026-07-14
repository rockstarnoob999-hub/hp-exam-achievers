import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const limit = Number(searchParams.get("limit") || "100");

  let query = supabaseAdmin
    .from("login_logs")
    .select("*")
    .order("logged_in_at", { ascending: false })
    .limit(limit);

  if (role) query = query.eq("user_role", role);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { log_id, clear_all, role, older_than_days } = body;

  if (log_id) {
    const { error } = await supabaseAdmin
      .from("login_logs")
      .delete()
      .eq("id", log_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: "single" });
  }

  if (clear_all) {
    let query = supabaseAdmin.from("login_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (role) query = (query as any).eq("user_role", role);
    if (older_than_days) {
      const cutoff = new Date(Date.now() - older_than_days * 24 * 60 * 60 * 1000).toISOString();
      query = (query as any).lt("logged_in_at", cutoff);
    }
    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: "bulk" });
  }

  return NextResponse.json({ error: "Specify log_id or clear_all" }, { status: 400 });
}