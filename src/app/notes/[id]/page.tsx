"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import NoteRenderer from "@/components/NoteRenderer";

type Note = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/notes/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("not found")))
      .then(setNote)
      .catch(() => setErr("笔记不存在或已删除"));
  }, [id]);

  async function remove() {
    if (!confirm("确定删除这篇笔记？")) return;
    const r = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (r.ok) router.push("/notes");
  }

  if (err)
    return (
      <div className="text-center mt-20">
        <p className="text-stone-500 mb-4">{err}</p>
        <Link href="/notes" className="text-stone-700 underline">返回笔记列表</Link>
      </div>
    );
  if (!note) return <p className="text-stone-400 mt-10">加载中...</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="text-stone-400 hover:text-stone-800 text-xl">←</button>
        <h1 className="text-2xl font-bold text-stone-900">{note.title}</h1>
      </div>
      <div className="flex items-center gap-3 mb-8 text-xs text-stone-400">
        <span>
          {new Date(note.createdAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })}
        </span>
        {note.category && (
          <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{note.category}</span>
        )}
        <span className="flex-1" />
        <Link href={`/notes/${note.id}/edit`} className="text-stone-500 hover:text-stone-800 px-2">
          编辑
        </Link>
        <button onClick={remove} className="text-red-400 hover:text-red-600 px-2">删除</button>
      </div>
      <article className="bg-white rounded-xl border border-stone-200 p-8">
        <NoteRenderer content={note.content} />
      </article>
    </div>
  );
}
