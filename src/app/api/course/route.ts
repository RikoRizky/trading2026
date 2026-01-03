// app/api/courses/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => ({}));
  const { title, slug, description, thumbnail_url, price, is_published } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "title dan slug wajib" }, { status: 400 });
  }

  // cek user dan role (server-side) — berguna untuk respon lebih ramah sebelum RLS
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // cek profil is_admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const { data, error } = await supabase.from("courses").insert([{
    title,
    slug,
    description: description ?? null,
    thumbnail_url: thumbnail_url ?? null,
    price: price ?? null,
    is_published: !!is_published,
    updated_at: null
  }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
