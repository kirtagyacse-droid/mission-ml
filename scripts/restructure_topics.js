require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function fetchPlaylistItems(playlistId, apiKey) {
  const videos = [];
  let nextPageToken;
  do {
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults: '50',
      key: apiKey,
    });
    if (nextPageToken) params.set('pageToken', nextPageToken);

    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`YouTube API error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    for (const item of data.items ?? []) {
      const snippet = item.snippet;
      if (snippet.title === 'Deleted video' || snippet.title === 'Private video') continue;
      videos.push({
        videoId: snippet.resourceId?.videoId ?? '',
        title: snippet.title ?? 'Untitled',
      });
    }
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  return videos;
}

async function runUpdates(connectionString) {
  let prisma;
  if (connectionString && (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://"))) {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } else {
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url: connectionString || "file:./prisma/dev.db" });
    prisma = new PrismaClient({ adapter });
  }

  // 1. Clean up "Machine Learning" topic (remove MLOps, FastAPI, MLflow, Docker items)
  const mlTopic = await prisma.topic.findFirst({
    where: { title: "Machine Learning" }
  });

  if (mlTopic) {
    await prisma.item.deleteMany({
      where: {
        topicId: mlTopic.id,
        title: { in: ["MLOps", "FastAPI", "MLflow", "Docker"] }
      }
    });
    console.log("✅ Cleaned up Machine Learning topic placeholder items.");
  }

  // Helper to upsert a topic with items
  async function upsertTopicWithItems(title, kind, items, order) {
    let topic = await prisma.topic.findFirst({ where: { title } });
    if (!topic) {
      topic = await prisma.topic.create({
        data: { title, kind, order }
      });
    } else {
      await prisma.topic.update({
        where: { id: topic.id },
        data: { kind, order }
      });
      await prisma.item.deleteMany({ where: { topicId: topic.id } });
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      await prisma.item.create({
        data: {
          topicId: topic.id,
          title: it.title,
          order: i,
          type: it.type || "MANUAL_MILESTONE",
          youtubeVideoId: it.youtubeVideoId || null,
          playlistId: it.playlistId || null
        }
      });
    }
    console.log(`✅ Upserted Topic: "${title}" (${items.length} items)`);
  }

  // 2. MLOps Topic
  const mlopsItems = [
    { title: "01-intro" },
    { title: "02-experiment-tracking" },
    { title: "03-orchestration" },
    { title: "04-deployment" },
    { title: "05-monitoring" },
    { title: "06-best-practices" },
    { title: "07-project" }
  ];
  await upsertTopicWithItems("MLOps", "COURSE_MANUAL", mlopsItems, 8);

  // 3. Docker Topic
  const dockerItems = [
    {
      title: "Docker Tutorial for Beginners – Full Course (7 Hours)",
      type: "YOUTUBE_VIDEO",
      youtubeVideoId: "rjjES5IsPdg"
    }
  ];
  await upsertTopicWithItems("Docker", "SINGLE_VIDEO", dockerItems, 9);

  // 4. FastAPI Topic (Playlist)
  let fastApiItems = [];
  const playlistId = "PLKnIA16_RmvZ41tjbKB2ZnwchfniNsMuQ";
  const ytKey = process.env.YOUTUBE_API_KEY;

  if (ytKey) {
    try {
      console.log("  📡 Fetching FastAPI playlist items from YouTube...");
      const ytVideos = await fetchPlaylistItems(playlistId, ytKey);
      fastApiItems = ytVideos.map((v) => ({
        title: v.title,
        type: "YOUTUBE_VIDEO",
        youtubeVideoId: v.videoId,
        playlistId
      }));
    } catch (err) {
      console.warn("⚠️ Could not fetch FastAPI playlist from YouTube API:", err.message);
    }
  }

  if (fastApiItems.length === 0) {
    fastApiItems = [
      {
        title: "FastAPI Complete Course for Beginners",
        type: "YOUTUBE_VIDEO",
        youtubeVideoId: "gQtr9-iVj4w",
        playlistId
      }
    ];
  }
  await upsertTopicWithItems("FastAPI", "PLAYLIST", fastApiItems, 10);

  // 5. SQL Topic
  const sqlItems = [
    {
      title: "SQL Tutorial - Full Database Course for Beginners",
      type: "YOUTUBE_VIDEO",
      youtubeVideoId: "HXV3zeQKqGY"
    }
  ];
  await upsertTopicWithItems("SQL", "SINGLE_VIDEO", sqlItems, 11);

  // 6. Git & GitHub Topic
  const gitItems = [
    {
      title: "Git and GitHub Crash Course",
      type: "YOUTUBE_VIDEO",
      youtubeVideoId: "mAFoROnOfHs"
    }
  ];
  await upsertTopicWithItems("Git & GitHub", "SINGLE_VIDEO", gitItems, 12);

  await prisma.$disconnect();
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  console.log("Running topic restructuring on DB:", dbUrl ? dbUrl.split("@")[1] || dbUrl : "local sqlite");
  await runUpdates(dbUrl);
}

main().catch(console.error);
