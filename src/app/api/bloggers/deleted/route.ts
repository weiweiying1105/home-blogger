import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// 已删除博主清单（黑名单）：GET 列表；DELETE ?username= 移除
export async function GET() {
  const list = await prisma.deletedBlogger.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(list);
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const username = (url.searchParams.get("username") || "")
      .trim()
      .replace(/^@/, "")
      .replace(/\//g, "");
    if (!username) return NextResponse.json({ error: "缺少 username 参数" }, { status: 400 });
    const removed = await prisma.deletedBlogger.deleteMany({ where: { username } });
    return NextResponse.json({ ok: true, removed: removed.count });
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
