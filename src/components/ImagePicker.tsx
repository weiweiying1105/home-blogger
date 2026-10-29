"use client";

import { useEffect, useState, useRef } from "react";
import { usePasteUpload } from "@/lib/usePasteUpload";

type ImageItem = {
  id: string;
  url: string;
  thumbnail: string | null;
  title: string;
  tags: { tag: { name: string } }[];
};

export default function ImagePicker({
  selected,
  onChange,
  multi = true,
  categoryId,
  onUploaded,
  pasteUpload = true,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  multi?: boolean;
  /** 非空时粘贴/上传的图片自动关联到该分类（审美积累用） */
  categoryId?: string;
  /** 粘贴上传完成后的回调（拿到新图片 id 列表） */
  onUploaded?: (imageIds: string[]) => void;
  /** 是否启用 Ctrl+V 粘贴上传 */
  pasteUpload?: boolean;
}) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { pasting } = usePasteUpload({
    endpoint: categoryId ? "/api/upload-gallery" : "/api/upload",
    categoryId,
    enabled: pasteUpload,
    onUploaded: (ids) => {
      load();
      onUploaded?.(ids);
    },
  });

  async function load() {
    const r = await fetch("/api/images");
    setImages(await r.json());
  }

  useEffect(() => { load(); }, []);

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

  function pick(id: string) {
    if (multi) {
      onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
    } else {
      onChange(selected.includes(id) ? [] : [id]);
    }
  }

  const filtered = images.filter((img) => {
    if (!q) return true;
    return (
      img.title.includes(q) ||
      img.tags?.some((t) => t.tag.name.includes(q))
    );
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="按标题或 tag 搜索..."
          className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
        />
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
          className="bg-stone-800 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
        >
          {uploading || pasting ? "..." : "上传"}
        </button>
        {pasteUpload && (
          <span className="text-xs text-stone-400 whitespace-nowrap">或 Ctrl+V 粘贴图片</span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
        {filtered.map((img) => (
          <div
            key={img.id}
            onClick={() => pick(img.id)}
            className={`cursor-pointer relative rounded-lg overflow-hidden border-2 aspect-square ${
              selected.includes(img.id) ? "border-stone-800" : "border-transparent"
            }`}
          >
            <img src={img.thumbnail || img.url} alt={img.title} className="w-full h-full object-cover" />
            {selected.includes(img.id) && (
              <div className="absolute top-1 right-1 bg-stone-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
