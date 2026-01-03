"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditModule() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    course_id: "",
    order_index: 1,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const cRes = await fetch("/api/course");
      const cData = await cRes.json();
      setCourses(cData);

      const mRes = await fetch(`/api/module/${id}`);
      const mData = await mRes.json();

      setForm({
        title: mData.title,
        description: mData.description ?? "",
        course_id: mData.course_id,
        order_index: mData.order_index ?? 1,
      });

      setLoading(false);
    }

    fetchAll();
  }, [id]);

  async function submit(e: any) {
    e.preventDefault();

    await fetch(`/api/module/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    router.push("/admin/module");
  }

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Module</h1>

      <form onSubmit={submit} className="flex flex-col gap-4 max-w-xl">

        <select
          className="border p-2"
          value={form.course_id}
          onChange={(e) => setForm({ ...form, course_id: e.target.value })}
        >
          <option value="">-- Select Course --</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <input
          className="border p-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
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
          type="number"
          className="border p-2"
          placeholder="Order Index"
          value={form.order_index}
          onChange={(e) =>
            setForm({ ...form, order_index: Number(e.target.value) })
          }
        />

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Update Module
        </button>

      </form>
    </div>
  );
}
