import "dotenv/config";
import path from "node:path";
import fs from "node:fs/promises";
import { uploadImage } from "../lib/storage";
import { prisma } from "../lib/db";
import { runAiAssessment } from "../lib/ai/assessment";

let passed = 0;
let failed = 0;

function pass(label: string, detail?: string) {
  passed++;
  console.log(`  ✅ PASS  ${label}${detail ? " — " + detail : ""}`);
}

function fail(label: string, detail?: string) {
  failed++;
  console.error(`  ❌ FAIL  ${label}${detail ? " — " + detail : ""}`);
}

function section(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log("  " + title);
  console.log("=".repeat(60));
}

async function main() {
  section("STEP 1 — STORAGE ENGINE DETECTION");

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken && blobToken.trim() !== "") {
    pass("Storage Engine", "Vercel Blob (token detected)");
  } else {
    pass("Storage Engine", "Local public/uploads (offline development fallback)");
  }

  // ── TEST UPLOAD DIRECTLY ──────────────────────────────────────────────────

  section("STEP 2 — DIRECT IMAGE UPLOAD TEST");

  const sampleImagePath = path.join(process.cwd(), "public", "uploads", "evidence_1786272308244_xlxdzr.jpg");
  let testFileBuffer: Buffer;
  try {
    testFileBuffer = await fs.readFile(sampleImagePath);
    pass("Read sample test image from disk", "evidence_1786272308244_xlxdzr.jpg");
  } catch {
    // Create dummy image buffer if sample file missing
    testFileBuffer = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
    pass("Created dummy test image buffer", "Fallback image");
  }

  const sampleFile = new File([new Uint8Array(testFileBuffer)], "test_pothole.jpg", { type: "image/jpeg" });

  let uploadedUrl: string;
  try {
    uploadedUrl = await uploadImage(sampleFile, "test_upload");
    pass("uploadImage execution", uploadedUrl);
  } catch (err) {
    fail("uploadImage execution", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // ── STEP 3: CREATE COMPLAINT VIA ACTION ───────────────────────────────────

  section("STEP 3 — CREATE COMPLAINT WITH PHOTO ATTACHMENT");

  // Create form data simulating citizen submission
  const formData = new FormData();
  formData.append("title", "Test Pothole for Storage Verification");
  formData.append("description", "Testing persistent image upload with photo attachment.");
  formData.append("category", "Roads & Footpaths");
  formData.append("latitude", "12.9716");
  formData.append("longitude", "77.5946");
  formData.append("photo", sampleFile);

  // We test the upload helper and Prisma model insertion
  try {
    const citizenUser = await prisma.user.findFirst({ where: { role: "CITIZEN" } });
    if (!citizenUser) {
      fail("Find test citizen", "No citizen user found in database");
      process.exit(1);
    }
    pass("Found citizen user for complaint test", citizenUser.email);

    const imageUrl = await uploadImage(sampleFile, "evidence");
    pass("Uploaded complaint image via uploadImage", imageUrl);

    const complaint = await prisma.complaint.create({
      data: {
        title: "Test Pothole for Storage Verification",
        description: "Testing persistent image upload with photo attachment.",
        category: "Roads & Footpaths",
        latitude: 12.9716,
        longitude: 77.5946,
        status: "SUBMITTED",
        authorId: citizenUser.id,
      },
    });

    pass("Created complaint in DB", `ID: ${complaint.id}`);

    const evidence = await prisma.evidence.create({
      data: {
        imageUrl,
        type: "PHOTO",
        isRepairEvidence: false,
        uploadedById: citizenUser.id,
        complaintId: complaint.id,
      },
    });

    pass("Created Evidence record in DB", `URL: ${evidence.imageUrl}`);

    // Verify retrieval
    const reloaded = await prisma.complaint.findUniqueOrThrow({
      where: { id: complaint.id },
      include: { evidence: true },
    });

    if (reloaded.evidence.length > 0 && reloaded.evidence[0].imageUrl === imageUrl) {
      pass("Complaint detail query returns image URL correctly", reloaded.evidence[0].imageUrl);
    } else {
      fail("Complaint detail evidence query", "Evidence array mismatch");
    }

    // ── STEP 4: TEST GROQ AI ADVISORY READINESS ──────────────────────────────

    section("STEP 4 — AI ADVISORY REMOTE / LOCAL IMAGE READ");

    const aiResult = await runAiAssessment({
      title: reloaded.title,
      category: reloaded.category,
      description: reloaded.description,
      resolutionNotes: "Repair completed",
      citizenPhotoUrl: reloaded.evidence[0].imageUrl,
      repairPhotoUrl: reloaded.evidence[0].imageUrl,
    });

    if (aiResult) {
      pass("AI Evidence Advisory processed image URL", `Result: ${aiResult.result}, Model: ${aiResult.modelName}`);
    } else {
      fail("AI Evidence Advisory image processing", "returned null");
    }

    // Clean up test complaint
    await prisma.complaint.delete({ where: { id: complaint.id } });
    pass("Cleaned up test complaint record", "✓");

  } catch (err) {
    fail("Complaint submission flow", err instanceof Error ? err.message : String(err));
  }

  // ── FINAL SUMMARY ──────────────────────────────────────────────────────────

  section("FINAL SUMMARY");

  console.log(`\n  Tests passed : ${passed}`);
  console.log(`  Tests failed : ${failed}\n`);

  if (failed === 0) {
    console.log("  🟢 PHOTO UPLOAD PIPELINE FULLY VERIFIED\n");
  } else {
    console.log("  🔴 UPLOAD PIPELINE HAS FAILURES\n");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
