import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
    include: { materials: { include: { image: true }, orderBy: { order: "asc" } } },
  });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, content, imageIds = [] } = body;

  const plan = await prisma.plan.create({
    data: {
      title,
      content,
      materials: {
        create: imageIds.map((iid: string, i: number) => ({
          imageId: iid,
          order: i,
        })),
      },
    },
    include: { materials: { include: { image: true } } },
  });
  return NextResponse.json(plan);
}
