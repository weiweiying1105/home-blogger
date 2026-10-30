import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const todos = await prisma.todo.findMany({ orderBy: [{ order: "asc" }] });
  return NextResponse.json(todos);
}

export async function POST(req: Request) {
  const { title, note, quadrant } = await req.json();
  const q = quadrant || 2;
  const count = await prisma.todo.count({ where: { quadrant: q } });
  const todo = await prisma.todo.create({
    data: { title, note: note || "", quadrant: q, order: count },
  });
  return NextResponse.json(todo);
}
