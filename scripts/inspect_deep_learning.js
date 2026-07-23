require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = process.env.missionml_PRISMA_DATABASE_URL ?? process.env.MISSION_ML_PRISMA_DATABASE_URL ?? process.env.DATABASE_URL;
  let prisma;
  if (url && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } else {
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url: url ?? "file:./dev.db" });
    prisma = new PrismaClient({ adapter });
  }

  const dlTopic = await prisma.topic.findFirst({
    where: { title: { contains: "Deep Learning", mode: "insensitive" } },
    include: { items: true }
  });

  console.log("Deep Learning Topic:", JSON.stringify(dlTopic, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
