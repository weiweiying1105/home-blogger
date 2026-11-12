import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10) || 10)
  );

  const commercial = searchParams.get("commercial");
  const paidParam = searchParams.get("paid");

  const where = {
    ...(status && status !== "all" ? { status } : {}),
    ...(commercial === "1" ? { isCommercial: true } : commercial === "0" ? { isCommercial: false } : {}),
    ...(paidParam === "1" || paidParam === "0"
      ? { paid: paidParam === "1" }
      : paidParam === "none"
        ? { paid: null }
        : {}),
  };

  const [total, items] = await Promise.all([
    prisma.plan.count({ where }),
    prisma.plan.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ isCommercial: "desc" }, { createdAt: "desc" }],
      include: { materials: { include: { image: true }, orderBy: { order: "asc" } } },
    }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, content, element = "", links = "", paid = null, isCommercial = false, imageIds = [] } = body;

  const plan = await prisma.plan.create({
    data: {
      title,
      content,
      element,
      links,
      paid,
      isCommercial,
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
