import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * 图片列表
 * 查询参数：
 *   category  按分类 id 过滤
 *   tag       按标签名模糊过滤
 *   q         关键词（标题 / 标签名 / 分类名）
 *   scope=gallery  只看图库可见的图：hiddenFromGallery=false 且已分配至少一个分类
 *   ids       逗号分隔的图片 id 列表（用于编辑时回填已选图）
 *   page      页码（1 起）；不传时保持旧行为，直接返回数组
 *   pageSize  每页条数，默认 40，最大 200
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category");
  const tag = searchParams.get("tag");
  const q = (searchParams.get("q") || "").trim();
  const scope = searchParams.get("scope");
  const idsParam = searchParams.get("ids");
  const pageParam = searchParams.get("page");
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize")) || 40, 1), 200);

  const where: any = {};

  if (categoryId) where.categories = { some: { categoryId } };
  if (tag) where.tags = { some: { tag: { name: { contains: tag } } } };
  if (scope === "gallery") {
    where.hiddenFromGallery = false;
    // 图库只展示已归入分类的图，未分配分类的图留在 /images
    if (!categoryId) where.categories = { some: {} };
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { tags: { some: { tag: { name: { contains: q } } } } },
      { categories: { some: { category: { name: { contains: q } } } } },
    ];
  }
  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    where.id = { in: ids };
  }

  const include = {
    categories: { include: { category: true } },
    tags: { include: { tag: true } },
    _count: { select: { plans: true } },
  };
  const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];

  // 兼容旧调用：不传 page 时返回全量数组
  if (!pageParam) {
    const items = await prisma.image.findMany({ where, include, orderBy });
    return NextResponse.json(items);
  }

  const page = Math.max(Number(pageParam) || 1, 1);
  const [items, total] = await Promise.all([
    prisma.image.findMany({
      where,
      include,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.image.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  });
}
