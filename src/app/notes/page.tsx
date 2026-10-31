"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NoteMeta = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [cat, setCat] = useState("");

  async function load() {
    const r = await fetch("/api/notes");
    setNotes(await r.json());
  }
  useEffect(() => { load(); }, []);

  const categories = [...new Set(notes.map((n) => n.category).filter(Boolean))].sort();
  const shown = cat ? notes.filter((n) => n.category === cat) : notes;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-stone-900">笔记</h1>
        <Link
          href="/notes/new"
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700"
        >
          + 新建笔记
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCat("")}
            className={`px-3 py-1 rounded-full text-sm ${
              !cat ? "bg-stone-800 text-white" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1 rounded-full text-sm ${
                cat === c ? "bg-stone-800 text-white" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-stone-400 text-sm mt-10 text-center">
          {cat ? `「${cat}」还没有笔记` : "还没有笔记，点右上角新建一篇吧"}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((n) => (
            <Link
              key={n.id}
              href={`/notes/${n.id}`}
              className="block bg-white rounded-xl border border-stone-200 p-4 hover:shadow-md hover:border-stone-300 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-stone-900 leading-snug line-clamp-2">{n.title}</h3>
                {n.category && (
                  <span className="shrink-0 text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                    {n.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                {new Date(n.createdAt).toLocaleString("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
