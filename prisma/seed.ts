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

  // ─── Topic 3.5: Mathematics for Machine Learning (Book) ───
  const topicBook = await prisma.topic.create({
    data: {
      title: "Mathematics for Machine Learning (Book)",
      order: 3,
      kind: "BOOK",
    },
  });
  const mmlChapters = [
    "Part I: Chapter 1 — Introduction and Motivation",
    "Part I: Chapter 2 — Linear Algebra",
    "Part I: Chapter 3 — Analytic Geometry",
    "Part I: Chapter 4 — Matrix Decompositions",
    "Part I: Chapter 5 — Vector Calculus",
    "Part I: Chapter 6 — Probability and Distributions",
    "Part I: Chapter 7 — Continuous Optimization",
    "Part II: Chapter 8 — When Models Meet Data",
    "Part II: Chapter 9 — Linear Regression",
    "Part II: Chapter 10 — Dimensionality Reduction with Principal Component Analysis",
    "Part II: Chapter 11 — Density Estimation with Gaussian Mixture Models",
    "Part II: Chapter 12 — Classification with Support Vector Machines",
  ];
  for (let i = 0; i < mmlChapters.length; i++) {
    await prisma.item.create({
      data: {
        topicId: topicBook.id,
        title: mmlChapters[i],
        order: i,
        type: "MANUAL_MILESTONE",
      },
    });
  }
  console.log(`✅ Topic: "${topicBook.title}" — added ${mmlChapters.length} book chapters`);

  // ─── Topic 3.6: Hands-on Large Language Models (Book) ──────
  const topicLlmBook = await prisma.topic.create({
    data: {
      title: "Hands-on Large Language Models (Book)",
      order: 4,
      kind: "BOOK",
    },
  });
  const llmChapters = [
    "Part I: Chapter 1 — An Introduction to Large Language Models",
    "Part I: Chapter 2 — Tokens and Embeddings",
    "Part I: Chapter 3 — Looking Inside Large Language Models",
    "Part II: Chapter 4 — Text Classification",
    "Part II: Chapter 5 — Text Clustering and Topic Modeling",
    "Part II: Chapter 6 — Prompt Engineering",
    "Part II: Chapter 7 — Advanced Text Generation Techniques and Tools",
    "Part II: Chapter 8 — Semantic Search and Retrieval-Augmented Generation",
    "Part II: Chapter 9 — Multimodal Large Language Models",
    "Part III: Chapter 10 — Creating Text Embedding Models",
    "Part III: Chapter 11 — Fine-Tuning Representation Models for Classification",
    "Part III: Chapter 12 — Fine-Tuning Generation Models",
  ];
  for (let i = 0; i < llmChapters.length; i++) {
    await prisma.item.create({
      data: {
        topicId: topicLlmBook.id,
        title: llmChapters[i],
        order: i,
        type: "MANUAL_MILESTONE",
      },
    });
  }
  console.log(`✅ Topic: "${topicLlmBook.title}" — added ${llmChapters.length} book chapters`);

  // ─── Topic 3.7: Hands-on Machine Learning (Book) ──────────
  const topicHomlBook = await prisma.topic.create({
    data: {
      title: "Hands-on Machine Learning (Book)",
      order: 5,
      kind: "BOOK",
    },
  });
  const homlChapters = [
    "Part I: Chapter 1 — The Machine Learning Landscape",
    "Part I: Chapter 2 — End-to-End Machine Learning Project",
    "Part I: Chapter 3 — Classification",
    "Part I: Chapter 4 — Training Models",
    "Part I: Chapter 5 — Support Vector Machines",
    "Part I: Chapter 6 — Decision Trees",
    "Part I: Chapter 7 — Ensemble Learning and Random Forests",
    "Part I: Chapter 8 — Dimensionality Reduction",
    "Part I: Chapter 9 — Unsupervised Learning Techniques",
    "Part II: Chapter 10 — Introduction to Artificial Neural Networks with Keras",
    "Part II: Chapter 11 — Training Deep Neural Networks",
    "Part II: Chapter 12 — Custom Models and Training with TensorFlow",
    "Part II: Chapter 13 — Loading and Preprocessing Data with TensorFlow",
    "Part II: Chapter 14 — Deep Computer Vision Using Convolutional Neural Networks",
  ];
  for (let i = 0; i < homlChapters.length; i++) {
    await prisma.item.create({
      data: {
        topicId: topicHomlBook.id,
        title: homlChapters[i],
        order: i,
        type: "MANUAL_MILESTONE",
      },
    });
  }
  console.log(`✅ Topic: "${topicHomlBook.title}" — added ${homlChapters.length} book chapters`);

  // ─── Topic 4: Machine Learning (Mixed) ─────────────────────
  const topic4 = await prisma.topic.create({
    data: { title: "Machine Learning", order: 6, kind: "PLAYLIST" },
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

  // Moved book chapters to separate Hands-on Machine Learning (Book) topic

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
    data: { title: "Deep Learning", order: 7, kind: "COURSE_MANUAL" },
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
