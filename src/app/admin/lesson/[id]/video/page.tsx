"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function LessonVideoPage() {
  const { id } = useParams();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);

  async function upload() {
    if (!file) return alert("Pilih video");

    const fd = new FormData();
    fd.append("video", file);

    const res = await fetch(`/api/lesson/${id}/video`, {
      method: "POST",
      body: fd,
    });

    if (res.ok) {
    router.replace("/admin/lesson");
    router.refresh();
    }
  }

  async function remove() {
    if (!confirm("Hapus video?")) return;
        await fetch(`/api/lesson/${id}/video`, { method: "DELETE" });

    router.replace("/admin/lesson");
    router.refresh();
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">Lesson Video</h1>

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <div className="flex gap-3 mt-4">
        <button
          onClick={upload}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Upload / Replace
        </button>

        <button
          onClick={remove}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
