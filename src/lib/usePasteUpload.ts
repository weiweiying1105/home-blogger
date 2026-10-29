import { useEffect, useRef, useState } from "react";
import { extractPasteImageFiles, clipboardFileName } from "./paste-image";

/**
 * 全局粘贴图片自动上传 hook：
 * 页面任意位置 Ctrl+V 含图片时，自动上传到图片管理（/api/upload 或 /api/upload-gallery）。
 */
export function usePasteUpload({
  endpoint = "/api/upload",
  categoryId,
  enabled = true,
  onUploaded,
}: {
  endpoint?: string;
  categoryId?: string;
  enabled?: boolean;
  onUploaded?: (imageIds: string[]) => void;
}): { pasting: boolean } {
  const [pasting, setPasting] = useState(false);
  const busyRef = useRef(false);
  const cbRef = useRef(onUploaded);
  cbRef.current = onUploaded;

  useEffect(() => {
    if (!enabled) return;

    async function handlePaste(e: ClipboardEvent) {
      const files = extractPasteImageFiles(e);
      if (!files.length || busyRef.current) return;
      e.preventDefault();
      busyRef.current = true;
      setPasting(true);
      const ids: string[] = [];
      try {
        for (const file of files) {
          const fd = new FormData();
          // 微信剪贴板图片没有名字，统一命名，title 更可读
          fd.append("file", file, clipboardFileName());
          if (categoryId) fd.append("categoryId", categoryId);
          const r = await fetch(endpoint, { method: "POST", body: fd });
          if (r.ok) {
            const img = await r.json();
            if (img?.id) ids.push(img.id);
          }
        }
      } finally {
        busyRef.current = false;
        setPasting(false);
      }
      if (ids.length) cbRef.current?.(ids);
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [endpoint, categoryId, enabled]);

  return { pasting };
}
