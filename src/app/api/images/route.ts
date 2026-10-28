import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category");
  const tag = searchParams.get("tag");

  const where: any = {};
  if (categoryId) where.categories = { some: { categoryId } };
  if (tag) where.tags = { some: { tag: { name: { contains: tag } } } };

  const images = await prisma.image.findMany({
    where,
    include: {
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(images);
}
