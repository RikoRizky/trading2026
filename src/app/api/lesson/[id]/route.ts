import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(_: Request, { params }: any) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: any) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();

  const { topic_id, title, description, order_index, content, video_url } = body;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.is_admin)
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  const { data, error } = await supabase
    .from("lessons")
    .update({
      topic_id: topic_id ?? undefined,
      title: title ?? undefined,
      description: description ?? undefined,
      content: content ?? undefined,
      video_url: video_url ?? undefined,
      order_index: order_index ?? undefined,
      updated_at: new Date().toISOString()
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: any) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.is_admin)
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  const { error } = await supabase.from("lessons").delete().eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
