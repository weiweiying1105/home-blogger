import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const key of ["username", "name", "bio", "avatarUrl", "coverUrl", "homepage", "tags", "sortOrder"]) {
      if (key in body) data[key] = body[key];
    }
    if (typeof data.username === "string") {
      data.username = (data.username as string).trim().replace(/^@/, "").replace(/\//g, "");
    }
    // 编辑时改了账号名：先查重，避免撞唯一约束
    if (typeof data.username === "string") {
      const dup = await prisma.blogger.findFirst({
        where: { username: data.username as string, NOT: { id } },
      });
      if (dup) {
        return NextResponse.json(
          { error: `该 Ins 账号 @${data.username} 已被其他博主使用，请更换` },
          { status: 409 }
        );
      }
    }
    const blogger = await prisma.blogger.update({ where: { id }, data });
    return NextResponse.json(blogger);
  } catch (e) {
    const msg = (e as Error).message || String(e);
    if (msg.includes("Unique constraint") && msg.includes("username")) {
      return NextResponse.json({ error: "该 Ins 账号已存在，无需重复添加" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blogger = await prisma.blogger.findUnique({ where: { id } });
    if (!blogger) return NextResponse.json({ error: "博主不存在" }, { status: 404 });

    // 写入已删除黑名单：后续爬取导入自动跳过
    await prisma.deletedBlogger.upsert({
      where: { username: blogger.username },
      update: {},
      create: { username: blogger.username, reason: "用户删除" },
    });

    await prisma.blogger.delete({ where: { id } });
    return NextResponse.json({ ok: true, blocked: blogger.username });
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
