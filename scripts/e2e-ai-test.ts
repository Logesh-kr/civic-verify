/**
 * CivicVerify — Groq AI End-to-End Test Script
 * Run with: npx tsx scripts/e2e-ai-test.ts
 */
import "dotenv/config";
import path from "node:path";
import fs from "node:fs/promises";
import { prisma } from "../lib/db";
import { runAiAssessment } from "../lib/ai/assessment";

let passed = 0;
let failed = 0;

function pass(label: string, detail?: string) {
  passed++;
  console.log(`  PASS  ${label}${detail ? " — " + detail : ""}`);
}

function fail(label: string, detail?: string) {
  failed++;
  console.error(`  FAIL  ${label}${detail ? " — " + detail : ""}`);
}

function section(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log("  " + title);
  console.log("=".repeat(60));
}

async function main() {
  // ── STEP 1: Environment & Configuration ─────────────────────────────────

  section("STEP 1 — GROQ CONFIGURATION");

  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && apiKey.trim() !== "" && !apiKey.startsWith("your-")) {
    pass("GROQ_API_KEY", "DETECTED (length=" + apiKey.trim().length + ", NEVER LOGGED)");
  } else {
    fail("GROQ_API_KEY", "MISSING or PLACEHOLDER");
    console.error("\nCannot proceed — GROQ_API_KEY is not configured.\n");
    process.exit(1);
  }

  const assessmentPath = path.join(process.cwd(), "lib/ai/assessment.ts");
  const assessmentSrc = await fs.readFile(assessmentPath, "utf8");

  if (assessmentSrc.includes("process.env.GROQ_API_KEY") && !assessmentSrc.includes('"use client"')) {
    pass("API key is server-side only", "process.env.GROQ_API_KEY in lib/ai/assessment.ts");
  } else {
    fail("API key location", "Could not confirm server-side only usage");
  }

  // ── STEP 2: Find a suitable complaint ───────────────────────────────────

  section("STEP 2 — FIND SUITABLE TEST COMPLAINT");

  const claimedComplaints = await prisma.complaint.findMany({
    where: { status: "CLAIMED_RESOLVED" },
    include: {
      evidence: { select: { imageUrl: true, isRepairEvidence: true } },
      aiAssessment: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (claimedComplaints.length === 0) {
    fail("CLAIMED_RESOLVED complaints", "None found in database");
    process.exit(1);
  }

  pass("CLAIMED_RESOLVED complaints found", claimedComplaints.length + " total");

  const testComplaint =
    claimedComplaints.find((c) => {
      const hasCitizen = c.evidence.some((e) => !e.isRepairEvidence);
      const hasRepair = c.evidence.some((e) => e.isRepairEvidence);
      return hasCitizen && hasRepair;
    }) ?? claimedComplaints[0];

  const citizenEvidence = testComplaint.evidence.find((e) => !e.isRepairEvidence);
  const repairEvidence = testComplaint.evidence.find((e) => e.isRepairEvidence);

  console.log("\n  [AI TEST] Complaint ID : " + testComplaint.id);
  console.log("  [AI TEST] Title        : " + testComplaint.title);
  console.log("  [AI TEST] Status       : " + testComplaint.status);
  console.log("  [AI TEST] Orig. img    : " + (citizenEvidence?.imageUrl ?? "NONE"));
  console.log("  [AI TEST] Repair img   : " + (repairEvidence?.imageUrl ?? "NONE"));
  console.log("  [AI TEST] AiAssessment : " + (testComplaint.aiAssessment?.status ?? "NONE"));

  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  let citizenFileFound = false;
  let repairFileFound = false;

  if (citizenEvidence?.imageUrl) {
    const fname = path.basename(citizenEvidence.imageUrl);
    try {
      await fs.access(path.join(uploadsDir, fname));
      citizenFileFound = true;
      pass("Original citizen image on disk", fname);
    } catch {
      fail("Original citizen image on disk", fname + " NOT FOUND");
    }
  } else {
    console.log("  WARN: No citizen evidence URL — testing with repair image only");
  }

  if (repairEvidence?.imageUrl) {
    const fname = path.basename(repairEvidence.imageUrl);
    try {
      await fs.access(path.join(uploadsDir, fname));
      repairFileFound = true;
      pass("Repair image on disk", fname);
    } catch {
      fail("Repair image on disk", fname + " NOT FOUND");
    }
  } else {
    fail("Repair image", "No repair evidence URL found");
  }

  if (!repairFileFound) {
    fail("Cannot proceed with AI test", "No repair image on disk");
    process.exit(1);
  }

  // ── STEP 3: Actual Groq Vision API Call ─────────────────────────────────

  section("STEP 3 — ACTUAL GROQ VISION API CALL");
  console.log("  [AI TEST] Provider: Groq");
  console.log("  [AI TEST] Model: qwen/qwen3.6-27b");
  console.log("  [AI TEST] API key: DETECTED");
  console.log("  [AI TEST] Original evidence: " + (citizenFileFound ? "FOUND" : "NOT AVAILABLE"));
  console.log("  [AI TEST] Repair evidence: FOUND");

  const aiStartTime = Date.now();
  const aiResult = await runAiAssessment({
    title: testComplaint.title,
    category: testComplaint.category,
    description: testComplaint.description,
    resolutionNotes: testComplaint.resolutionNotes ?? "",
    citizenPhotoUrl: citizenEvidence?.imageUrl ?? null,
    repairPhotoUrl: repairEvidence?.imageUrl ?? null,
  });
  const aiElapsed = Date.now() - aiStartTime;

  // ── STEP 4: Validate AI Response ────────────────────────────────────────

  section("STEP 4 — VALIDATE AI RESPONSE");

  if (aiResult === null) {
    fail("Groq vision request", "runAiAssessment returned null — check logs above");
    fail("AI response", "null");
    fail("Structured parsing", "failed");
  } else {
    pass("Groq vision request", "SUCCESS in " + aiElapsed + "ms");
    console.log("\n  [AI TEST] Vision request: SUCCESS");
    console.log("  [AI TEST] AI result: " + aiResult.result);
    console.log("  [AI TEST] Confidence: " + aiResult.confidenceScore);
    console.log("  [AI TEST] Explanation: RECEIVED (" + aiResult.explanation.length + " chars)");
    console.log("  [AI TEST] Model: " + aiResult.modelName);

    const VALID = ["LIKELY_RESOLVED", "NEEDS_REVIEW", "LIKELY_NOT_RESOLVED"];
    if (VALID.includes(aiResult.result)) {
      pass("Result enum valid", aiResult.result);
    } else {
      fail("Result enum", "Invalid: " + aiResult.result);
    }

    if (aiResult.confidenceScore >= 0 && aiResult.confidenceScore <= 1) {
      pass("Confidence 0.0–1.0", String(aiResult.confidenceScore));
    } else {
      fail("Confidence out of range", String(aiResult.confidenceScore));
    }

    if (aiResult.explanation && aiResult.explanation.trim().length > 10) {
      pass("Explanation present", aiResult.explanation.substring(0, 80) + "...");
    } else {
      fail("Explanation", "Missing or too short");
    }

    // ── STEP 5: DB Save ────────────────────────────────────────────────────

    section("STEP 5 — DATABASE SAVE");

    try {
      const saved = await prisma.aiAssessment.upsert({
        where: { complaintId: testComplaint.id },
        create: {
          complaintId: testComplaint.id,
          status: "COMPLETED",
          result: aiResult.result,
          confidenceScore: aiResult.confidenceScore,
          explanation: aiResult.explanation,
          modelName: aiResult.modelName,
        },
        update: {
          status: "COMPLETED",
          result: aiResult.result,
          confidenceScore: aiResult.confidenceScore,
          explanation: aiResult.explanation,
          modelName: aiResult.modelName,
        },
      });
      console.log("  [AI TEST] Database save: SUCCESS");
      pass("AiAssessment upserted to DB", "status=" + saved.status);

      const reloaded = await prisma.complaint.findUniqueOrThrow({
        where: { id: testComplaint.id },
      });
      if (reloaded.status === "CLAIMED_RESOLVED") {
        pass("Complaint status unchanged by AI", "Still CLAIMED_RESOLVED");
      } else {
        fail("AI changed complaint.status!", "Now: " + reloaded.status);
      }
    } catch (dbErr) {
      fail("AiAssessment DB save", dbErr instanceof Error ? dbErr.message : String(dbErr));
    }
  }

  // ── STEP 6: Failure Fallback ─────────────────────────────────────────────

  section("STEP 6 — FAILURE FALLBACK TEST");
  console.log("  Simulating bad image paths...");

  const failResult = await runAiAssessment({
    title: "Failure Test",
    category: "Road",
    description: "Test",
    resolutionNotes: "Test",
    citizenPhotoUrl: "/uploads/NONEXISTENT_99999.jpg",
    repairPhotoUrl: "/uploads/NONEXISTENT_88888.jpg",
  });

  if (failResult === null) {
    pass("AI failure returns null gracefully", "Non-crashing on bad paths");
  } else {
    fail("AI failure handling", "Expected null for bad paths");
  }

  try {
    const failedRecord = await prisma.aiAssessment.upsert({
      where: { complaintId: testComplaint.id },
      create: { complaintId: testComplaint.id, status: "FAILED" },
      update: { status: "FAILED", result: null, confidenceScore: null, explanation: null },
    });
    pass("FAILED AiAssessment stored", "status=" + failedRecord.status);

    const reloadAfterFail = await prisma.complaint.findUniqueOrThrow({
      where: { id: testComplaint.id },
    });
    if (reloadAfterFail.status === "CLAIMED_RESOLVED") {
      pass("Complaint stays CLAIMED_RESOLVED after AI FAILED", "Citizen not blocked");
    } else {
      fail("Complaint status changed by AI failure", "Now: " + reloadAfterFail.status);
    }

    // Restore
    if (aiResult) {
      await prisma.aiAssessment.update({
        where: { complaintId: testComplaint.id },
        data: {
          status: "COMPLETED",
          result: aiResult.result,
          confidenceScore: aiResult.confidenceScore,
          explanation: aiResult.explanation,
          modelName: aiResult.modelName,
        },
      });
      pass("Restored COMPLETED assessment", "DB restored after failure test");
    }
  } catch (err) {
    fail("FAILED status storage test", err instanceof Error ? err.message : String(err));
  }

  // ── STEP 7: Security ─────────────────────────────────────────────────────

  section("STEP 7 — SECURITY CHECKS");

  if (!assessmentSrc.includes(apiKey!)) {
    pass("API key not hardcoded in assessment.ts", "No literal key found");
  } else {
    fail("API key HARDCODED", "CRITICAL SECURITY ISSUE");
  }

  if (!assessmentSrc.includes('"use client"') && !assessmentSrc.includes("'use client'")) {
    pass("assessment.ts is server-side only", "No 'use client' directive");
  } else {
    fail("assessment.ts has 'use client'", "API key could reach browser");
  }

  if (!assessmentSrc.includes("complaint.status") && !assessmentSrc.includes("ComplaintStatus")) {
    pass("AI module cannot mutate complaint.status", "No ComplaintStatus reference");
  } else {
    fail("AI module references ComplaintStatus", "Review for mutation risk");
  }

  const complaintsSrc = await fs.readFile(
    path.join(process.cwd(), "lib/actions/complaints.ts"),
    "utf8"
  );
  if (complaintsSrc.includes("AI Action Trigger") && complaintsSrc.includes("catch (aiErr)")) {
    pass("claimResolutionAction wraps AI non-blocking", "try/catch confirmed");
  } else {
    fail("AI wrapping", "Non-blocking pattern not confirmed");
  }

  if (!assessmentSrc.includes("prisma.complaint.update")) {
    pass("AI module has no prisma.complaint.update", "Cannot modify complaint row");
  } else {
    fail("AI module has prisma.complaint.update", "CRITICAL: review assessment.ts");
  }

  // ── STEP 8: Citizen Control ───────────────────────────────────────────────

  section("STEP 8 — CITIZEN VERIFICATION CONTROL");

  try {
    const verSrc = await fs.readFile(
      path.join(process.cwd(), "lib/actions/verification.ts"),
      "utf8"
    );
    if (verSrc.includes("VERIFIED") && verSrc.includes("DISPUTED")) {
      pass("verifyResolutionAction / disputeResolutionAction exist", "Both transitions");
    } else {
      fail("Verification actions", "VERIFIED/DISPUTED missing");
    }
    if (verSrc.includes("authorId") || verSrc.includes("user.id")) {
      pass("Citizen ownership enforced in verification", "User ID check present");
    } else {
      fail("Citizen ownership check", "Cannot confirm");
    }
  } catch {
    fail("lib/actions/verification.ts", "File missing?");
  }

  // ── STEP 9: UI Integration ────────────────────────────────────────────────

  section("STEP 9 — UI INTEGRATION CHECK");

  const advisoryCardSrc = await fs.readFile(
    path.join(process.cwd(), "components/verification/AiAdvisoryCard.tsx"),
    "utf8"
  );

  if (advisoryCardSrc.includes("aiAssessment.result") && advisoryCardSrc.includes("confidenceScore")) {
    pass("AiAdvisoryCard renders real result + confidenceScore from DB", "Wired to DB data");
  } else {
    fail("AiAdvisoryCard wiring", "Cannot confirm DB data rendering");
  }

  if (advisoryCardSrc.includes("advisory")) {
    pass("Advisory disclaimer present in AiAdvisoryCard", "Citizen control stated");
  } else {
    fail("Advisory disclaimer missing", "");
  }

  if (advisoryCardSrc.includes("FAILED") && advisoryCardSrc.includes("Unavailable")) {
    pass("AiAdvisoryCard shows 'Unavailable' on AI FAILED", "Citizen not blocked");
  } else {
    fail("AI failure fallback UI", "Missing FAILED state in AiAdvisoryCard");
  }

  if (advisoryCardSrc.includes("PENDING") && advisoryCardSrc.includes("Analyzing")) {
    pass("AiAdvisoryCard shows 'Analyzing...' on PENDING", "Good UX");
  } else {
    fail("AI pending state UI", "Missing PENDING state in AiAdvisoryCard");
  }

  const verCardSrc = await fs.readFile(
    path.join(process.cwd(), "app/dashboard/verification/VerificationCard.tsx"),
    "utf8"
  );
  if (verCardSrc.includes("AiAdvisoryCard") && verCardSrc.includes("aiAssessment")) {
    pass("VerificationCard passes aiAssessment to AiAdvisoryCard", "Wired");
  } else {
    fail("VerificationCard → AiAdvisoryCard wiring", "Cannot confirm");
  }

  if (verCardSrc.includes("verifyResolutionAction") && verCardSrc.includes("disputeResolutionAction")) {
    pass("Verify + Dispute both available regardless of AI result", "Citizen always in control");
  } else {
    fail("Verify/Dispute buttons", "Missing from VerificationCard");
  }

  // ── Final Summary ─────────────────────────────────────────────────────────

  section("FINAL SUMMARY");

  if (aiResult) {
    console.log("\n  Provider   : Groq");
    console.log("  Model      : " + aiResult.modelName);
    console.log("  AI result  : " + aiResult.result);
    console.log("  Confidence : " + Math.round(aiResult.confidenceScore * 100) + "%");
    console.log("  Explanation: " + aiResult.explanation.substring(0, 120));
    console.log("  DB status  : COMPLETED");
  } else {
    console.log("\n  AI call    : FAILED (see Groq error logs above)");
  }

  console.log("\n  Tests passed : " + passed);
  console.log("  Tests failed : " + failed);
  console.log("");

  if (failed === 0) {
    console.log("  GROQ AI FULLY VERIFIED");
  } else if (passed > failed) {
    console.log("  GROQ AI WORKS BUT NEEDS FIXES");
  } else {
    console.log("  GROQ AI NOT WORKING");
  }

  console.log("");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
