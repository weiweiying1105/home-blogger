import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToCOS } from "@/lib/cos";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const categoryId = (formData.get("categoryId") as string) || "";

  if (!file) return NextResponse.json({ error: "缺少文件" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadToCOS(bytes, file.name);

  const image = await prisma.image.create({
    data: {
      url: uploaded.url,
      thumbnail: uploaded.thumbnail,
      title: file.name.replace(/\.[^.]+$/, ""),
      size: uploaded.size,
    },
  });

  if (categoryId) {
    await prisma.categoryOnImage.create({
      data: { imageId: image.id, categoryId },
    });
  }

  return NextResponse.json(image);
}
