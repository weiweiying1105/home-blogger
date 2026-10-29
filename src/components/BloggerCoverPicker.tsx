"use client";

import { useEffect, useRef, useState } from "react";
import { extractPasteImageFiles, clipboardFileName } from "@/lib/paste-image";

type GalleryImage = {
  id: string;
  url: string;
  thumbnail: string | null;
  title: string;
  tags?: { tag: { name: string } }[];
};

/**
 * 博主代表性家居图编辑器：粘贴 / 上传 / 从图库选择（单选），
 * 与发布计划的图片模块能力一致，粘贴的图会自动上传到图片管理并设为封面。
 */
export default function BloggerCoverPicker({
  value,
  onChange,
  fallback,
}: {
  value: string;
  onChange: (url: string) => void;
  /** 默认封面路径（/bloggers/covers/xxx.jpg），用于预览兜底 */
  fallback?: string;
}) {
  const [pasting, setPasting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    const fd = new FormData();
    // 微信剪贴板图片没有名字，统一命名，title 更可读
    fd.append("file", file, clipboardFileName());
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    if (r.ok) {
      const img = await r.json();
      if (img?.url) onChange(img.url);
    }
  }

  async function handlePaste(e: ClipboardEvent) {
    const files = extractPasteImageFiles(e);
    if (!files.length || pasting || uploading) return;
    e.preventDefault();
    setPasting(true);
    await uploadFile(files[0]);
    setPasting(false);
  }

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasting, uploading]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    await uploadFile(f);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function openPicker() {
    const r = await fetch("/api/images");
    setImages(await r.json());
    setPicked(null);
    setQ("");
    setPickerOpen(true);
  }

  const filtered = images.filter((img) => {
    if (!q) return true;
    return img.title.includes(q) || img.tags?.some((t) => t.tag.name.includes(q));
  });

  return (
    <div>
      <div className="relative aspect-[4/3] bg-stone-100 rounded-lg overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value || fallback}
          alt="代表性家居图"
          className="w-full h-full object-cover"
          onError={(e) => {
            if (fallback) (e.target as HTMLImageElement).src = fallback;
          }}
        />
        {pasting && (
          <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-sm">
            粘贴上传中...
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={openPicker}
          className="bg-stone-800 text-white px-3 py-1.5 rounded-lg text-sm"
        >
          从图库选择
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || pasting}
          className="bg-white border px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
        >
          {uploading ? "上传中..." : "上传图片"}
        </button>
        <span className="text-xs text-stone-400">或 Ctrl+V 粘贴图片</span>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />

      {pickerOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">选择代表性家居图</h3>
              <button onClick={() => setPickerOpen(false)} className="text-stone-400 text-xl">
                ×
              </button>
            </div>
            <div className="mb-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="按标题或 tag 搜索..."
                className="w-full border rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto">
              {filtered.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setPicked(img.id)}
                  className={`cursor-pointer relative rounded-lg overflow-hidden border-2 aspect-square ${
                    picked === img.id ? "border-stone-800" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumbnail || img.url} alt={img.title} className="w-full h-full object-cover" />
                  {picked === img.id && (
                    <div className="absolute top-1 right-1 bg-stone-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPickerOpen(false)} className="px-4 py-2 text-sm text-stone-500">
                取消
              </button>
              <button
                onClick={() => {
                  const img = images.find((x) => x.id === picked);
                  if (img) onChange(img.url || img.thumbnail || "");
                  setPickerOpen(false);
                }}
                disabled={!picked}
                className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg disabled:opacity-40"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
