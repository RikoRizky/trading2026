import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request, { params }: { params: { id: string }}) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Module tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function PUT(req: Request, { params }: { params: { id: string }}) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => ({}));
  const { title, description, order_index } = body;

  // cek user
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // cek admin
  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("modules")
    .update({
      title: title ?? undefined,
      description: description ?? undefined,
      order_index: order_index ?? undefined,
      updated_at: new Date(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: Request, { params }: { params: { id: string }}) {
  const supabase = createRouteHandlerClient({ cookies });

  // cek user
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // cek admin
  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const { error } = await supabase
    .from("modules")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Deleted" }, { status: 200 });
}
