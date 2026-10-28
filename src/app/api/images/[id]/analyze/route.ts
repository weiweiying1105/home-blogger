import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeTags } from "@/lib/ai";

export const runtime = "nodejs";

// AI 分析，返回候选标签（不保存，等用户确认）
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const img = await prisma.image.findUnique({ where: { id } });
  if (!img) return NextResponse.json({ error: "图片不存在" }, { status: 404 });

  const res = await fetch(img.url);
  const buf = Buffer.from(await res.arrayBuffer());

  const tags = await analyzeTags(buf);
  return NextResponse.json({ tags });
}
