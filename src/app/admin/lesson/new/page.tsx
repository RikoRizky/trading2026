"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewLesson() {
  const router = useRouter();

  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState({
    title: "",
    content: "",
    topic_id: "",
    order_index: 1,
  });

  useEffect(() => {
    async function loadTopics() {
      const res = await fetch("/api/topic");
      const data = await res.json();
      setTopics(data);
    }
    loadTopics();
  }, []);

  async function submit(e: any) {
    e.preventDefault();

    const res = await fetch("/api/lesson", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (res.ok) router.push("/admin/lesson");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create Lesson</h1>

      <form className="flex flex-col gap-4 max-w-xl" onSubmit={submit}>
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


        {/* DROPDOWN TOPIC */}
        <select
          className="border p-2"
          value={form.topic_id}
          onChange={(e) => setForm({ ...form, topic_id: e.target.value })}
        >
          <option value="">-- Select Topic --</option>
          {topics.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="border p-2"
          placeholder="Order Index"
          value={form.order_index}
          onChange={(e) =>
            setForm({ ...form, order_index: Number(e.target.value) })
          }
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Create
        </button>
      </form>
    </div>
  );
}
