"use client";

import { useEffect, useState } from "react";

type Todo = {
  id: string;
  title: string;
  note: string;
  quadrant: number;
  done: boolean;
  order: number;
};

const QUADRANTS = [
  { n: 1, title: "紧急重要", desc: "立刻做", color: "bg-red-50 border-red-200", head: "text-red-700" },
  { n: 2, title: "重要不紧急", desc: "计划做", color: "bg-blue-50 border-blue-200", head: "text-blue-700" },
  { n: 3, title: "紧急不重要", desc: "委托做", color: "bg-amber-50 border-amber-200", head: "text-amber-700" },
  { n: 4, title: "不紧急不重要", desc: "有空做", color: "bg-stone-50 border-stone-200", head: "text-stone-600" },
];

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [adding, setAdding] = useState<{ q: number; open: boolean; title: string; note: string }>({
    q: 1,
    open: false,
    title: "",
    note: "",
  });
  const [dragId, setDragId] = useState<string | null>(null);
  const [beforeId, setBeforeId] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/todos");
    setTodos(await r.json());
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!adding.title.trim()) return;
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: adding.title, note: adding.note, quadrant: adding.q }),
    });
    setAdding({ q: 1, open: false, title: "", note: "" });
    load();
  }

  async function toggleDone(t: Todo) {
    await fetch(`/api/todos/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    load();
  }

  /** 拖拽落位：quadrant 为目标象限，beforeId 为空则追加到该象限末尾 */
  function handleDrop(quadrant: number, before: string | null) {
    if (!dragId) return;
    const dragged = todos.find((t) => t.id === dragId);
    if (!dragged) return;
    const rest = todos.filter((t) => t.id !== dragId);
    const moved = { ...dragged, quadrant };
    const targetList = rest.filter((t) => t.quadrant === quadrant);
    let idx = before ? targetList.findIndex((t) => t.id === before) : -1;
    if (idx < 0) idx = targetList.length;
    targetList.splice(idx, 0, moved);
    // 源象限与目标象限的最终顺序，一次批量提交
    const items: { id: string; quadrant: number; order: number }[] = [];
    for (const q of new Set([dragged.quadrant, quadrant])) {
      const list = q === quadrant ? targetList : rest.filter((t) => t.quadrant === q);
      list.forEach((t, i) => items.push({ id: t.id, quadrant: q, order: i }));
    }
    setDragId(null);
    setBeforeId(null);
    fetch("/api/todos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then((r) => { if (!r.ok) load(); return r.json(); })
      .then((j) => { if (j?.ok) load(); })
      .catch(() => load());
  }

  return (
    <div>
      <p className="text-xs text-stone-400 mb-4">拖拽事项可跨象限调整优先级，拖到同象限内可调整先后顺序</p>
      <div className="grid grid-cols-2 gap-4">
        {QUADRANTS.map((q) => {
          const list = todos
            .filter((t) => t.quadrant === q.n)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          return (
            <div
              key={q.n}
              onDragOver={(e) => { e.preventDefault(); setBeforeId(null); }}
              onDrop={(e) => { e.preventDefault(); handleDrop(q.n, null); }}
              className={`rounded-xl border ${q.color} p-4 ${dragId ? "min-h-40" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className={`font-semibold ${q.head}`}>{q.title}</h3>
                  <p className="text-xs text-stone-500">{q.desc}</p>
                </div>
                <button
                  onClick={() => setAdding({ q: q.n, open: true, title: "", note: "" })}
                  className="text-stone-400 hover:text-stone-800 text-lg"
                >
                  +
                </button>
              </div>

              {adding.open && adding.q === q.n && (
                <div className="mb-3 bg-white rounded-lg p-2 shadow-sm">
                  <input
                    autoFocus
                    value={adding.title}
                    onChange={(e) => setAdding({ ...adding, title: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && add()}
                    placeholder="要做什么？"
                    className="w-full border rounded px-2 py-1 text-sm mb-1"
                  />
                  <input
                    value={adding.note}
                    onChange={(e) => setAdding({ ...adding, note: e.target.value })}
                    placeholder="备注（可选）"
                    className="w-full border rounded px-2 py-1 text-xs mb-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={add} className="bg-stone-800 text-white px-3 py-1 rounded text-xs">
                      添加
                    </button>
                    <button
                      onClick={() => setAdding({ ...adding, open: false })}
                      className="text-xs text-stone-500 px-2"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {list.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragId(t.id); }}
                    onDragEnd={() => { setDragId(null); setBeforeId(null); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setBeforeId(t.id); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(q.n, t.id); }}
                    className={`bg-white rounded-lg p-2.5 shadow-sm group cursor-grab active:cursor-grabbing ${
                      dragId === t.id ? "opacity-40" : beforeId === t.id ? "ring-2 ring-stone-400" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => toggleDone(t)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${t.done ? "line-through text-stone-400" : ""}`}>
                          {t.title}
                        </p>
                        {t.note && <p className="text-xs text-stone-500 mt-0.5">{t.note}</p>}
                      </div>
                      <button
                        onClick={() => remove(t.id)}
                        className="opacity-0 group-hover:opacity-50 text-xs text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
