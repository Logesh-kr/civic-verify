/**
 * Script: retry-ai-assessments.ts
 * Resets FAILED AI assessments for CLAIMED_RESOLVED complaints and re-runs Groq vision.
 * Only re-runs assessments where BOTH evidence files actually exist on disk.
 */
import { prisma } from "../lib/db";
import { runAiAssessment } from "../lib/ai/assessment";
import { AiAssessmentStatus } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

function fileExists(relativeUrl: string | null): boolean {
  if (!relativeUrl || !relativeUrl.startsWith("/uploads/")) return false;
  const filename = path.basename(relativeUrl);
  const fullPath = path.join(process.cwd(), "public", "uploads", filename);
  return fs.existsSync(fullPath);
}

async function main() {
  console.log("[Retry AI] Loading CLAIMED_RESOLVED complaints with FAILED AI assessments...");

  const complaints = await prisma.complaint.findMany({
    where: {
      status: "CLAIMED_RESOLVED",
      aiAssessment: {
        status: { in: ["FAILED", "PENDING"] },
      },
    },
    include: {
      aiAssessment: true,
      evidence: {
        select: { imageUrl: true, isRepairEvidence: true },
      },
    },
  });

  console.log(`[Retry AI] Found ${complaints.length} complaint(s) to retry.`);

  for (const complaint of complaints) {
    if (complaints.indexOf(complaint) > 0) {
      console.log("  [Waiting 5s for rate limit window...]");
      await new Promise((r) => setTimeout(r, 5000));
    }

    const citizenEvidence = complaint.evidence.find((e) => !e.isRepairEvidence);
    const repairEvidence = complaint.evidence.find((e) => e.isRepairEvidence);

    const citizenUrl = citizenEvidence?.imageUrl ?? null;
    const repairUrl = repairEvidence?.imageUrl ?? null;

    const citizenExists = fileExists(citizenUrl);
    const repairExists = fileExists(repairUrl);

    console.log(`\n[Retry AI] Complaint: ${complaint.id}`);
    console.log(`  Title: ${complaint.title}`);
    console.log(`  Citizen image: ${citizenUrl} → exists: ${citizenExists}`);
    console.log(`  Repair image: ${repairUrl} → exists: ${repairExists}`);

    if (!repairExists) {
      console.log(`  [SKIP] Repair evidence file missing — cannot run AI.`);
      continue;
    }

    // Reset to PENDING
    await prisma.aiAssessment.update({
      where: { complaintId: complaint.id },
      data: {
        status: AiAssessmentStatus.PENDING,
        result: null,
        confidenceScore: null,
        explanation: null,
        modelName: "qwen/qwen3.6-27b",
      },
    });

    const aiContext = {
      title: complaint.title,
      category: complaint.category,
      description: complaint.description,
      resolutionNotes: complaint.resolutionNotes || "",
      citizenPhotoUrl: citizenExists ? citizenUrl : null,
      repairPhotoUrl: repairUrl,
    };

    console.log(`  [Running] Calling Groq AI...`);
    const aiResult = await runAiAssessment(aiContext);

    if (aiResult) {
      await prisma.aiAssessment.update({
        where: { complaintId: complaint.id },
        data: {
          status: AiAssessmentStatus.COMPLETED,
          result: aiResult.result,
          confidenceScore: aiResult.confidenceScore,
          explanation: aiResult.explanation,
          modelName: aiResult.modelName,
        },
      });
      console.log(
        `  [SUCCESS] Result: ${aiResult.result}, Confidence: ${aiResult.confidenceScore}`
      );
      console.log(`  [Explanation] ${aiResult.explanation?.substring(0, 120)}`);
    } else {
      await prisma.aiAssessment.update({
        where: { complaintId: complaint.id },
        data: { status: AiAssessmentStatus.FAILED },
      });
      console.log(`  [FAILED] AI assessment returned null.`);
    }
  }

  console.log("\n[Retry AI] Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[Retry AI Error]", err);
    process.exit(1);
  });
