import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/items — create a new item
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { topicId, title, type, youtubeVideoId, playlistId, order } = body;

  if (!topicId || !title || !type) {
    return NextResponse.json(
      { error: "topicId, title, and type required" },
      { status: 400 }
    );
  }

  let itemOrder = order;
  if (itemOrder === undefined) {
    const maxOrder = await prisma.item.aggregate({
      where: { topicId },
      _max: { order: true },
    });
    itemOrder = (maxOrder._max.order ?? -1) + 1;
  }

  const item = await prisma.item.create({
    data: {
      topicId,
      title,
      type,
      order: itemOrder,
      youtubeVideoId: youtubeVideoId || null,
      playlistId: playlistId || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

// PUT /api/items — update an item
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, title, type, youtubeVideoId, order } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const item = await prisma.item.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(type !== undefined && { type }),
      ...(youtubeVideoId !== undefined && { youtubeVideoId }),
      ...(order !== undefined && { order }),
    },
  });

  return NextResponse.json(item);
}

// DELETE /api/items
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
