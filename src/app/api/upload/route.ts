import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToCOS } from "@/lib/cos";
import { describeImage } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tagsRaw = (formData.get("tags") as string) || "";

  if (!file) return NextResponse.json({ error: "缺少文件" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());

  const uploaded = await uploadToCOS(bytes, file.name);

  // AI 描述（如果配了 ARK_API_KEY）
  let ai: { description: string; colors: string } = { description: "", colors: "" };
  try {
    ai = await describeImage(bytes, "home");
  } catch {}

  const image = await prisma.image.create({
    data: {
      url: uploaded.url,
      thumbnail: uploaded.thumbnail,
      title: file.name.replace(/\.[^.]+$/, ""),
      description: ai.description,
      colors: ai.colors,
      size: uploaded.size,
    },
  });

  // 处理标签
  const tagNames = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    await prisma.imageTag.create({
      data: { imageId: image.id, tagId: tag.id },
    });
  }

  return NextResponse.json({ ...image, tags: tagNames });
}
