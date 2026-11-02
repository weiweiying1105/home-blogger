"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NoteRenderer from "./NoteRenderer";
import HtmlPreview, { isHtml } from "./HtmlPreview";

// 站内笔记编辑器：左侧书写 + 右侧实时预览；支持 Markdown 与 HTML 两种输入，右侧分别渲染成文档/网页
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
  const [showPreview, setShowPreview] = useState(true);
  const [mode, setMode] = useState<"md" | "html">(
    initial && isHtml(initial.content) ? "html" : "md"
  );

  // Ctrl+S / Cmd+S：阻止浏览器默认保存页面，改为保存笔记
  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      save();
    }
  }

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
    <div className="space-y-4" onKeyDown={onKeyDown}>
      <div className="flex items-center justify-between">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题"
          className="w-1/2 text-xl font-semibold border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-stone-300"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="border rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
          >
            {showPreview ? "隐藏成品" : "显示成品"}
          </button>
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

      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode("md")}
          className={`px-3 py-1.5 rounded-lg text-sm border ${
            mode === "md"
              ? "bg-stone-800 text-white border-stone-800"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Markdown
        </button>
        <button
          onClick={() => setMode("html")}
          className={`px-3 py-1.5 rounded-lg text-sm border ${
            mode === "html"
              ? "bg-stone-800 text-white border-stone-800"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          HTML
        </button>
        <span className="text-xs text-stone-400">
          {mode === "md" ? "Markdown 文档" : "HTML 网页，右侧实时预览"}
        </span>
      </div>

      <div className={`grid gap-4 items-start ${showPreview ? "grid-cols-2" : "grid-cols-1"}`}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            mode === "md"
              ? "# 支持 Markdown\n\n- 任务清单 `- [ ]`\n- **加粗**、*斜体*\n\n```js\n代码块\n```\n\n> 引用\n\n| 表格 | 列 |\n| --- | --- |\n| a | b |"
              : "<!DOCTYPE html>\n<html>\n<head>\n  <style>body { font-family: sans-serif; }</style>\n</head>\n<body>\n  <h1>我的网页</h1>\n  <p>右侧实时预览效果</p>\n</body>\n</html>"
          }
          className="w-full h-[70vh] border rounded-lg p-4 font-mono text-sm leading-6 outline-none focus:ring-2 focus:ring-stone-300 resize-y"
          spellCheck={false}
        />
        {showPreview && (
          <div className="w-full min-h-[70vh] overflow-y-auto border rounded-lg bg-white">
            {mode === "md" ? (
              <div className="p-6">
                <NoteRenderer content={content} />
              </div>
            ) : (
              <HtmlPreview html={content} className="min-h-[70vh]" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
