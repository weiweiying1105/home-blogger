"use client";

import { useEffect, useState, useRef } from "react";
import { usePasteUpload } from "@/lib/usePasteUpload";

type ImageItem = {
  id: string;
  url: string;
  thumbnail: string | null;
  title: string;
  tags: { tag: { id: string; name: string } }[];
};

export default function ImagesPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [allTags, setAllTags] = useState<{ name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingImg, setEditingImg] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState("");
  const [aiPreview, setAiPreview] = useState<{ imageId: string; tags: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { pasting } = usePasteUpload({
    onUploaded: () => load(),
  });

  async function load() {
    const [ir, tr] = await Promise.all([
      fetch("/api/images" + (activeTag ? `?tag=${encodeURIComponent(activeTag)}` : "")),
      fetch("/api/tags"),
    ]);
    setImages(await ir.json());
    setAllTags(await tr.json());
  }

  useEffect(() => { load(); }, [activeTag]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      await fetch("/api/upload", { method: "POST", body: fd });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    alert("链接已复制");
  }

  async function removeImage(id: string) {
    if (!confirm("删除这张图？COS 上的文件也会一起删掉")) return;
    await fetch(`/api/images/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleTag(imageId: string, tagName: string) {
    await fetch(`/api/images/${imageId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagName }),
    });
    load();
  }

  async function aiAnalyze(imageId: string) {
    setAnalyzing(imageId);
    const r = await fetch(`/api/images/${imageId}/analyze`, { method: "POST" });
    const data = await r.json();
    setAnalyzing(null);
    if (data.tags?.length) setAiPreview({ imageId, tags: data.tags });
  }

  async function confirmAiTags() {
    if (!aiPreview) return;
    for (const name of aiPreview.tags) {
      await fetch(`/api/images/${aiPreview.imageId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagName: name }),
      });
    }
    setAiPreview(null);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">图片管理</h1>

      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onUpload}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || pasting}
          className="bg-stone-800 text-white px-5 py-2 rounded-lg disabled:opacity-50"
        >
          {uploading || pasting ? "上传中..." : "上传图片"}
        </button>
        <span className="ml-3 text-sm text-stone-400">或直接 Ctrl+V 粘贴图片（支持微信复制）</span>
      </div>

      {/* tag 筛选 */}
      <input
        value={activeTag}
        onChange={(e) => setActiveTag(e.target.value)}
        placeholder="输入 tag 筛选图片..."
        className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img.id} className="bg-white rounded-xl overflow-hidden shadow-sm group">
            <div className="aspect-square overflow-hidden relative">
              <img
                src={img.thumbnail || img.url}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => copyUrl(img.url)}
                  title="复制链接"
                  className="bg-white/90 rounded-full p-2 hover:bg-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </button>
                <button
                  onClick={() => removeImage(img.id)}
                  title="删除"
                  className="bg-red-500/90 text-white rounded-full p-2 hover:bg-red-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-3">
              <div className="flex flex-wrap gap-1 items-center">
                {img.tags?.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="text-xs bg-stone-100 px-2 py-0.5 rounded flex items-center gap-1"
                  >
                    {tag.name}
                    <button
                      onClick={() => toggleTag(img.id, tag.name)}
                      className="text-stone-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={editingImg === img.id ? newTag : ""}
                  onChange={(e) => setNewTag(e.target.value)}
                  onFocus={() => setEditingImg(img.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTag.trim()) {
                      toggleTag(img.id, newTag.trim());
                      setNewTag("");
                    }
                  }}
                  onBlur={() => { setEditingImg(null); setNewTag(""); }}
                  placeholder="+ 标签"
                  className="text-xs border border-transparent focus:border-stone-300 rounded px-1 py-0.5 w-16 focus:w-24 outline-none"
                />
              </div>
              <button
                onClick={() => aiAnalyze(img.id)}
                disabled={analyzing === img.id}
                className="mt-2 text-xs text-stone-400 hover:text-stone-700 disabled:opacity-50"
              >
                {analyzing === img.id ? "分析中..." : "✨ AI 打标签"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI 标签预览弹窗 */}
      {aiPreview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">AI 分析结果，确认后保存</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {aiPreview.tags.map((t, i) => (
                <span key={i} className="bg-stone-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {t}
                  <button
                    onClick={() => setAiPreview({ ...aiPreview, tags: aiPreview.tags.filter((_, j) => j !== i) })}
                    className="text-stone-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAiPreview(null)} className="px-4 py-2 text-sm text-stone-500">取消</button>
              <button onClick={confirmAiTags} className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg">
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
