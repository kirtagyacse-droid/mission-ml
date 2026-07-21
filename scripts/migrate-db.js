/**
 * missionMl Database Migration Script
 * Migrates data from local SQLite (dev.db) to PostgreSQL.
 */

const { PrismaClient } = require("@prisma/client");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

async function main() {
  const pgUrl = process.env.DATABASE_URL;
  if (!pgUrl) {
    console.error("Error: DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const sqlitePath = path.resolve(process.cwd(), "dev.db");
  if (!fs.existsSync(sqlitePath)) {
    console.error(`Error: SQLite database file not found at ${sqlitePath}`);
    process.exit(1);
  }

  console.log("Connecting to SQLite database...");
  const sqliteDb = new Database(sqlitePath);

  // Read all tables from SQLite
  const users = sqliteDb.prepare("SELECT * FROM User").all();
  const topics = sqliteDb.prepare("SELECT * FROM Topic").all();
  const items = sqliteDb.prepare("SELECT * FROM Item").all();
  const progresses = sqliteDb.prepare("SELECT * FROM Progress").all();

  console.log(`Found SQLite data:
  - ${users.length} Users
  - ${topics.length} Topics
  - ${items.length} Items
  - ${progresses.length} Progress records`);

  // Connect to target PostgreSQL database using the driver adapter (required in Prisma 7)
  console.log("Connecting to target PostgreSQL database...");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: pgUrl });
  const adapter = new PrismaPg(pool);
  const pgPrisma = new PrismaClient({ adapter });

  // Migrate Users
  console.log("Migrating Users...");
  for (const user of users) {
    const existing = await pgPrisma.user.findUnique({ where: { id: user.id } });
    const data = {
      email: user.email,
      name: user.name,
      image: user.image,
    };
    if (existing) {
      await pgPrisma.user.update({ where: { id: user.id }, data });
    } else {
      await pgPrisma.user.create({ data: { id: user.id, ...data } });
    }
  }

  // Migrate Topics
  console.log("Migrating Topics...");
  for (const topic of topics) {
    const existing = await pgPrisma.topic.findUnique({ where: { id: topic.id } });
    const data = {
      title: topic.title,
      order: topic.order,
      kind: topic.kind,
    };
    if (existing) {
      await pgPrisma.topic.update({ where: { id: topic.id }, data });
    } else {
      await pgPrisma.topic.create({ data: { id: topic.id, ...data } });
    }
  }

  // Migrate Items
  console.log("Migrating Items...");
  for (const item of items) {
    const existing = await pgPrisma.item.findUnique({ where: { id: item.id } });
    const data = {
      topicId: item.topicId,
      title: item.title,
      order: item.order,
      type: item.type,
      youtubeVideoId: item.youtubeVideoId,
      playlistId: item.playlistId,
    };
    if (existing) {
      await pgPrisma.item.update({ where: { id: item.id }, data });
    } else {
      await pgPrisma.item.create({ data: { id: item.id, ...data } });
    }
  }

  // Migrate Progresses
  console.log("Migrating Progress records...");
  for (const prog of progresses) {
    const existing = await pgPrisma.progress.findUnique({
      where: {
        userId_itemId: {
          userId: prog.userId,
          itemId: prog.itemId,
        },
      },
    });

    const data = {
      userId: prog.userId,
      itemId: prog.itemId,
      completed: prog.completed === 1 || prog.completed === true || prog.completed === 'true',
      manuallyMarked: prog.manuallyMarked === 1 || prog.manuallyMarked === true || prog.manuallyMarked === 'true',
      watchedSeconds: prog.watchedSeconds,
      duration: prog.duration,
      percent: prog.percent,
      lastPosition: prog.lastPosition,
      completedAt: prog.completedAt ? new Date(prog.completedAt) : null,
      updatedAt: new Date(prog.updatedAt),
    };

    if (existing) {
      await pgPrisma.progress.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await pgPrisma.progress.create({
        data: {
          id: prog.id,
          ...data,
        },
      });
    }
  }

  console.log("Migration complete!");
  await pgPrisma.$disconnect();
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
