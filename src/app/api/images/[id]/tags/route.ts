import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// 给图片加/删 tag
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { tagName } = await req.json();

  const tag = await prisma.tag.upsert({
    where: { name: tagName },
    create: { name: tagName },
    update: {},
  });

  const existing = await prisma.imageTag.findUnique({
    where: { imageId_tagId: { imageId: id, tagId: tag.id } },
  });

  if (existing) {
    await prisma.imageTag.delete({ where: { id: existing.id } });
  } else {
    await prisma.imageTag.create({ data: { imageId: id, tagId: tag.id } });
  }

  return NextResponse.json({ ok: true });
}
