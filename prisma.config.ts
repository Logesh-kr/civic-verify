import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 requires the datasource URL to be configured here
// instead of in schema.prisma.
// See: https://www.prisma.io/docs/orm/reference/prisma-config-reference

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/civicverify",
  },
});
