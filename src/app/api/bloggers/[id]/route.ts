import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of ["username", "name", "bio", "avatarUrl", "coverUrl", "homepage", "tags", "sortOrder"]) {
    if (key in body) data[key] = body[key];
  }
  if (typeof data.username === "string") {
    data.username = (data.username as string).trim().replace(/^@/, "").replace(/\//g, "");
  }
  const blogger = await prisma.blogger.update({ where: { id }, data });
  return NextResponse.json(blogger);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.blogger.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
