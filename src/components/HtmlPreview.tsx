"use client";

import { useRef } from "react";

// 判定内容是否为 HTML（以 < 开头的文本视为 HTML）
export function isHtml(content: string) {
  return /^\s*</.test(content);
}

// HTML 网页预览：用 iframe srcdoc 渲染，高度随内容自适应
export default function HtmlPreview({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);

  function fitHeight() {
    const f = ref.current;
    if (!f) return;
    try {
      const h = f.contentDocument?.body?.scrollHeight;
      if (h && h > 0) f.style.height = h + "px";
    } catch {
      /* 跨源或未就绪时保持原高度 */
    }
  }

  return (
    <iframe
      ref={ref}
      sandbox="allow-same-origin allow-scripts"
      srcDoc={html}
      onLoad={fitHeight}
      className={`w-full bg-white border-0 ${className}`}
      title="HTML 预览"
    />
  );
}
