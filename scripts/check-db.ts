import { prisma } from "../lib/db";

async function main() {
  const complaints = await prisma.complaint.findMany({
    include: {
      evidence: {
        select: { id: true, isRepairEvidence: true, imageUrl: true },
      },
      aiAssessment: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  console.log("=== COMPLAINTS (latest 10) ===");
  for (const c of complaints) {
    console.log(`\nID: ${c.id}`);
    console.log(`  Title: ${c.title}`);
    console.log(`  Status: ${c.status}`);
    console.log(`  Evidence count: ${c.evidence.length}`);
    console.log(
      `  Citizen evidence: ${c.evidence.filter((e) => !e.isRepairEvidence).map((e) => e.imageUrl).join(", ") || "none"}`
    );
    console.log(
      `  Repair evidence: ${c.evidence.filter((e) => e.isRepairEvidence).map((e) => e.imageUrl).join(", ") || "none"}`
    );
    if (c.aiAssessment) {
      console.log(`  AI Assessment: status=${c.aiAssessment.status}, result=${c.aiAssessment.result}, confidence=${c.aiAssessment.confidenceScore}`);
      console.log(`  AI Model: ${c.aiAssessment.modelName}`);
      console.log(`  AI Explanation: ${c.aiAssessment.explanation?.substring(0, 100)}`);
    } else {
      console.log(`  AI Assessment: NONE`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
