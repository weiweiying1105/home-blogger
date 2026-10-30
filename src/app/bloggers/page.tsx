"use client";

import { useEffect, useState } from "react";
import BloggerCoverPicker from "@/components/BloggerCoverPicker";

type Blogger = {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  homepage: string;
  sortOrder: number;
};

const EMPTY = { username: "", name: "", bio: "", avatarUrl: "", coverUrl: "", homepage: "" };

export default function BloggersPage() {
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Blogger | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  async function load() {
    const r = await fetch("/api/bloggers");
    setBloggers(await r.json());
  }
  useEffect(() => { load(); }, []);

  /** 按新顺序批量保存 sortOrder（喜欢的博主排前面，自动保存） */
  async function saveOrder(newVisible: Blogger[]) {
    setSavingOrder(true);
    // 保持全表位置骨架，仅替换可见卡片顺序
    const pos = new Map(newVisible.map((b, i) => [b.id, b]));
    const full = bloggers.map((b) => (pos.has(b.id) ? pos.get(b.id)! : b));
    const reordered = full.map((b, i) => ({ ...b, sortOrder: i }));
    setBloggers(reordered);
    const chunks = [];
    for (let i = 0; i < reordered.length; i += 5) chunks.push(reordered.slice(i, i + 5));
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((b) =>
          fetch(`/api/bloggers/${b.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: b.sortOrder }),
          })
        )
      );
    }
    setSavingOrder(false);
    load();
  }

  /** 上移/下移一位 */
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= filtered.length) return;
    const list = [...filtered];
    const [m] = list.splice(index, 1);
    list.splice(target, 0, m);
    saveOrder(list);
  }

  async function save() {
    if (!form.username.trim()) return;
    if (editing) {
      await fetch(`/api/bloggers/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/bloggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setAdding(false);
    setEditing(null);
    setForm(EMPTY);
    load();
  }

  async function remove(b: Blogger) {
    if (!confirm(`删除博主 @${b.username}？`)) return;
    await fetch(`/api/bloggers/${b.id}`, { method: "DELETE" });
    load();
  }

  const filtered = bloggers.filter((b) =>
    !q || b.username.toLowerCase().includes(q.toLowerCase()) || b.name.includes(q)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">博主管理</h1>
        <button
          onClick={() => { setEditing(null); setForm(EMPTY); setAdding(true); }}
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm"
        >
          + 新增博主
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索账号名或名字..."
          className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm"
        />
        <span className="text-xs text-stone-400">拖动卡片或 ▲▼ 调整排序（喜欢的博主放前面，自动保存）</span>
      </div>

      {filtered.length === 0 && (
        <p className="text-stone-400 text-center py-10">暂无博主</p>
      )}

      {savingOrder && (
        <div className="fixed bottom-4 right-4 bg-stone-800 text-white text-xs px-3 py-2 rounded-lg shadow z-50">
          排序保存中...
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((b, idx) => (
          <div
            key={b.id}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
            onDrop={() => {
              if (dragIdx !== null && dragIdx !== idx) {
                const list = [...filtered];
                const [m] = list.splice(dragIdx, 1);
                list.splice(idx, 0, m);
                saveOrder(list);
              }
              setDragIdx(null);
              setOverIdx(null);
            }}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            className={`bg-white rounded-xl border overflow-hidden flex flex-col cursor-grab active:cursor-grabbing transition ${
              overIdx === idx ? "border-stone-800 border-2" : "border-stone-200"
            }`}
          >
            <div className="aspect-[4/3] bg-stone-100 overflow-hidden relative">
              <img
                src={b.coverUrl || `/bloggers/covers/${b.username}.jpg`}
                alt={b.username}
                className="w-full h-full object-cover pointer-events-none"
                onError={(e) => { (e.target as HTMLImageElement).src = b.avatarUrl || `/bloggers/${b.username}.jpg`; }}
              />
              <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                #{idx + 1}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <div className="font-semibold text-sm leading-snug">{b.name || `@${b.username}`}</div>
                  <div className="text-xs text-stone-400 mt-0.5">@{b.username}</div>
                </div>
                <div className="flex flex-col shrink-0">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    title="上移"
                    className="text-stone-400 hover:text-stone-800 disabled:opacity-30 text-xs leading-none px-1"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === filtered.length - 1}
                    title="下移"
                    className="text-stone-400 hover:text-stone-800 disabled:opacity-30 text-xs leading-none px-1 mt-0.5"
                  >
                    ▼
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <a
                  href={b.homepage || `https://www.instagram.com/${b.username}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center text-xs bg-stone-100 hover:bg-stone-200 rounded-lg py-1.5"
                >
                  主页
                </a>
                <button
                  onClick={() => { setEditing(b); setForm({ username: b.username, name: b.name, bio: b.bio, avatarUrl: b.avatarUrl, coverUrl: b.coverUrl, homepage: b.homepage }); setAdding(true); }}
                  className="flex-1 text-xs bg-stone-800 text-white rounded-lg py-1.5"
                >
                  编辑
                </button>
                <button
                  onClick={() => remove(b)}
                  className="text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg py-1.5 px-2"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? "编辑博主" : "新增博主"}</h3>
              <button onClick={() => { setAdding(false); setEditing(null); }} className="text-stone-400 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-500 mb-1">Ins 账号（必填）</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="例如 oneroom.make"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">名字 / 简介</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="博主显示名或简介"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">主页链接（可选，默认 Ins 主页）</label>
                <input
                  value={form.homepage}
                  onChange={(e) => setForm({ ...form, homepage: e.target.value })}
                  placeholder="https://www.instagram.com/xxx/ 或官网链接"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">头像图路径（可选，默认自动生成）</label>
                <input
                  value={form.avatarUrl}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  placeholder="/bloggers/xxx.jpg 或 https://..."
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">代表性家居图（可粘贴 / 从图库选 / 上传）</label>
                <BloggerCoverPicker
                  value={form.coverUrl}
                  onChange={(url) => setForm({ ...form, coverUrl: url })}
                  fallback={editing ? `/bloggers/covers/${editing.username}.jpg` : undefined}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setAdding(false); setEditing(null); }} className="px-4 py-2 text-sm text-stone-500">取消</button>
              <button onClick={save} className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
