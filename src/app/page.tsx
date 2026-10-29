"use client";

import { useEffect, useState, useCallback } from "react";
import PlanForm from "@/components/PlanForm";

type Plan = {
  id: string;
  title: string;
  content: string;
  element: string;
  status: string;
  materials: { image: { id: string; url: string; thumbnail: string | null; title: string } }[];
};

const STATUS_TABS = [
  { key: "draft", label: "未发布" },
  { key: "published", label: "已发布" },
  { key: "all", label: "全部" },
] as const;

type StatusKey = "draft" | "published" | "all";

const PAGE_SIZE = 10;

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [status, setStatus] = useState<StatusKey>("draft");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (targetPage: number, append: boolean) => {
    const res = await fetch(`/api/plans?status=${status}&page=${targetPage}&pageSize=${PAGE_SIZE}`);
    const data = await res.json();
    setPlans((prev) => (append ? [...prev, ...data.items] : data.items));
    setPage(targetPage);
    setHasMore(data.hasMore);
  }, [status]);

  useEffect(() => { load(1, false); }, [load]);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    await load(page + 1, true);
    setLoadingMore(false);
  }

  async function remove(id: string) {
    if (!confirm("删除这条计划？")) return;
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    load(1, false);
  }

  async function toggleStatus(p: Plan) {
    await fetch(`/api/plans/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: p.status === "published" ? "draft" : "published" }),
    });
    load(1, false);
  }

  const emptyText =
    status === "draft"
      ? "还没有未发布的计划"
      : status === "published"
        ? "还没有已发布的计划"
        : "还没有发布计划，点右上角新建一条吧";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">发布计划</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm"
        >
          + 新建计划
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm ${
              status === tab.key ? "bg-stone-800 text-white" : "bg-white border text-stone-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {showForm && (
        <PlanForm
          plan={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(1, false); }}
        />
      )}

      <div className="grid gap-4">
        {plans.length === 0 && (
          <p className="text-sm text-stone-400 py-12 text-center">{emptyText}</p>
        )}
        {plans.map((p) => (
          <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">{p.title}</h2>
                  {p.status === "published" ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                      已发布
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 shrink-0">
                      未发布
                    </span>
                  )}
                </div>
                {p.element && (
                  <p className="text-xs text-stone-400 mt-1">元素：{p.element}</p>
                )}
                {p.content && <p className="text-sm text-stone-600 mt-1 whitespace-pre-wrap">{p.content}</p>}
                {p.materials.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {p.materials.map(({ image }) => (
                      <img key={image.id} src={image.thumbnail || image.url} alt={image.title}
                        className="w-24 h-24 object-cover rounded-full" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                <button
                  onClick={() => toggleStatus(p)}
                  className={`text-xs px-3 py-1 rounded-lg ${
                    p.status === "published"
                      ? "bg-white border text-stone-600"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {p.status === "published" ? "撤回发布" : "发布"}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(p); setShowForm(true); }}
                    className="text-sm text-stone-500 hover:underline">编辑</button>
                  <button onClick={() => remove(p.id)}
                    className="text-sm text-red-400 hover:underline">删除</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-white border px-6 py-2 rounded-lg text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50"
          >
            {loadingMore ? "加载中..." : "加载更多"}
          </button>
        </div>
      )}
    </div>
  );
}
