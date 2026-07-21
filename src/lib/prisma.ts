import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  const isPostgres = url && (url.startsWith("postgres://") || url.startsWith("postgresql://"));

  if (isPostgres) {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } else {
    // Dynamically load SQLite dependencies only when needed to prevent build failures on Vercel
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({
      url: url ?? "file:./dev.db",
    });
    return new PrismaClient({ adapter });
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
