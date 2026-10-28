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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) return NextResponse.json({ error: "图片不存在" }, { status: 404 });

  // 删除 COS 上的文件
  try {
    const key = image.url.replace(`${PUBLIC_URL}/`, "");
    await cos.deleteObject({ Bucket: BUCKET, Region: REGION, Key: key });
    if (image.thumbnail) {
      const thumbKey = image.thumbnail.replace(`${PUBLIC_URL}/`, "");
      await cos.deleteObject({ Bucket: BUCKET, Region: REGION, Key: thumbKey });
    }
  } catch {}

  await prisma.image.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
