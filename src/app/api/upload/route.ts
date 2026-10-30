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

  // COS 上传与 AI 描述并行：AI 慢或失败不影响上传主流程（内部已带 8s 超时）
  const [uploaded, aiResult] = await Promise.all([
    uploadToCOS(bytes, file.name),
    describeImage(bytes, "home").catch(() => ({ description: "", colors: "" })),
  ]);
  const ai = aiResult || { description: "", colors: "" };

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

  // 处理标签（并行 upsert）
  const tagNames = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
  await Promise.all(
    tagNames.map(async (name) => {
      const tag = await prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      await prisma.imageTag.create({
        data: { imageId: image.id, tagId: tag.id },
      });
    })
  );

  return NextResponse.json({ ...image, tags: tagNames });
}
