"use client";

import { useEffect, useState, useCallback } from "react";
import PlanForm from "@/components/PlanForm";

type Plan = {
  id: string;
  title: string;
  content: string;
  materials: { image: { id: string; url: string; thumbnail: string | null; title: string } }[];
};

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/plans");
    setPlans(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("删除这条计划？")) return;
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">发布计划</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm"
        >
          + 新建计划
        </button>
      </div>

      {showForm && (
        <PlanForm
          plan={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      <div className="grid gap-4">
        {plans.length === 0 && (
          <p className="text-sm text-stone-400 py-12 text-center">还没有发布计划，点右上角新建一条吧</p>
        )}
        {plans.map((p) => (
          <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="font-medium">{p.title}</h2>
                {p.content && <p className="text-sm text-stone-600 mt-1 whitespace-pre-wrap">{p.content}</p>}
                {p.materials.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {p.materials.map(({ image }) => (
                      <img key={image.id} src={image.thumbnail || image.url} alt={image.title}
                        className="w-16 h-16 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => { setEditing(p); setShowForm(true); }}
                  className="text-sm text-stone-500 hover:underline">编辑</button>
                <button onClick={() => remove(p.id)}
                  className="text-sm text-red-400 hover:underline">删除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
