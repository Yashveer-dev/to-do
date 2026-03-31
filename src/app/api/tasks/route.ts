import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const priority = searchParams.get("priority");
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");

  const whereClause: any = { userId: (session.user as any).id };
  if (search) whereClause.title = { contains: search, mode: "insensitive" };
  if (priority) whereClause.priority = priority;
  if (status) whereClause.status = status;
  if (categoryId) whereClause.categoryId = categoryId;

  const tasks = await prisma.task.findMany({ where: whereClause, include: { category: true } });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      ...body,
      userId: (session.user as any).id
    }
  });
  return NextResponse.json(task);
}
