require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function updateDB(connectionString) {
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

  let dlTopic = await prisma.topic.findFirst({
    where: { title: { contains: "Deep Learning", mode: "insensitive" } }
  });

  if (!dlTopic) {
    dlTopic = await prisma.topic.create({
      data: {
        title: "Practical Deep Learning for Coders",
        order: 7,
        kind: "COURSE_MANUAL"
      }
    });
  } else {
    // Update title to Practical Deep Learning for Coders if desired or keep title
    await prisma.topic.update({
      where: { id: dlTopic.id },
      data: { title: "Practical Deep Learning for Coders", kind: "COURSE_MANUAL" }
    });
  }

  // Remove old items (e.g. "Deep Learning — Coming Soon")
  await prisma.item.deleteMany({
    where: { topicId: dlTopic.id }
  });

  const deepLearningLessons = [
    // Part 1
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
    // Part 2
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

  for (let i = 0; i < deepLearningLessons.length; i++) {
    await prisma.item.create({
      data: {
        topicId: dlTopic.id,
        title: deepLearningLessons[i],
        order: i,
        type: "MANUAL_MILESTONE"
      }
    });
  }

  console.log(`✅ Updated "${dlTopic.title}" with ${deepLearningLessons.length} items.`);
  await prisma.$disconnect();
}

async function main() {
  const mainUrl = process.env.DATABASE_URL;
  console.log("Updating database at:", mainUrl ? mainUrl.split("@")[1] || mainUrl : "local sqlite");
  await updateDB(mainUrl);
}

main().catch(console.error);
