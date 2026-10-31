"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NoteEditor from "@/components/NoteEditor";

export default function NewNotePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((arr) =>
        setCategories(
          [...new Set((arr as Array<{ category: string }>).map((n) => n.category).filter(Boolean))].sort()
        )
      )
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-stone-400 hover:text-stone-800 text-xl">←</button>
        <h1 className="text-xl font-semibold text-stone-900">新建笔记</h1>
      </div>
      <NoteEditor categories={categories} />
    </div>
  );
}
