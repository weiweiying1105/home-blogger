import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { categoryId } = await req.json();

  // 先查是否已存在
  const existing = await prisma.categoryOnImage.findUnique({
    where: { imageId_categoryId: { imageId: id, categoryId } },
  });

  if (existing) {
    await prisma.categoryOnImage.delete({ where: { id: existing.id } });
  } else {
    await prisma.categoryOnImage.create({ data: { imageId: id, categoryId } });
  }

  return NextResponse.json({ ok: true });
}
