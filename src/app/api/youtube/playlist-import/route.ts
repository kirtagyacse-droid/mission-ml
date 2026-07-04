import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchPlaylistItems } from "@/lib/youtube";

// POST /api/youtube/playlist-import
// Body: { playlistId: string, topicId: string, startOrder?: number }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { playlistId, topicId, startOrder = 0 } = body;

  if (!playlistId || !topicId) {
    return NextResponse.json(
      { error: "playlistId and topicId required" },
      { status: 400 }
    );
  }

  // Verify topic exists
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  try {
    const videos = await fetchPlaylistItems(playlistId);

    const created = [];
    for (let i = 0; i < videos.length; i++) {
      const item = await prisma.item.create({
        data: {
          topicId,
          title: videos[i].title,
          order: startOrder + i,
          type: "YOUTUBE_VIDEO",
          youtubeVideoId: videos[i].videoId,
          playlistId,
        },
      });
      created.push(item);
    }

    return NextResponse.json({
      message: `Imported ${created.length} videos`,
      count: created.length,
      items: created,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to fetch playlist: ${err.message}` },
      { status: 500 }
    );
  }
}
