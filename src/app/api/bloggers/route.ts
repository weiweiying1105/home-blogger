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
  const { username, name, bio, avatarUrl, coverUrl, homepage, sortOrder } = await req.json();
  const uname = (username || "").trim().replace(/^@/, "").replace(/\//g, "");
  if (!uname) return NextResponse.json({ error: "账号不能为空" }, { status: 400 });
  const blogger = await prisma.blogger.create({
    data: {
      username: uname,
      name: name || "",
      bio: bio || "",
      avatarUrl: avatarUrl || `/bloggers/${uname}.jpg`,
      coverUrl: coverUrl || "",
      homepage: homepage || `https://www.instagram.com/${uname}/`,
      sortOrder: sortOrder || 0,
    },
  });
  return NextResponse.json(blogger);
}
