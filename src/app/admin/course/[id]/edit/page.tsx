"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditCourse() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail_url: "",
  });

  const [loading, setLoading] = useState(true);

  // Ambil data awal
  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/course/${id}`);
      const data = await res.json();

      setForm({
        title: data.title,
        slug: data.slug,
        description: data.description ?? "",
        thumbnail_url: data.thumbnail_url ?? "",
      });

      setLoading(false);
    }
    fetchData();
  }, [id]);

  async function submit(e: any) {
    e.preventDefault();

    const res = await fetch(`/api/course/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) router.push("/admin/course");
  }

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Course</h1>

      <form onSubmit={submit} className="flex flex-col gap-4 max-w-xl">
        <input
          className="border p-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          className="border p-2"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />

        <textarea
          className="border p-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <input
          className="border p-2"
          placeholder="Thumbnail URL"
          value={form.thumbnail_url}
          onChange={(e) =>
            setForm({ ...form, thumbnail_url: e.target.value })
          }
        />

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Update Course
        </button>
      </form>
    </div>
  );
}
