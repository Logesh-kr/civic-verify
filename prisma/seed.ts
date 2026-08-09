import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

async function main() {
  console.log("🌱 Seeding CivicVerify demo users...");

  // Hash demo passwords
  const citizenPasswordHash = await bcrypt.hash("DemoCitizen123!", 10);
  const authorityPasswordHash = await bcrypt.hash("DemoAuthority123!", 10);

  // 1. Citizen Demo User
  const citizen = await prisma.user.upsert({
    where: { email: "citizen@demo.civicverify.local" },
    update: {
      name: "Demo Citizen",
      passwordHash: citizenPasswordHash,
      role: Role.CITIZEN,
    },
    create: {
      name: "Demo Citizen",
      email: "citizen@demo.civicverify.local",
      passwordHash: citizenPasswordHash,
      role: Role.CITIZEN,
    },
  });

  // 2. Authority Demo User
  const authority = await prisma.user.upsert({
    where: { email: "authority@demo.civicverify.local" },
    update: {
      name: "Demo Authority Official",
      passwordHash: authorityPasswordHash,
      role: Role.AUTHORITY,
    },
    create: {
      name: "Demo Authority Official",
      email: "authority@demo.civicverify.local",
      passwordHash: authorityPasswordHash,
      role: Role.AUTHORITY,
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("----------------------------------------");
  console.log(`Citizen Demo (ID: ${citizen.id}):`);
  console.log("  Email:    citizen@demo.civicverify.local");
  console.log("  Password: DemoCitizen123!");
  console.log("  Role:     CITIZEN");
  console.log("----------------------------------------");
  console.log(`Authority Demo (ID: ${authority.id}):`);
  console.log("  Email:    authority@demo.civicverify.local");
  console.log("  Password: DemoAuthority123!");
  console.log("  Role:     AUTHORITY");
  console.log("----------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
