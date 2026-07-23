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

  // Removed old MLOps, FastAPI, MLflow, Docker placeholders from Machine Learning topic as they are now standalone topics below!
  console.log(`✅ Topic: "${topic4.title}" — ${mlStandalone.length} items`);

  // ─── Topic 4.1: MLOps ──────────────────────────────────────
  const topicMLOps = await prisma.topic.create({
    data: { title: "MLOps", order: 8, kind: "COURSE_MANUAL" },
  });
  const mlopsChapters = [
    "01-intro",
    "02-experiment-tracking",
    "03-orchestration",
    "04-deployment",
    "05-monitoring",
    "06-best-practices",
    "07-project",
  ];
  for (let i = 0; i < mlopsChapters.length; i++) {
    await prisma.item.create({
      data: {
        topicId: topicMLOps.id,
        title: mlopsChapters[i],
        order: i,
        type: "MANUAL_MILESTONE",
      },
    });
  }

  // ─── Topic 4.2: Docker ─────────────────────────────────────
  const topicDocker = await prisma.topic.create({
    data: { title: "Docker", order: 9, kind: "SINGLE_VIDEO" },
  });
  await prisma.item.create({
    data: {
      topicId: topicDocker.id,
      title: "Docker Tutorial for Beginners – Full Course (7 Hours)",
      order: 0,
      type: "YOUTUBE_VIDEO",
      youtubeVideoId: "rjjES5IsPdg",
    },
  });

  // ─── Topic 4.3: FastAPI ────────────────────────────────────
  const topicFastAPI = await prisma.topic.create({
    data: { title: "FastAPI", order: 10, kind: "PLAYLIST" },
  });
  await prisma.item.create({
    data: {
      topicId: topicFastAPI.id,
      title: "FastAPI Complete Course for Beginners",
      order: 0,
      type: "YOUTUBE_VIDEO",
      youtubeVideoId: "gQtr9-iVj4w",
      playlistId: "PLKnIA16_RmvZ41tjbKB2ZnwchfniNsMuQ",
    },
  });

  // ─── Topic 4.4: SQL ────────────────────────────────────────
  const topicSQL = await prisma.topic.create({
    data: { title: "SQL", order: 11, kind: "SINGLE_VIDEO" },
  });
  await prisma.item.create({
    data: {
      topicId: topicSQL.id,
      title: "SQL Tutorial - Full Database Course for Beginners",
      order: 0,
      type: "YOUTUBE_VIDEO",
      youtubeVideoId: "HXV3zeQKqGY",
    },
  });

  // ─── Topic 4.5: Git & GitHub ───────────────────────────────
  const topicGit = await prisma.topic.create({
    data: { title: "Git & GitHub", order: 12, kind: "SINGLE_VIDEO" },
  });
  await prisma.item.create({
    data: {
      topicId: topicGit.id,
      title: "Git and GitHub Crash Course",
      order: 0,
      type: "YOUTUBE_VIDEO",
      youtubeVideoId: "mAFoROnOfHs",
    },
  });

  // ─── Topic 5: Deep Learning ────────────────────────────────
  const topic5 = await prisma.topic.create({
    data: { title: "Deep Learning", order: 7, kind: "COURSE_MANUAL" },
  });
  const dlLessons = [
    "Part 1: 1 — Getting started",
    "Part 1: 2 — Deployment",
    "Part 1: 3 — Neural net foundations",
    "Part 1: 4 — Natural Language (NLP)",
    "Part 1: 5 — From-scratch model",
    "Part 1: 6 — Random forests",
    "Part 1: 7 — Collaborative filtering",
    "Part 1: 8 — Convolutions (CNNs)",
    "Part 1: Bonus — Data ethics",
    "Part 1: Summaries",
    "Part 2: Overview — Deep Learning Foundations to Stable Diffusion",
    "Part 2: 9 — Stable Diffusion",
    "Part 2: 10 — Diving Deeper",
    "Part 2: 11 — Matrix multiplication",
    "Part 2: 12 — Mean shift clustering",
    "Part 2: 13 — Backpropagation & MLP",
    "Part 2: 14 — Backpropagation",
    "Part 2: 15 — Autoencoders",
    "Part 2: 16 — The Learner framework",
    "Part 2: 17 — Initialization/normalization",
    "Part 2: 18 — Accelerated SGD & ResNets",
    "Part 2: 19 — DDPM and Dropout",
    "Part 2: 20 — Mixed Precision",
    "Part 2: 21 — DDIM",
    "Part 2: 22 — Karras et al (2022)",
    "Part 2: 23 — Super resolution",
    "Part 2: 24 — Attention & transformers",
    "Part 2: 25 — Latent diffusion",
    "Part 2: Bonus — Lesson 9a",
    "Part 2: Bonus — Lesson 9b"
  ];
  for (let i = 0; i < dlLessons.length; i++) {
    await prisma.item.create({
      data: {
        topicId: topic5.id,
        title: dlLessons[i],
        order: i,
        type: "MANUAL_MILESTONE",
      },
    });
  }
  console.log(`✅ Topic: "${topic5.title}" — added ${dlLessons.length} course items`);

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
