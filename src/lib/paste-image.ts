/**
 * 从剪贴板粘贴事件中提取图片文件（支持微信复制的图片）。
 * 仅在浏览器环境使用（客户端组件）。
 */
export function extractPasteImageFiles(e: ClipboardEvent): File[] {
  const items = e.clipboardData?.items;
  if (!items) return [];
  const files: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const f = item.getAsFile();
      if (f) files.push(f);
    }
  }
  return files;
}

/**
 * 剪贴板图片通常没有文件名，生成一个可读的中文名作为上传 title。
 */
export function clipboardFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `剪贴板-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;
}
