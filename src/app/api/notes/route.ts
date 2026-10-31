import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const notes = await prisma.note.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, title: true, category: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  try {
    const { title, content, category } = await req.json();
    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    const note = await prisma.note.create({
      data: {
        title: String(title).trim(),
        content: String(content || ""),
        category: String(category || "").trim(),
      },
    });
    return NextResponse.json(note);
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
