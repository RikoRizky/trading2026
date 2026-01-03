"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Topicist() {
  const [topics, setTopics] = useState([]);

  async function load() {
    const res = await fetch("/api/topic");
    const data = await res.json();
    setTopics(data);
  }

  async function remove(id: string) {
    if (!confirm("Delete this topic?")) return;
    await fetch(`/api/topic/${id}`, { method: "DELETE" });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Topics</h1>
        <Link href="/admin/topic/new" className="px-4 py-2 bg-blue-600 text-white rounded">
          + New
        </Link>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Title</th>
            <th className="p-2">Topic</th>
            <th className="p-2">Order</th>
            <th className="p-2">Updated</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {topics.map((t: any) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">{t.title}</td>
              <td className="p-2">{t.module_id}</td>
              <td className="p-2">{t.order_index}</td>
              <td className="p-2">{t.updated_at?.slice(0, 10)}</td>

              <td className="p-2 flex gap-2">
                <Link href={`/admin/topic/${t.id}/edit`} className="text-blue-600">Edit</Link>
                <button onClick={() => remove(t.id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
