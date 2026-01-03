"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCourse() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail_url: "",
  });

  async function submit(e: any) {
    e.preventDefault();

    const res = await fetch("/api/course", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (res.ok) router.push("/admin/course");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create Course</h1>

      <form onSubmit={submit} className="flex flex-col gap-4 max-w-xl">
        <input className="border p-2" placeholder="Title"
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <input className="border p-2" placeholder="Slug"
          value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

        <textarea className="border p-2" placeholder="Description"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <input className="border p-2" placeholder="Thumbnail URL"
          value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
      </form>
    </div>
  );
}
