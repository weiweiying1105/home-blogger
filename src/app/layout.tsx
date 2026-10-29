import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "Home Blogger" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex min-h-screen bg-stone-50">
          {/* 左侧边栏 */}
          <aside className="w-56 bg-white border-r border-stone-200 flex flex-col fixed h-screen">
            <div className="p-5 border-b">
              <Link href="/" className="font-semibold text-lg tracking-wide hover:opacity-70">
                Home Blogger
              </Link>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-100 transition"
              >
                Plans
              </Link>
              <Link
                href="/images"
                className="block px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-100 transition"
              >
                Images
              </Link>
              <Link
                href="/gallery"
                className="block px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-100 transition"
              >
                Gallery
              </Link>
              <Link
                href="/bloggers"
                className="block px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-100 transition"
              >
                Bloggers
              </Link>
              <Link
                href="/todos"
                className="block px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-100 transition"
              >
                Todos
              </Link>
            </nav>
          </aside>
          {/* 主内容 */}
          <main className="flex-1 ml-56 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
