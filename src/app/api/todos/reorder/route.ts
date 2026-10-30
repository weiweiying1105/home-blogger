import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// 拖拽排序批量提交：一次更新多个事项的象限与顺序
export async function POST(req: Request) {
  try {
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items 不能为空" }, { status: 400 });
    }
    await prisma.$transaction(
      items.map((it: { id: string; quadrant: number; order: number }) =>
        prisma.todo.update({
          where: { id: it.id },
          data: { quadrant: it.quadrant, order: it.order },
        })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
