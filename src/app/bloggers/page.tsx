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
  tags: string;
  sortOrder: number;
};

const EMPTY = { username: "", name: "", bio: "", avatarUrl: "", coverUrl: "", homepage: "", tags: "", sortOrder: "" };

export default function BloggersPage() {
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [editing, setEditing] = useState<Blogger | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [savingOrderId, setSavingOrderId] = useState("");

  async function load() {
    const r = await fetch("/api/bloggers");
    setBloggers(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.username.trim()) return;
    const payload = {
      username: form.username,
      name: form.name,
      bio: form.bio,
      avatarUrl: form.avatarUrl,
      coverUrl: form.coverUrl,
      homepage: form.homepage,
      tags: form.tags,
      sortOrder: form.sortOrder === "" ? 0 : Number(form.sortOrder),
    };
    if (editing) {
      await fetch(`/api/bloggers/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/bloggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setAdding(false);
    setEditing(null);
    setForm(EMPTY);
    load();
  }

  /** 只更新单个博主的排序权重（数字越小越靠前），只调一个接口 */
  async function saveOrder(b: Blogger) {
    const v = Number(orderDrafts[b.id]);
    if (Number.isNaN(v)) return;
    setSavingOrderId(b.id);
    await fetch(`/api/bloggers/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: v }),
    });
    setSavingOrderId("");
    load();
  }

  async function remove(b: Blogger) {
    if (!confirm(`删除博主 @${b.username}？`)) return;
    await fetch(`/api/bloggers/${b.id}`, { method: "DELETE" });
    load();
  }

  // 全部标签（去重）
  const allTags = Array.from(
    new Set(
      bloggers
        .flatMap((b) => (b.tags || "").split(",").map((t) => t.trim()).filter(Boolean))
    )
  ).sort();

  const filtered = bloggers.filter((b) => {
    const okQ =
      !q || b.username.toLowerCase().includes(q.toLowerCase()) || b.name.includes(q);
    const okTag =
      !activeTag || (b.tags || "").split(",").map((t) => t.trim()).includes(activeTag);
    return okQ && okTag;
  });

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

      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索账号名或名字..."
            className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-xs text-stone-400">权重数字越小越靠前，改单个不牵连其它</span>
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTag("")}
              className={`text-xs px-3 py-1 rounded-full border ${
                !activeTag ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"
              }`}
            >
              全部
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(activeTag === t ? "" : t)}
                className={`text-xs px-3 py-1 rounded-full border ${
                  activeTag === t ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="text-stone-400 text-center py-10">暂无博主</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((b, idx) => (
          <div
            key={b.id}
            className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col"
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
              <div className="min-w-0">
                <div className="font-semibold text-sm leading-snug">{b.name || `@${b.username}`}</div>
                <div className="text-xs text-stone-400 mt-0.5">@{b.username}</div>
              </div>
              {b.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {b.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTag(activeTag === t ? "" : t)}
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        activeTag === t ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-3">
                <input
                  type="number"
                  value={orderDrafts[b.id] ?? String(b.sortOrder)}
                  onChange={(e) => setOrderDrafts({ ...orderDrafts, [b.id]: e.target.value })}
                  title="排序权重，越小越靠前"
                  className="w-16 border rounded-lg px-2 py-1 text-xs"
                />
                <button
                  onClick={() => saveOrder(b)}
                  disabled={savingOrderId === b.id}
                  className="text-xs bg-stone-100 hover:bg-stone-200 rounded-lg py-1.5 px-2.5 disabled:opacity-50"
                >
                  {savingOrderId === b.id ? "保存中" : "保存权重"}
                </button>
                <a
                  href={b.homepage || `https://www.instagram.com/${b.username}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center text-xs bg-stone-100 hover:bg-stone-200 rounded-lg py-1.5"
                >
                  主页
                </a>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setEditing(b); setForm({ username: b.username, name: b.name, bio: b.bio, avatarUrl: b.avatarUrl, coverUrl: b.coverUrl, homepage: b.homepage, tags: b.tags, sortOrder: String(b.sortOrder) }); setAdding(true); }}
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                <label className="block text-sm text-stone-500 mb-1">标签（逗号分隔，可多选分类）</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="例如 家居, 静物拍摄, 配色"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-500 mb-1">排序权重（数字越小越靠前，可留空）</label>
                <input
                  type="number"
                  value={form.sortOrder ?? ""}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  placeholder="默认 0"
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
