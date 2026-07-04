import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { fetchPlaylistItems } from "../src/lib/youtube";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  // Clean existing data
  await prisma.progress.deleteMany();
  await prisma.item.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();

  // Create user
  const email = process.env.ALLOWED_EMAIL ?? "user@example.com";
  const user = await prisma.user.create({
    data: { email, name: "Kirtagya" },
  });
  console.log(`✅ Created user: ${user.email}\n`);

  // ─── Topic 1: Python Mastery ───────────────────────────────
  const topic1 = await prisma.topic.create({
    data: { title: "Python Mastery", order: 0, kind: "COURSE_MANUAL" },
  });
  const weeks = Array.from({ length: 10 }, (_, i) => i);
  for (const w of weeks) {
    const item = await prisma.item.create({
      data: {
        topicId: topic1.id,
        title: `CS50 — Week ${w}`,
        order: w,
        type: "MANUAL_MILESTONE",
      },
    });
    // Mark weeks 0, 1, 2 as completed
    if (w <= 2) {
      await prisma.progress.create({
        data: {
          userId: user.id,
          itemId: item.id,
          completed: true,
          manuallyMarked: true,
          completedAt: new Date(),
        },
      });
    }
  }
  console.log(`✅ Topic: "${topic1.title}" — 10 items (3 completed)`);

  // ─── Topic 2: Python Libraries ─────────────────────────────
  const topic2 = await prisma.topic.create({
    data: { title: "Python Libraries", order: 1, kind: "SINGLE_VIDEO" },
  });
  const libVideos = [
    { title: "NumPy — freeCodeCamp", videoId: "QUT1VHiLmmI" },
    { title: "Pandas — Keith Galli", videoId: "2uvysYbKdjM" },
    { title: "Matplotlib — Bro Code", videoId: "c9vhHUGdav0" },
  ];
  for (let i = 0; i < libVideos.length; i++) {
    await prisma.item.create({
      data: {
        topicId: topic2.id,
        title: libVideos[i].title,
        order: i,
        type: "YOUTUBE_VIDEO",
        youtubeVideoId: libVideos[i].videoId,
      },
    });
  }
  console.log(`✅ Topic: "${topic2.title}" — ${libVideos.length} items`);

  // ─── Topic 3: Maths for Machine Learning (Playlist) ───────
  const topic3 = await prisma.topic.create({
    data: {
      title: "Maths for Machine Learning",
      order: 2,
      kind: "PLAYLIST",
    },
  });
  const mathsPlaylistId = "PLKnIA16_RmvbYFaaeLY28cWeqV-3vADST";
  try {
    console.log(`  📡 Fetching CampusX Maths playlist...`);
    const mathsVideos = await fetchPlaylistItems(mathsPlaylistId);
    for (let i = 0; i < mathsVideos.length; i++) {
      await prisma.item.create({
        data: {
          topicId: topic3.id,
          title: mathsVideos[i].title,
          order: i,
          type: "YOUTUBE_VIDEO",
          youtubeVideoId: mathsVideos[i].videoId,
          playlistId: mathsPlaylistId,
        },
      });
    }
    console.log(
      `✅ Topic: "${topic3.title}" — ${mathsVideos.length} items from playlist`
    );
  } catch (err: any) {
    console.warn(
      `⚠️  Failed to fetch CampusX playlist: ${err.message}. Creating placeholder.`
    );
    await prisma.item.create({
      data: {
        topicId: topic3.id,
        title: "CampusX Maths Playlist (import failed — use admin to re-import)",
        order: 0,
        type: "MANUAL_MILESTONE",
        playlistId: mathsPlaylistId,
      },
    });
  }

  // ─── Topic 4: Machine Learning (Mixed) ─────────────────────
  const topic4 = await prisma.topic.create({
    data: { title: "Machine Learning", order: 3, kind: "PLAYLIST" },
  });

  // Standalone items first
  const mlStandalone = [
    {
      title: "ML for Everybody – Full Course",
      type: "YOUTUBE_VIDEO" as const,
      videoId: "i_LwzRVP7bg",
    },
    {
      title: "Essential ML & AI Concepts Animated",
      type: "YOUTUBE_VIDEO" as const,
      videoId: "PcbuKRNtCUc",
    },
    {
      title: "Build & fit my own models",
      type: "MANUAL_MILESTONE" as const,
      videoId: null,
    },
    {
      title: "Scikit-learn Crash Course",
      type: "YOUTUBE_VIDEO" as const,
      videoId: "0B5eIE_1vpU",
    },
  ];

  let mlOrder = 0;
  for (const s of mlStandalone) {
    await prisma.item.create({
      data: {
        topicId: topic4.id,
        title: s.title,
        order: mlOrder++,
        type: s.type,
        youtubeVideoId: s.videoId,
      },
    });
  }

  // Krish Naik ML Playlist
  const krishPlaylistId = "PLTDARY42LDV7WGmlzZtY-w9pemyPrKNUZ";
  try {
    console.log(`  📡 Fetching Krish Naik ML playlist...`);
    const krishVideos = await fetchPlaylistItems(krishPlaylistId);
    for (let i = 0; i < krishVideos.length; i++) {
      const item = await prisma.item.create({
        data: {
          topicId: topic4.id,
          title: krishVideos[i].title,
          order: mlOrder++,
          type: "YOUTUBE_VIDEO",
          youtubeVideoId: krishVideos[i].videoId,
          playlistId: krishPlaylistId,
        },
      });
      // Mark first 17 as completed
      if (i < 17) {
        await prisma.progress.create({
          data: {
            userId: user.id,
            itemId: item.id,
            completed: true,
            completedAt: new Date(),
          },
        });
      }
    }
    console.log(
      `✅ Topic: "${topic4.title}" — ${mlStandalone.length} standalone + ${krishVideos.length} Krish Naik videos (17 completed)`
    );
  } catch (err: any) {
    console.warn(
      `⚠️  Failed to fetch Krish Naik playlist: ${err.message}. Creating placeholder.`
    );
    await prisma.item.create({
      data: {
        topicId: topic4.id,
        title: "Krish Naik ML Playlist (import failed — use admin to re-import)",
        order: mlOrder++,
        type: "MANUAL_MILESTONE",
        playlistId: krishPlaylistId,
      },
    });
  }

  // Placeholder items at the end
  const placeholders = ["MLOps", "FastAPI", "MLflow", "Docker"];
  for (const p of placeholders) {
    await prisma.item.create({
      data: {
        topicId: topic4.id,
        title: p,
        order: mlOrder++,
        type: "MANUAL_MILESTONE",
      },
    });
  }
  console.log(`  ➕ Added ${placeholders.length} placeholder items (MLOps, FastAPI, MLflow, Docker)`);

  // ─── Topic 5: Deep Learning ────────────────────────────────
  const topic5 = await prisma.topic.create({
    data: { title: "Deep Learning", order: 4, kind: "COURSE_MANUAL" },
  });
  await prisma.item.create({
    data: {
      topicId: topic5.id,
      title: "Deep Learning — Coming Soon",
      order: 0,
      type: "MANUAL_MILESTONE",
    },
  });
  console.log(`✅ Topic: "${topic5.title}" — placeholder`);

  // Summary
  const totalTopics = await prisma.topic.count();
  const totalItems = await prisma.item.count();
  const totalCompleted = await prisma.progress.count({
    where: { completed: true },
  });
  console.log(
    `\n🎯 Seed complete: ${totalTopics} topics, ${totalItems} items, ${totalCompleted} completed`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
