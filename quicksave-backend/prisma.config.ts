import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'prisma/seed.ts',
  },
  datasource: {
    // Note: use DIRECT_URL here so the CLI can modify the DB structure directly
    url: process.env["DIRECT_URL"],
  },
});