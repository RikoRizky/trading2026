"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ModuleList() {
  const [modules, setModules] = useState([]);

  async function load() {
    const res = await fetch("/api/module");
    const data = await res.json();
    setModules(data);
  }

  async function remove(id: string) {
    if (!confirm("Delete this module?")) return;
    await fetch(`/api/module/${id}`, { method: "DELETE" });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Modules</h1>
        <Link href="/admin/module/new" className="px-4 py-2 bg-blue-600 text-white rounded">
          + New
        </Link>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Title</th>
            <th className="p-2">Course</th>
            <th className="p-2">Order</th>
            <th className="p-2">Updated</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {modules.map((m: any) => (
            <tr key={m.id} className="border-b">
              <td className="p-2">{m.title}</td>
              <td className="p-2">{m.course_id}</td>
              <td className="p-2">{m.order_index}</td>
              <td className="p-2">{m.updated_at?.slice(0, 10)}</td>

              <td className="p-2 flex gap-2">
                <Link href={`/admin/module/${m.id}/edit`} className="text-blue-600">Edit</Link>
                <button onClick={() => remove(m.id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
