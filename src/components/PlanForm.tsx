"use client";

import { useState } from "react";
import ImagePicker from "@/components/ImagePicker";

type Plan = {
  id: string;
  title: string;
  content: string;
  element: string;
  links: string;
  paid?: boolean | null;
  materials: { image: { id: string } }[];
};

export default function PlanForm({
  plan,
  onClose,
  onSaved,
}: {
  plan: Plan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(plan?.title ?? "");
  const [content, setContent] = useState(plan?.content ?? "");
  const [element, setElement] = useState(plan?.element ?? "");
  const [links, setLinks] = useState(plan?.links ?? "");
  const [paid, setPaid] = useState<boolean | null>(plan?.paid ?? null);
  const [selected, setSelected] = useState<string[]>(
    plan?.materials.map((m) => m.image.id) ?? []
  );

  async function save() {
    const body = { title, content, element, links, paid, imageIds: selected };
    if (plan) {
      await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl h-full overflow-y-auto shadow-xl">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{plan ? "编辑计划" : "新建计划"}</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl">×</button>
          </div>
        </div>

        <div className="p-6">
          <label className="block text-sm text-stone-500 mb-1">标题</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
          />

          <label className="block text-sm text-stone-500 mb-1">内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
          />

          <label className="block text-sm text-stone-500 mb-1">元素</label>
          <input
            value={element}
            onChange={(e) => setElement(e.target.value)}
            placeholder="如：复古滤镜、侘寂风、奶油色调..."
            className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
          />

          <label className="block text-sm text-stone-500 mb-1">参考链接（可多个，一行一个）</label>
          <textarea
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            rows={3}
            placeholder={"https://www.instagram.com/p/xxx/\nhttps://.../"}
            className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
          />

          <div className="mb-4">
            <span className="block text-sm text-stone-500 mb-2">收款</span>
            <div className="flex gap-2">
              {[
                { v: true, label: "已收款", on: "bg-amber-500 border-amber-500 text-white" },
                { v: false, label: "未收款", on: "bg-red-500 border-red-500 text-white" },
                { v: null, label: "不标记", on: "bg-stone-800 border-stone-800 text-white" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  onClick={() => setPaid(o.v)}
                  className={`text-xs px-3 py-1 rounded-lg border ${
                    paid === o.v ? o.on : "bg-white border-stone-200 text-stone-500"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm text-stone-500 mb-2">参考图</label>
          <ImagePicker selected={selected} onChange={setSelected} multi manageMode />
        </div>

        <div className="p-6 border-t flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-stone-500">取消</button>
          <button onClick={save} className="px-5 py-2 text-sm bg-stone-800 text-white rounded-lg">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
