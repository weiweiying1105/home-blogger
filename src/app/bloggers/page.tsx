"use client";

import { useEffect, useState } from "react";

type Blogger = {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  insUrl: string;
  followers: string;
  sortOrder: number;
};

const EMPTY = { username: "", name: "", bio: "", avatarUrl: "", coverUrl: "", insUrl: "", followers: "" };

export default function BloggersPage() {
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Blogger | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);

  async function load() {
    const r = await fetch("/api/bloggers");
    setBloggers(await r.json());
  }
  useEffect(() => { load(); }, []);

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

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索账号名或名字..."
          className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-stone-400 text-center py-10">暂无博主</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
              <img
                src={b.coverUrl || `/bloggers/covers/${b.username}.jpg`}
                alt={b.username}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = b.avatarUrl || `/bloggers/${b.username}.jpg`; }}
              />
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="font-semibold text-sm leading-snug">{b.name || `@${b.username}`}</div>
              <div className="text-xs text-stone-400 mt-0.5">@{b.username}</div>
              {b.followers && <div className="text-xs text-stone-400 mt-1">{b.followers} 粉丝</div>}
              <div className="flex gap-2 mt-3">
                <a
                  href={b.insUrl || `https://www.instagram.com/${b.username}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center text-xs bg-stone-100 hover:bg-stone-200 rounded-lg py-1.5"
                >
                  Ins
                </a>
                <button
                  onClick={() => { setEditing(b); setForm({ username: b.username, name: b.name, bio: b.bio, avatarUrl: b.avatarUrl, coverUrl: b.coverUrl, insUrl: b.insUrl, followers: b.followers }); setAdding(true); }}
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
                <label className="block text-sm text-stone-500 mb-1">粉丝数</label>
                <input
                  value={form.followers}
                  onChange={(e) => setForm({ ...form, followers: e.target.value })}
                  placeholder="例如 110K"
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
                <label className="block text-sm text-stone-500 mb-1">代表性家居图（可选，默认 /bloggers/covers/xxx.jpg）</label>
                <input
                  value={form.coverUrl}
                  onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                  placeholder="/bloggers/covers/xxx.jpg 或 https://..."
                  className="w-full border rounded-lg px-3 py-2 text-sm"
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
