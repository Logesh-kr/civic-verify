import "dotenv/config";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const rawUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
let dbUrl: string;

if (rawUrl.startsWith("file:")) {
  const filePath = rawUrl.replace("file:", "");
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), "prisma", "dev.db");
  dbUrl = `file:${absolutePath.replace(/\\/g, "/")}`;
} else {
  dbUrl = rawUrl;
}

const adapter = new PrismaLibSql({ url: dbUrl });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
