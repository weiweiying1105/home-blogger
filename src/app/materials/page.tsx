"use client";

import { useEffect, useRef, useState } from "react";

type Material = {
  id: string;
  title: string;
  category: string;
  description: string;
  summary: string;
  colors: string;
  filePath: string;
};

export default function MaterialsPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [tab, setTab] = useState<"all" | "home" | "outfit">("all");
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const url = tab === "all" ? "/api/materials" : `/api/materials?category=${tab}`;
    const res = await fetch(url);
    setItems(await res.json());
  };

  useEffect(() => { load(); }, [tab]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", tab === "outfit" ? "outfit" : "home");
      await fetch("/api/upload", { method: "POST", body: fd });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function update(id: string, data: Partial<Material>) {
    await fetch(`/api/materials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("删除这张素材？")) return;
    await fetch(`/api/materials/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">审美素材库</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(["all", "home", "outfit"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-sm ${tab === t ? "bg-ink text-cream" : "bg-white"}`}>
                {t === "all" ? "全部" : t === "home" ? "家居" : "穿搭"}
              </button>
            ))}
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:opacity-90">
            {uploading ? "上传中..." : "+ 上传图片"}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*"
            className="hidden" onChange={onUpload} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((m) => (
          <div key={m.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-accent/10 group">
            <div className="relative">
              <img src={m.filePath} alt={m.title} className="w-full h-40 object-cover" />
              <button onClick={() => remove(m.id)}
                className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                删除
              </button>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium truncate">{m.title}</p>
              <p className="text-xs text-ink/60 mt-1 line-clamp-2">{m.description || "暂无描述"}</p>
              {m.colors && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.colors.split(/[、,，]/).filter(Boolean).map((c, i) => (
                    <span key={i} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">{c.trim()}</span>
                  ))}
                </div>
              )}
              <button onClick={() => setEditing(m)}
                className="text-xs text-accent mt-2 hover:underline">编辑描述/配色</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 z-20 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">编辑素材</h2>
            <img src={editing.filePath} className="w-full h-32 object-cover rounded-lg mb-4" />
            <label className="block text-xs text-ink/60 mb-1">标题</label>
            <input value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="block text-xs text-ink/60 mb-1">描述（AI 已生成，可修改）</label>
            <textarea value={editing.description} rows={3}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="block text-xs text-ink/60 mb-1">总结</label>
            <textarea value={editing.summary} rows={2}
              onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="block text-xs text-ink/60 mb-1">配色（顿号分隔）</label>
            <input value={editing.colors}
              onChange={(e) => setEditing({ ...editing, colors: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-ink/60">取消</button>
              <button onClick={() => update(editing.id, editing)}
                className="px-4 py-2 text-sm bg-ink text-cream rounded-lg">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
