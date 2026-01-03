"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CourseList() {
  const [courses, setCourses] = useState([]);

  async function load() {
    const res = await fetch("/api/course");
    const data = await res.json();
    setCourses(data);
  }

  async function remove(id: number) {
    if (!confirm("Delete this course?")) return;
    await fetch(`/api/course/${id}`, { method: "DELETE" });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Link href="/admin/course/new" className="px-4 py-2 bg-blue-600 text-white rounded">+ New</Link>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Title</th>
            <th className="p-2">Slug</th>
            <th className="p-2">Updated</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c: any) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.title}</td>
              <td className="p-2">{c.slug}</td>
              <td className="p-2">{c.updated_at?.slice(0,10)}</td>
              <td className="p-2 flex gap-2">
                <Link href={`/admin/course/${c.id}/edit`} className="text-blue-600">Edit</Link>
                <button onClick={() => remove(c.id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
