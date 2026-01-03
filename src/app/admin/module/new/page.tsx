"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewModule() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    course_id: "",
    order_index: 1,
  });

  useEffect(() => {
    async function loadCourses() {
      const res = await fetch("/api/course");
      const data = await res.json();
      setCourses(data);
    }
    loadCourses();
  }, []);

  async function submit(e: any) {
    e.preventDefault();

    await fetch("/api/module", {
      method: "POST",
      body: JSON.stringify(form),
    });

    router.push("/admin/module");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create Module</h1>

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
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          type="number"
          className="border p-2"
          placeholder="Order Index"
          value={form.order_index}
          onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Create Module
        </button>

      </form>
    </div>
  );
}
