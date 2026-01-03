"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LessonList() {
  const [lessons, setLessons] = useState([]);

  async function load() {
    const res = await fetch("/api/lesson");
    const data = await res.json();
    setLessons(data);
  }

  async function remove(id: string) {
    if (!confirm("Delete this lesson?")) return;
    await fetch(`/api/lesson/${id}`, { method: "DELETE" });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Lessons</h1>
        <Link
          href="/admin/lesson/new"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          + New
        </Link>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Title</th>
            <th className="p-2">Topic</th>
            <th className="p-2">Order</th>
            <th className="p-2">video</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {lessons.map((l: any) => (
            <tr key={l.id} className="border-b">
              <td className="p-2">{l.title}</td>
              <td className="p-2">{l.topic_id}</td>
              <td className="p-2">{l.order_index}</td>
              <td className="p-2">
                {l.video_path ? "✅ Ada" : "❌ Belum"}
              </td>

              <td className="p-2 flex gap-2">
                <Link
                  href={`/admin/lesson/${l.id}/edit`}
                  className="text-blue-600"
                >
                  Edit
                </Link>

                <button
                  onClick={() => remove(l.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
