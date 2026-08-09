import "dotenv/config";
import Groq from "groq-sdk";
import sharp from "sharp";
import path from "node:path";

async function testGroqVision() {
  const apiKey = process.env.GROQ_API_KEY;
  console.log("Testing Groq vision with qwen/qwen3.6-27b...");

  const img1Path = path.join(process.cwd(), "public/uploads/evidence_1786271315656_eon3u0.jpg");
  const img2Path = path.join(process.cwd(), "public/uploads/repair_1786271355413_haieqt.jpg");

  const b1 = await sharp(img1Path).resize(256, 256, { fit: "inside" }).jpeg({ quality: 60 }).toBuffer();
  const b2 = await sharp(img2Path).resize(256, 256, { fit: "inside" }).jpeg({ quality: 60 }).toBuffer();

  const dataUrl1 = `data:image/jpeg;base64,${b1.toString("base64")}`;
  const dataUrl2 = `data:image/jpeg;base64,${b2.toString("base64")}`;

  const groq = new Groq({ apiKey });

  try {
    const res = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      messages: [
        {
          role: "system",
          content: "You are an AI civic evidence evaluator. Output JSON with result (LIKELY_RESOLVED, NEEDS_REVIEW, LIKELY_NOT_RESOLVED), confidenceScore (0-1), explanation."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Image 1 (before):" },
            { type: "image_url", image_url: { url: dataUrl1, detail: "low" as const } },
            { type: "text", text: "Image 2 (after):" },
            { type: "image_url", image_url: { url: dataUrl2, detail: "low" as const } },
            { type: "text", text: "Category: Pothole. Title: Deep pothole near LH nagar. Has this issue been resolved? Return JSON." }
          ]
        }
      ],
      max_tokens: 1024,
      temperature: 0.1
    });

    console.log("Success! Response:");
    console.log(res.choices[0]?.message?.content);
    console.log("Usage:", res.usage);
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
  }
}

testGroqVision();
