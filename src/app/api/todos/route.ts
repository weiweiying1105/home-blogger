import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const todos = await prisma.todo.findMany({ orderBy: [{ done: "asc" }, { order: "asc" }] });
  return NextResponse.json(todos);
}

export async function POST(req: Request) {
  const { title, note, quadrant } = await req.json();
  const todo = await prisma.todo.create({
    data: { title, note: note || "", quadrant: quadrant || 2 },
  });
  return NextResponse.json(todo);
}
