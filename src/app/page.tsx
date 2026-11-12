"use client";

import { useEffect, useState, useCallback } from "react";
import PlanForm from "@/components/PlanForm";

type Plan = {
  id: string;
  title: string;
  content: string;
  element: string;
  links: string;
  status: string;
  paid: boolean | null;
  isCommercial: boolean;
  materials: { image: { id: string; url: string; thumbnail: string | null; title: string } }[];
};

const STATUS_TABS = [
  { key: "draft", label: "未发布" },
  { key: "published", label: "已发布" },
  { key: "all", label: "全部" },
] as const;

type StatusKey = "draft" | "published" | "all";

const COMMERCIAL_TABS = [
  { key: "all", label: "全部" },
  { key: "yes", label: "商单" },
  { key: "no", label: "非商单" },
] as const;

type CommercialKey = "all" | "yes" | "no";

const PAID_TABS = [
  { key: "all", label: "全部" },
  { key: "paid", label: "已收款" },
  { key: "unpaid", label: "未收款" },
  { key: "none", label: "未标记" },
] as const;

type PaidKey = "all" | "paid" | "unpaid" | "none";

const PAGE_SIZE = 10;

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [status, setStatus] = useState<StatusKey>("draft");
  const [commercial, setCommercial] = useState<CommercialKey>("all");
  const [paid, setPaidFilter] = useState<PaidKey>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [commercialDraft, setCommercialDraft] = useState<number | null>(null);
  const [unpaidCommercial, setUnpaidCommercial] = useState<number | null>(null);

  // 顶部统计：商单未发布条数、商单未回款条数（独立于当前 tab 的列表数据）
  const loadStats = useCallback(async () => {
    const now = Date.now();
    const [draftRes, unpaidRes] = await Promise.all([
      fetch(`/api/plans?status=draft&commercial=1&page=1&pageSize=1&cb=${now}`),
      fetch(`/api/plans?commercial=1&paid=0&page=1&pageSize=1&cb=${now}`),
    ]);
    try {
      const draftData = await draftRes.json();
      setCommercialDraft(typeof draftData.total === "number" ? draftData.total : 0);
    } catch {
      // 接口抖动时保留上一次的数字，不显示为 0
    }
    try {
      const unpaidData = await unpaidRes.json();
      setUnpaidCommercial(typeof unpaidData.total === "number" ? unpaidData.total : 0);
    } catch {
      // 接口抖动时保留上一次的数字，不显示为 0
    }
  }, []);

  const load = useCallback(async (targetPage: number, append: boolean) => {
    const params = new URLSearchParams({
      status,
      page: String(targetPage),
      pageSize: String(PAGE_SIZE),
    });
    if (commercial === "yes") params.set("commercial", "1");
    else if (commercial === "no") params.set("commercial", "0");
    if (paid === "paid") params.set("paid", "1");
    else if (paid === "unpaid") params.set("paid", "0");
    else if (paid === "none") params.set("paid", "none");

    const res = await fetch(`/api/plans?${params.toString()}`);
    const data = await res.json();
    setPlans((prev) => (append ? [...prev, ...data.items] : data.items));
    setPage(targetPage);
    setHasMore(data.hasMore);
    loadStats();
  }, [status, commercial, paid, loadStats]);

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

  async function setPaid(p: Plan, value: boolean) {
    // 再点一次同一个状态 = 取消标记，回到"未标记"（null，不显示徽标）
    const next = p.paid === value ? null : value;
    const body: Record<string, unknown> = { paid: next };
    // 已收款 / 未收款都属于商单：标记收款时自动把这条设为商单
    if (next !== null) body.isCommercial = true;
    await fetch(`/api/plans/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load(1, false);
  }

  async function toggleCommercial(p: Plan) {
    const next = !p.isCommercial;
    const body: Record<string, unknown> = { isCommercial: next };
    // 商单与收款状态联动：开商单默认未收款，关商单则清掉收款标记
    if (next && p.paid === null) body.paid = false;
    if (!next && p.paid !== null) body.paid = null;
    await fetch(`/api/plans/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load(1, false);
  }

  const emptyText = "没有符合筛选条件的计划";

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold leading-none">
              ¥
            </span>
            商单未发布
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-emerald-700">
              {commercialDraft === null ? "—" : commercialDraft}
            </span>
            <span className="text-xs text-emerald-700/80">条</span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-red-800">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold leading-none">
              ¥
            </span>
            商单未回款
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-red-700">
              {unpaidCommercial === null ? "—" : unpaidCommercial}
            </span>
            <span className="text-xs text-red-700/80">条</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">发布计划</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm"
        >
          + 新建计划
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 w-10 shrink-0">状态</span>
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 w-10 shrink-0">商单</span>
          {COMMERCIAL_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCommercial(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm ${
                commercial === tab.key ? "bg-stone-800 text-white" : "bg-white border text-stone-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 w-10 shrink-0">回款</span>
          {PAID_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPaidFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm ${
                paid === tab.key ? "bg-stone-800 text-white" : "bg-white border text-stone-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
        {plans.map((p) => {
          const links = (p.links || "")
            .split(/[\n,;；，]/)
            .map((s) => s.trim())
            .filter((s) => s.startsWith("http"));
          return (
            <div
              key={p.id}
              onClick={() => { setEditing(p); setShowForm(true); }}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md hover:border-stone-300 border border-transparent cursor-pointer transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.isCommercial && (
                      <span className="inline-flex items-center gap-1 text-xs pl-1 pr-2 py-0.5 rounded-md bg-emerald-600 text-white font-medium shrink-0">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-emerald-600 text-[10px] font-bold leading-none">
                          ¥
                        </span>
                        商单
                      </span>
                    )}
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
                    {p.paid === true && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                        已收款
                      </span>
                    )}
                    {p.paid === false && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
                        未收款
                      </span>
                    )}
                  </div>
                  {p.element && (
                    <p className="text-xs text-stone-400 mt-1">元素：{p.element}</p>
                  )}
                  {p.content && <p className="text-sm text-stone-600 mt-1 whitespace-pre-wrap">{p.content}</p>}
                  {links.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {links.map((l, i) => (
                        <a
                          key={i}
                          href={l}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-sky-600 hover:underline inline-flex items-center gap-1 bg-sky-50 rounded px-2 py-0.5"
                        >
                          <span>🔗</span> 参考链接 {links.length > 1 ? i + 1 : ""}
                        </a>
                      ))}
                    </div>
                  )}
                  {p.materials.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {p.materials.map(({ image }) => (
                        <img
                          key={image.id}
                          src={image.thumbnail || image.url}
                          alt={image.title}
                          onClick={(e) => { e.stopPropagation(); setPreview(image.url); }}
                          className="w-24 h-24 object-cover rounded-lg cursor-zoom-in hover:opacity-90"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCommercial(p); }}
                      className={`text-xs px-2 py-1 rounded-lg border ${
                        p.isCommercial
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-stone-200 text-stone-500"
                      }`}
                    >
                      商单
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPaid(p, true); }}
                      className={`text-xs px-2 py-1 rounded-lg border ${
                        p.paid === true
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-white border-stone-200 text-stone-500"
                      }`}
                    >
                      已收款
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPaid(p, false); }}
                      className={`text-xs px-2 py-1 rounded-lg border ${
                        p.paid === false
                          ? "bg-red-500 border-red-500 text-white"
                          : "bg-white border-stone-200 text-stone-500"
                      }`}
                    >
                      未收款
                    </button>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStatus(p); }}
                    className={`text-xs px-3 py-1 rounded-lg ${
                      p.status === "published"
                        ? "bg-white border text-stone-600"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {p.status === "published" ? "撤回发布" : "发布"}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(p.id); }}
                    className="text-sm text-red-400 hover:underline"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="参考图大图" className="max-w-full max-h-full object-contain rounded-lg" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-stone-300"
          >
            ×
          </button>
        </div>
      )}

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
