import "dotenv/config";
import { runAiAssessment } from "../lib/ai/assessment";

async function test() {
  const res = await runAiAssessment({
    title: "Pothole near kn road",
    category: "Road Damage",
    description: "Large pothole near KN road intersection",
    resolutionNotes: "Smoothened the pothole area",
    citizenPhotoUrl: "/uploads/evidence_1786272308244_xlxdzr.jpg",
    repairPhotoUrl: "/uploads/repair_1786272370559_pquowy.jpg",
  });
  console.log("Result:", JSON.stringify(res, null, 2));
}

test();
