import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET /api/topics — list all topics with items and progress
export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId;

  const topics = await prisma.topic.findMany({
    orderBy: { order: "asc" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          progress: {
            where: { userId },
          },
        },
      },
    },
  });

  return NextResponse.json(topics);
}

// POST /api/topics — create a new topic
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, kind } = body;

  if (!title || !kind) {
    return NextResponse.json(
      { error: "title and kind required" },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.topic.aggregate({ _max: { order: true } });
  const topic = await prisma.topic.create({
    data: {
      title,
      kind,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(topic, { status: 201 });
}

// PUT /api/topics — update a topic
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, title, kind, order } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const topic = await prisma.topic.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(kind !== undefined && { kind }),
      ...(order !== undefined && { order }),
    },
  });

  return NextResponse.json(topic);
}

// DELETE /api/topics
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.topic.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
