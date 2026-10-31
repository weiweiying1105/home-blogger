"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Markdown 渲染：安全（默认转义 HTML）+ stone 极简排版
export default function NoteRenderer({ content }: { content: string }) {
  return (
    <div className="text-stone-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 {...p} className="text-2xl font-bold text-stone-900 mt-8 mb-4 border-b border-stone-200 pb-2" />,
          h2: (p) => <h2 {...p} className="text-xl font-semibold text-stone-900 mt-6 mb-3" />,
          h3: (p) => <h3 {...p} className="text-lg font-semibold text-stone-900 mt-5 mb-2" />,
          h4: (p) => <h4 {...p} className="text-base font-semibold text-stone-900 mt-4 mb-2" />,
          p: (p) => <p {...p} className="my-3 leading-7" />,
          a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline decoration-blue-300 hover:text-blue-800" />,
          strong: (p) => <strong {...p} className="font-semibold text-stone-900" />,
          em: (p) => <em {...p} className="italic" />,
          ul: (p) => <ul {...p} className="list-disc pl-6 my-3 space-y-1" />,
          ol: (p) => <ol {...p} className="list-decimal pl-6 my-3 space-y-1" />,
          li: (p) => <li {...p} className="leading-7" />,
          blockquote: (p) => <blockquote {...p} className="border-l-4 border-stone-300 pl-4 italic text-stone-600 my-4" />,
          code: (p) => (
            <code {...p} className="bg-stone-100 rounded px-1.5 py-0.5 text-[13px] text-stone-800" />
          ),
          pre: (p) => (
            <pre {...p} className="bg-stone-900 text-stone-100 rounded-lg p-4 overflow-x-auto my-4 text-[13px] leading-6" />
          ),
          table: (p) => (
            <table {...p} className="border-collapse w-full text-sm my-4" />
          ),
          th: (p) => <th {...p} className="border border-stone-200 bg-stone-100 px-3 py-1.5 font-semibold text-left" />,
          td: (p) => <td {...p} className="border border-stone-200 px-3 py-1.5" />,
          hr: () => <hr className="border-stone-200 my-6" />,
          img: (p) => <img {...p} className="rounded-lg my-4 max-w-full" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
