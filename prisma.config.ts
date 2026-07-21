import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.MISSION_ML_PRISMA_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
