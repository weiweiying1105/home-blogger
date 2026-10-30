import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const bloggers = await prisma.blogger.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(bloggers);
}

export async function POST(req: Request) {
  try {
    const { username, name, bio, avatarUrl, coverUrl, homepage, tags, sortOrder } = await req.json();
    // 从账号文本或主页链接解析 Ins id（链接形式自动提取）
    const extract = (s: unknown): string => {
      const t = String(s || "").trim().replace(/^@/, "");
      if (!t) return "";
      const m = t.match(/instagram\.com\/(?:reels\/|reel\/|p\/)?([A-Za-z0-9._]{1,40})/i);
      if (m) return m[1];
      if (/[\/?#]|https?:/.test(t)) return "";
      return t;
    };
    const uname = extract(username) || extract(homepage);
    if (!uname) return NextResponse.json({ error: "账号不能为空" }, { status: 400 });

    // 新增去重：库里已有该账号 → 409 友好提示
    const existing = await prisma.blogger.findUnique({ where: { username: uname } });
    if (existing) {
      return NextResponse.json(
        { error: `该 Ins 账号 @${uname} 已在库中（${existing.name || uname}），无需重复添加` },
        { status: 409 }
      );
    }

    // 已在删除黑名单中 → 409 提示
    const blocked = await prisma.deletedBlogger.findUnique({ where: { username: uname } });
    if (blocked) {
      return NextResponse.json(
        { error: `该 Ins 账号 @${uname} 已在“已删除清单”中，如确需重新添加，请先从清单移除` },
        { status: 409 }
      );
    }

    const blogger = await prisma.blogger.create({
      data: {
        username: uname,
        name: name || "",
        bio: bio || "",
        avatarUrl: avatarUrl || `/bloggers/${uname}.jpg`,
        coverUrl: coverUrl || "",
        homepage: homepage || `https://www.instagram.com/${uname}/`,
        tags: tags || "",
        sortOrder: sortOrder || 0,
      },
    });
    return NextResponse.json(blogger);
  } catch (e) {
    const msg = (e as Error).message || String(e);
    // 并发下撞唯一约束的兜底
    if (msg.includes("Unique constraint") && msg.includes("username")) {
      return NextResponse.json(
        { error: "该 Ins 账号已存在，无需重复添加" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
