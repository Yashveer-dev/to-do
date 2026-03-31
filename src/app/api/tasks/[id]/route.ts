import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const task = await prisma.task.updateMany({
    where: { id: params.id, userId: (session.user as any).id },
    data: body
  });
  return NextResponse.json(task);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.task.deleteMany({
    where: { id: params.id, userId: (session.user as any).id }
  });
  return NextResponse.json({ success: true });
}
