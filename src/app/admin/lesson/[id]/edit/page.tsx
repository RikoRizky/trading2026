"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditLesson() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    title: "",
    content: "",
    topic_id: "",
    order_index: 1,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/lesson/${id}`);
      const data = await res.json();

      setForm({
        title: data.title,
        content: data.content ?? "",
        topic_id: data.topic_id ?? "",
        order_index: data.order_index ?? 1,
      });

      setLoading(false);
    }
    fetchData();
  }, [id]);

  async function submit(e: any) {
    e.preventDefault();

    const res = await fetch(`/api/lesson/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) router.push("/admin/lesson");
  }

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Lesson</h1>

      <form onSubmit={submit} className="flex flex-col gap-4 max-w-xl">
        <input
          className="border p-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          className="border p-2"
          placeholder="Content"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />

        <input
          className="border p-2"
          placeholder="Topic ID"
          value={form.topic_id}
          onChange={(e) => setForm({ ...form, topic_id: e.target.value })}
        />

        <input
          type="number"
          className="border p-2"
          placeholder="Order Index"
          value={form.order_index}
          onChange={(e) =>
            setForm({ ...form, order_index: Number(e.target.value) })
          }
        />

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Update Lesson
        </button>
      </form>
    </div>
  );
}
