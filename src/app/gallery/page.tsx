"use client";

import { useEffect, useState } from "react";
import CategoryMenu from "@/components/CategoryMenu";
import ImagePicker from "@/components/ImagePicker";

type Category = { id: string; name: string; children?: Category[] };

type ImageItem = {
  id: string;
  url: string;
  thumbnail: string | null;
  title: string;
  categories: { categoryId: string }[];
};

export default function GalleryPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [tree, setTree] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>("");
  const [tagFilter, setTagFilter] = useState("");
  const [tagApplied, setTagApplied] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  async function load() {
    const params = new URLSearchParams();
    if (activeCat) params.set("category", activeCat);
    if (tagApplied) params.set("tag", tagApplied);
    const [ir, cr] = await Promise.all([
      fetch("/api/images" + (params.toString() ? `?${params}` : "")),
      fetch("/api/categories"),
    ]);
    setImages(await ir.json());
    setTree(await cr.json());
  }

  useEffect(() => { load(); }, [activeCat, tagApplied]);

  // 当前分类下已有的图片 ID
  const selectedIds = images
    .filter((img) => img.categories.some((c) => c.categoryId === activeCat))
    .map((img) => img.id);

  // 确认选图：把选中的图和当前分类关联
  async function onPick(ids: string[]) {
    if (!activeCat) {
      alert("请先在左侧选择一个分类");
      setPickerOpen(false);
      return;
    }
    // 先删除不在 ids 里的关联
    for (const img of images) {
      if (img.categories.some((c) => c.categoryId === activeCat) && !ids.includes(img.id)) {
        await fetch(`/api/images/${img.id}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: activeCat }),
        });
      }
    }
    // 加新的
    for (const id of ids) {
      if (!images.some((img) => img.id === id && img.categories.some((c) => c.categoryId === activeCat))) {
        await fetch(`/api/images/${id}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: activeCat }),
        });
      }
    }
    setPickerOpen(false);
    load();
  }

  const findParent = (list: Category[], id: string): Category | null => {
    for (const c of list) {
      if (c.id === id) return null;
      if (c.children) {
        if (c.children.some((x) => x.id === id)) return c;
        const r = findParent(c.children, id);
        if (r) return r;
      }
    }
    return null;
  };

  const parent = findParent(tree, activeCat);
  const level1 = parent ? parent.children || [] : tree;

  const [editingImg, setEditingImg] = useState<string | null>(null);

  // 拍平所有分类
  const flatCats: { id: string; name: string; depth: number }[] = [];
  const walk = (list: Category[], depth: number) => {
    for (const c of list) {
      flatCats.push({ id: c.id, name: c.name, depth });
      if (c.children) walk(c.children, depth + 1);
    }
  };
  walk(tree, 0);

  async function toggleImgCat(imageId: string, catId: string) {
    await fetch(`/api/images/${imageId}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: catId }),
    });
    setEditingImg(null);
    load();
  }

  return (
    <div className="flex gap-8 items-start">
      <CategoryMenu activeId={activeCat} onSelect={setActiveCat} />
      <div className="flex-1 min-w-0">
        {/* tag 筛选 */}
        <div className="flex gap-2 mb-4">
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setTagApplied(tagFilter)}
            placeholder="输入 tag 筛选图片..."
            className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => setTagApplied(tagFilter)}
            className="bg-stone-800 text-white px-4 py-1.5 rounded-lg text-sm"
          >
            搜索
          </button>
          {tagApplied && (
            <button
              onClick={() => { setTagApplied(""); setTagFilter(""); }}
              className="text-sm text-stone-400 px-2"
            >
              清除
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCat("")}
              className={`px-4 py-1.5 rounded-full text-sm ${!activeCat ? "bg-stone-800 text-white" : "bg-white border"}`}
            >
              全部
            </button>
            {level1.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm ${activeCat === c.id ? "bg-stone-800 text-white" : "bg-white border"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          {activeCat && (
            <button
              onClick={() => setPickerOpen(true)}
              className="bg-stone-800 text-white px-4 py-1.5 rounded-lg text-sm shrink-0"
            >
              + 添加图片
            </button>
          )}
        </div>

        {parent && (
          <div className="flex gap-2 mb-4 flex-wrap ml-2">
            <button
              onClick={() => setActiveCat(parent.id)}
              className="text-xs text-stone-400 hover:text-stone-700 py-1"
            >
              ← 返回 {parent.name}
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-stone-200">
                <img src={img.thumbnail || img.url} alt={img.title} className="w-full h-full object-cover" />
              </div>
              {/* 悬停显示分类编辑按钮 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => setEditingImg(editingImg === img.id ? null : img.id)}
                  className="bg-white text-xs px-3 py-1.5 rounded-lg"
                >
                  编辑分类
                </button>
              </div>
              {/* 分类选择弹层 */}
              {editingImg === img.id && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-20 p-2 w-44 max-h-48 overflow-y-auto">
                  {flatCats.map((c) => {
                    const has = img.categories.some((x) => x.categoryId === c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleImgCat(img.id, c.id)}
                        className={`block w-full text-left text-xs px-2 py-1 rounded ${has ? "bg-stone-200" : "hover:bg-stone-100"}`}
                        style={{ paddingLeft: `${c.depth * 10 + 8}px` }}
                      >
                        {has ? "✓ " : ""}{c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 选图弹窗 */}
      {pickerOpen && activeCat && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">选择图片加入「{tree.find((c) => c.id === activeCat)?.name || "当前分类"}」</h3>
              <button onClick={() => setPickerOpen(false)} className="text-stone-400 text-xl">×</button>
            </div>
            <p className="text-xs text-stone-400 mb-2">可直接 Ctrl+V 粘贴图片（支持微信复制），自动上传并归入当前分类</p>
            <ImagePicker
              selected={selectedIds}
              onChange={onPick}
              multi
              categoryId={activeCat}
              onUploaded={() => load()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
