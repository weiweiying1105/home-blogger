"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NoteRenderer from "./NoteRenderer";

// 站内 Markdown 编辑器：左侧书写 + 右侧实时预览
export default function NoteEditor({
  initial,
  categories,
}: {
  initial?: { id: string; title: string; content: string; category: string };
  categories: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      alert("标题不能为空");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(initial ? `/api/notes/${initial.id}` : "/api/notes", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });
      const j = await r.json();
      if (!r.ok) {
        alert(j.error || "保存失败");
        return;
      }
      router.push(`/notes/${j.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题"
          className="w-1/2 text-xl font-semibold border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-stone-300"
        />
        <div className="flex items-center gap-2">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="分类（可选）"
            list="note-categories"
            className="border rounded-lg px-3 py-2 text-sm w-40 outline-none focus:ring-2 focus:ring-stone-300"
          />
          <datalist id="note-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <button
            onClick={save}
            disabled={saving}
            className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"# 支持 Markdown\n\n- 任务清单 `- [ ]`\n- **加粗**、*斜体*\n\n```js\n代码块\n```\n\n> 引用\n\n| 表格 | 列 |\n| --- | --- |\n| a | b |"}
          className="w-full h-[70vh] border rounded-lg p-4 font-mono text-sm leading-6 outline-none focus:ring-2 focus:ring-stone-300 resize-y"
          spellCheck={false}
        />
        <div className="w-full h-[70vh] overflow-y-auto border rounded-lg p-6 bg-white">
          <NoteRenderer content={content} />
        </div>
      </div>
    </div>
  );
}
