import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";


export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const lessonId = params.id;

  // 1. auth check
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. ambil path video
  const { data: lesson } = await supabase
    .from("lesson")
    .select("video_path")
    .eq("id", lessonId)
    .single();

  if (!lesson?.video_path) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // 3. signed url
  const { data, error } = await supabase.storage
    .from("lesson-video")
    .createSignedUrl(lesson.video_path, 60);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}


export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const lessonId = params.id;

  const formData = await req.formData();
  const file = formData.get("video") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const path = `lesson/${lessonId}/video.${ext}`;

  // hapus video lama (kalau ada)
  const { data: lesson } = await supabase
    .from("lesson")
    .select("video_path")
    .eq("id", lessonId)
    .single();

  if (lesson?.video_path) {
    await supabase.storage
      .from("lesson-video")
      .remove([lesson.video_path]);
  }

  // upload baru
  const { error } = await supabase.storage
    .from("lesson-video")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // simpan path
  await supabase
    .from("lesson")
    .update({ video_path: path })
    .eq("id", lessonId);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const lessonId = params.id;

  const { data: lesson } = await supabase
    .from("lesson")
    .select("video_path")
    .eq("id", lessonId)
    .single();

  if (!lesson?.video_path) {
    return NextResponse.json({ error: "No video" }, { status: 400 });
  }

  await supabase.storage
    .from("lesson-video")
    .remove([lesson.video_path]);

  await supabase
    .from("lesson")
    .update({ video_path: null })
    .eq("id", lessonId);

  return NextResponse.json({ success: true });
}
