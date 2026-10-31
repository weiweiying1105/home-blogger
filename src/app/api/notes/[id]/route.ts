import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
    return NextResponse.json(note);
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, content, category } = body;
    if (title !== undefined && !String(title).trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    const data: { title?: string; content?: string; category?: string } = {};
    if (title !== undefined) data.title = String(title).trim();
    if (content !== undefined) data.content = String(content);
    if (category !== undefined) data.category = String(category).trim();
    const note = await prisma.note.update({ where: { id }, data });
    return NextResponse.json(note);
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
