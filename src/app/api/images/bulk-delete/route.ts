import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import COS from "cos-nodejs-sdk-v5";

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID || "",
  SecretKey: process.env.COS_SECRET_KEY || "",
});
const BUCKET = process.env.COS_BUCKET || "home-blogger-1303796882";
const REGION = process.env.COS_REGION || "ap-guangzhou";
const PUBLIC_URL = `https://${BUCKET}.cos.${REGION}.myqcloud.com`;

export const runtime = "nodejs";

// 批量删除图片：先删 COS 对象，再删数据库记录
// body: { ids: string[] }
export async function POST(req: Request) {
  let ids: unknown;
  try {
    const body = await req.json();
    ids = body?.ids;
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids 必须是非空数组" }, { status: 400 });
  }

  // 去重 + 只保留字符串
  const uniqueIds = Array.from(
    new Set(ids.filter((v): v is string => typeof v === "string" && v.length > 0))
  );

  if (uniqueIds.length === 0) {
    return NextResponse.json({ error: "没有有效的图片 id" }, { status: 400 });
  }
  if (uniqueIds.length > 200) {
    return NextResponse.json({ error: "一次最多删除 200 张" }, { status: 400 });
  }

  const images = await prisma.image.findMany({
    where: { id: { in: uniqueIds } },
    include: { _count: { select: { plans: true } } },
  });

  if (images.length === 0) {
    return NextResponse.json({ error: "图片不存在或已被删除" }, { status: 404 });
  }

  const missing = uniqueIds.filter((id) => !images.some((img) => img.id === id));
  const planUsed = images.filter((img) => img._count.plans > 0).length;

  // 删除 COS 上的原图与缩略图；单个失败不阻断其余删除
  const cosFailed: string[] = [];
  await Promise.all(
    images.map(async (image) => {
      const keys: string[] = [];
      if (image.url?.startsWith(`${PUBLIC_URL}/`)) {
        keys.push(image.url.replace(`${PUBLIC_URL}/`, ""));
      }
      if (image.thumbnail?.startsWith(`${PUBLIC_URL}/`)) {
        keys.push(image.thumbnail.replace(`${PUBLIC_URL}/`, ""));
      }
      for (const Key of keys) {
        try {
          await cos.deleteObject({ Bucket: BUCKET, Region: REGION, Key });
        } catch {
          cosFailed.push(image.id);
        }
      }
    })
  );

  // 数据库记录整体删除（分类/标签/计划素材关联由 onDelete: Cascade 处理）
  const result = await prisma.image.deleteMany({ where: { id: { in: images.map((i) => i.id) } } });

  return NextResponse.json({
    ok: true,
    deleted: result.count,
    requested: uniqueIds.length,
    missing,
    planUsed,
    cosFailed: Array.from(new Set(cosFailed)),
  });
}
