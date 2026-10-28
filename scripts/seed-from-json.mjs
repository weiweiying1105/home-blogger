// 将 prisma/seed-data.json（从本地 SQLite 导出）回放到当前 DATABASE_URL 指向的数据库
// 用法：node scripts/seed-from-json.mjs
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();
const data = JSON.parse(readFileSync("prisma/seed-data.json", "utf8"));

// 分类先插父级再插子级，保证自引用外键满足
const byId = new Map(data.categories.map((c) => [c.id, c]));
const sorted = [];
const visit = (c) => {
  if (sorted.includes(c)) return;
  if (c.parentId && byId.has(c.parentId)) visit(byId.get(c.parentId));
  sorted.push(c);
};
data.categories.forEach(visit);

await prisma.category.createMany({ data: sorted });
await prisma.image.createMany({ data: data.images });
await prisma.categoryOnImage.createMany({ data: data.categoryOnImage });
await prisma.tag.createMany({ data: data.tags });
await prisma.imageTag.createMany({ data: data.imageTag });
if (data.plans.length) await prisma.plan.createMany({ data: data.plans });
if (data.planMaterial.length) await prisma.planMaterial.createMany({ data: data.planMaterial });
if (data.todos.length) await prisma.todo.createMany({ data: data.todos });

console.log("seeded:", Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])));
await prisma.$disconnect();
