"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewTopic() {
  const router = useRouter();

  const [modules, setModules] = useState([]); // FIX: ini modules, bukan topics
  const [form, setForm] = useState({
    title: "",
    description: "",
    module_id: "",
    order_index: 1,
  });

  // Ambil data module
  useEffect(() => {
    async function loadModules() {
      const res = await fetch("/api/module");  // FIX: ambil MODULE, bukan topic
      const data = await res.json();
      setModules(data);
    }
    loadModules();
  }, []);

  async function submit(e: any) {
    e.preventDefault();

    await fetch("/api/topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // FIX wajib
      body: JSON.stringify(form),
    });

    router.push("/admin/topic");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create Topic</h1>

      <form onSubmit={submit} className="flex flex-col gap-4 max-w-xl">

        {/* Select Module */}
        <select
          className="border p-2"
          value={form.module_id}
          onChange={(e) => setForm({ ...form, module_id: e.target.value })}
        >
          <option value="">-- Select Module --</option>
          {modules.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>

        <input
          className="border p-2"
          placeholder="Topic Title"
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

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Create Topic
        </button>
      </form>
    </div>
  );
}
