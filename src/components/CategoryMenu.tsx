"use client";

import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  children?: Category[];
};

export default function CategoryMenu({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [parentId, setParentId] = useState("");

  async function load() {
    const res = await fetch("/api/categories");
    setCats(await res.json());
  }

  useEffect(() => { load(); }, []);

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // 选中某个分类时展开其祖先，保证选中项可见
  function select(id: string) {
    onSelect(id);
    setCollapsed((prev) => {
      if (!prev.size) return prev;
      const next = new Set(prev);
      const walk = (list: Category[], chain: string[]): boolean =>
        list.some((c) => {
          if (c.id === id) {
            chain.forEach((a) => next.delete(a));
            return true;
          }
          return c.children ? walk(c.children, [...chain, c.id]) : false;
        });
      walk(cats, []);
      return next;
    });
  }

  async function addCategory() {
    if (!newName.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, parentId: parentId || null }),
    });
    setNewName("");
    load();
  }

  async function removeCategory(id: string) {
    if (!confirm("删除这个分类？")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (id === activeId) onSelect("");
    load();
  }

  function renderCats(list: Category[], depth: number = 0) {
    return list.map((c) => {
      const hasChildren = !!c.children && c.children.length > 0;
      const isCollapsed = collapsed.has(c.id);
      const isActive = activeId === c.id;
      return (
        <li key={c.id}>
          <div
            className={`flex items-center gap-1 py-1.5 px-2 rounded-lg group cursor-pointer ${
              isActive ? "bg-stone-800 text-white" : "hover:bg-stone-100"
            }`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggle(c.id)}
                className={`w-4 text-[10px] ${isActive ? "text-stone-300" : "text-stone-400"}`}
              >
                {isCollapsed ? "▸" : "▾"}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <button
              onClick={() => select(c.id)}
              className={`text-sm flex-1 text-left truncate ${
                isActive ? "font-medium" : "text-stone-600"
              }`}
            >
              {c.name}
            </button>
            <button
              onClick={() => removeCategory(c.id)}
              className={`opacity-0 group-hover:opacity-60 text-xs ${isActive ? "text-red-300" : "text-red-500"}`}
            >
              ×
            </button>
          </div>
          {hasChildren && !isCollapsed && (
            <ul>{renderCats(c.children!, depth + 1)}</ul>
          )}
        </li>
      );
    });
  }

  return (
    <aside className="w-56 shrink-0">
      <div className="sticky top-8 rounded-xl border border-stone-200 bg-white p-2">
        <button
          onClick={() => onSelect("")}
          className={`w-full flex items-center px-2 py-1.5 rounded-lg text-sm ${
            !activeId
              ? "bg-stone-800 text-white font-medium"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          全部
        </button>
        <ul>{renderCats(cats)}</ul>

        {/* 新建分类 */}
        <div className="mt-2 border-t border-stone-100 pt-2 px-2">
          {adding ? (
            <div className="space-y-2 py-1">
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full border rounded-lg px-2 py-1 text-sm"
              >
                <option value="">顶级分类</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                placeholder="新分类名，回车创建"
                autoFocus
                className="w-full border rounded-lg px-2 py-1 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={addCategory}
                  className="bg-stone-800 text-white px-3 py-1 rounded-lg text-sm"
                >
                  添加
                </button>
                <button
                  onClick={() => { setAdding(false); setNewName(""); }}
                  className="px-3 py-1 rounded-lg text-sm text-stone-500 hover:text-stone-800"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-left px-0 py-1 text-sm text-stone-400 hover:text-stone-700"
            >
              + 新建分类
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
