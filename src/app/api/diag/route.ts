import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function timed<T>(label: string, fn: () => Promise<T>) {
  const t0 = performance.now();
  const out = await fn();
  return { label, ms: Math.round(performance.now() - t0), out };
}

export async function GET() {
  const start = performance.now();
  // 函数出口 IP / 位置
  let egress: any = {};
  try {
    const r = await fetch("http://ip-api.com/json/?fields=query,country,city,isp", {
      cache: "no-store",
    });
    egress = await r.json();
  } catch (e: any) {
    egress = { error: String(e) };
  }

  // 连续 3 次只读查询，观察连接复用
  const q1 = await timed("query1", () => prisma.image.count());
  const q2 = await timed("query2", () => prisma.image.count());
  const q3 = await timed("query3", () => prisma.image.count());

  // 一次带 include 的真实查询
  const qJoin = await timed("findMany-with-include", () =>
    prisma.image.findMany({
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    })
  );

  return NextResponse.json({
    functionTotalMs: Math.round(performance.now() - start),
    functionEgress: egress,
    queries: [q1, q2, q3].map(({ label, ms }) => ({ label, ms })),
    joinMs: qJoin.ms,
    region: process.env.TENCENT_REGION || process.env.REGION || "unknown",
  });
}
