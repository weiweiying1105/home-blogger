import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** 删除前的引用检查：这张图被哪些发布计划引用 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const materials = await prisma.planMaterial.findMany({
    where: { imageId: id },
    include: { plan: { select: { id: true, title: true, status: true } } },
  });

  return NextResponse.json({
    count: materials.length,
    plans: materials.map((m) => m.plan),
  });
}
