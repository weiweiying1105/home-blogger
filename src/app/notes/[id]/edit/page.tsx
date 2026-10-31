"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NoteEditor from "@/components/NoteEditor";

type Note = { id: string; title: string; content: string; category: string };

export default function EditNotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/notes/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((n) => setNote(n))
      .catch(() => router.replace("/notes"));
    fetch("/api/notes")
      .then((r) => r.json())
      .then((arr) =>
        setCategories(
          [...new Set((arr as Array<{ category: string }>).map((n) => n.category).filter(Boolean))].sort()
        )
      )
      .catch(() => {});
  }, [id, router]);

  if (!note) return <p className="text-stone-400 mt-10">加载中...</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-stone-400 hover:text-stone-800 text-xl">←</button>
        <h1 className="text-xl font-semibold text-stone-900">编辑笔记</h1>
      </div>
      <NoteEditor initial={note} categories={categories} />
    </div>
  );
}
