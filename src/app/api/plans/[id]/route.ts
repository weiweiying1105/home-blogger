import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { imageIds, ...rest } = body;

  const plan = await prisma.$transaction(async (tx) => {
    const updated = await tx.plan.update({ where: { id }, data: rest });
    if (Array.isArray(imageIds)) {
      await tx.planMaterial.deleteMany({ where: { planId: id } });
      if (imageIds.length) {
        await tx.planMaterial.createMany({
          data: imageIds.map((iid: string, i: number) => ({
            planId: id,
            imageId: iid,
            order: i,
          })),
        });
      }
    }
    return tx.plan.findUnique({
      where: { id },
      include: { materials: { include: { image: true }, orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json(plan);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
