import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      children: {
        orderBy: { order: "asc" },
        include: {
          children: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  // 只返回顶级
  const roots = categories.filter((c) => !c.parentId);
  return NextResponse.json(roots);
}

export async function POST(req: Request) {
  const { name, parentId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
  const cat = await prisma.category.create({
    data: { name: name.trim(), parentId: parentId || null },
  });
  return NextResponse.json(cat);
}
