import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET /api/progress?itemId=xxx (optional filter)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId;
  const itemId = req.nextUrl.searchParams.get("itemId");

  const where: any = { userId };
  if (itemId) where.itemId = itemId;

  const progress = await prisma.progress.findMany({ where });
  return NextResponse.json(progress);
}

// POST /api/progress — upsert watch progress (called by player every 5s)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId;
  const body = await req.json();
  const { itemId, watchedSeconds, duration } = body;

  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const percent = duration > 0 ? (watchedSeconds / duration) * 100 : 0;
  const threshold = Number(process.env.COMPLETION_THRESHOLD ?? 90);
  const shouldComplete = percent >= threshold;

  const progress = await prisma.progress.upsert({
    where: { userId_itemId: { userId, itemId } },
    create: {
      userId,
      itemId,
      watchedSeconds,
      duration,
      percent,
      lastPosition: watchedSeconds,
      completed: shouldComplete,
      completedAt: shouldComplete ? new Date() : null,
    },
    update: {
      watchedSeconds,
      duration,
      percent,
      lastPosition: watchedSeconds,
      ...(shouldComplete
        ? { completed: true, completedAt: new Date() }
        : {}),
    },
  });

  return NextResponse.json(progress);
}

// PATCH /api/progress — manual toggle completed
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId;
  const body = await req.json();
  const { itemId, completed } = body;

  if (!itemId || typeof completed !== "boolean") {
    return NextResponse.json(
      { error: "itemId and completed (boolean) required" },
      { status: 400 }
    );
  }

  const progress = await prisma.progress.upsert({
    where: { userId_itemId: { userId, itemId } },
    create: {
      userId,
      itemId,
      completed,
      manuallyMarked: true,
      completedAt: completed ? new Date() : null,
    },
    update: {
      completed,
      manuallyMarked: true,
      completedAt: completed ? new Date() : null,
    },
  });

  return NextResponse.json(progress);
}
