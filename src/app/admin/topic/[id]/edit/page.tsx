"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditTopic() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [modules, setModules] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    module_id: "",
    order_index: 1,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const cRes = await fetch("/api/module");
      const cData = await cRes.json();
      setModules(cData);

      const mRes = await fetch(`/api/topic/${id}`);
      const mData = await mRes.json();

      setForm({
        title: mData.title,
        description: mData.description ?? "",
        module_id: mData.course_id,
        order_index: mData.order_index ?? 1,
      });

      setLoading(false);
    }

    fetchAll();
  }, [id]);

  async function submit(e: any) {
    e.preventDefault();

    await fetch(`/api/topic/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    router.push("/admin/topic");
  }

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Topics</h1>

      <form onSubmit={submit} className="flex flex-col gap-4 max-w-xl">

        <select
          className="border p-2"
          value={form.module_id}
          onChange={(e) => setForm({ ...form, module_id: e.target.value })}
        >
          <option value="">-- Select modules --</option>
          {modules.map((c: any) => (
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
          Update Topics
        </button>

      </form>
    </div>
  );
}
