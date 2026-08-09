import path from "node:path";
import fs from "node:fs/promises";
import Groq from "groq-sdk";
import type { AiAssessmentResult } from "@prisma/client";

const GROQ_MODEL = "qwen/qwen3.6-27b";

export interface AiAssessmentOutput {
  result: AiAssessmentResult;
  confidenceScore: number;
  explanation: string;
  modelName: string;
}

export interface ComplaintAiContext {
  title: string;
  category: string;
  description: string;
  resolutionNotes: string;
  citizenPhotoUrl: string | null;
  repairPhotoUrl: string | null;
}


function getSafeUploadPath(relativeUrl: string): string | null {
  if (!relativeUrl || !relativeUrl.startsWith("/uploads/")) {
    return null;
  }
  const filename = path.basename(relativeUrl);
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const fullPath = path.join(uploadsDir, filename);
  // Path traversal guard
  if (!fullPath.startsWith(uploadsDir)) {
    return null;
  }
  return fullPath;
}

// Maximum dimension (width or height) to resize images before sending to Groq.
// 256px + detail: low ensures prompt stays well under 8000 token limit.
const MAX_IMAGE_DIMENSION = 256;

/**
 * Reads a local upload file, resizes it to fit within MAX_IMAGE_DIMENSION,
 * and encodes it as a base64 JPEG data URL suitable for Groq's vision input.
 */
async function readImageAsDataUrl(
  url: string | null
): Promise<string | null> {
  if (!url) return null;

  try {
    const sharp = (await import("sharp")).default;
    let imageBuffer: Buffer;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      console.log(`[AI Assessment] Fetching remote image for Groq: ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[AI Assessment Error] Failed to fetch remote image: ${url} (HTTP ${res.status})`);
        return null;
      }
      const arrayBuf = await res.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuf);
    } else {
      const safePath = getSafeUploadPath(url);
      if (!safePath) {
        console.error(`[AI Assessment Error] Invalid or unsafe upload path: ${url}`);
        return null;
      }
      imageBuffer = await fs.readFile(safePath);
    }

    const resizedBuffer = await sharp(imageBuffer)
      .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 60 })
      .toBuffer();

    const base64 = resizedBuffer.toString("base64");
    console.log(
      `[AI Assessment] Image resized for Groq: ${url} → ${resizedBuffer.length} bytes (base64: ${base64.length} chars)`
    );
    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    console.error(`[AI Assessment Error] Failed to read/resize image at ${url}:`, err);
    return null;
  }
}


const VALID_RESULTS: AiAssessmentResult[] = [
  "LIKELY_RESOLVED",
  "NEEDS_REVIEW",
  "LIKELY_NOT_RESOLVED",
];

/**
 * Extracts and validates JSON from model response text.
 * Handles cases where the model wraps JSON in markdown code fences.
 */
function extractJsonFromResponse(text: string): unknown {
  // Strip Qwen-style <think>...</think> chain-of-thought blocks first
  const stripped = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const candidate = stripped || text.trim();

  // Try raw parse first
  try {
    return JSON.parse(candidate);
  } catch {
    // Try extracting from ```json ... ``` fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch?.[1]) {
      return JSON.parse(fenceMatch[1].trim());
    }
    // Try finding a raw { ... } block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      return JSON.parse(braceMatch[0]);
    }
    throw new Error("No valid JSON found in response");
  }
}

export async function runAiAssessment(
  context: ComplaintAiContext
): Promise<AiAssessmentOutput | null> {
  console.log(
    `[AI Assessment] Starting visual evidence evaluation for "${context.title}"...`
  );

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.startsWith("your-")) {
    console.error(
      "[AI Assessment Error] GROQ_API_KEY is missing, empty, or placeholder in environment variables."
    );
    return null;
  }

  try {
    const groq = new Groq({ apiKey });

    // Read both images as base64 data URLs for Groq inline vision input
    const citizenDataUrl = await readImageAsDataUrl(context.citizenPhotoUrl);
    const repairDataUrl = await readImageAsDataUrl(context.repairPhotoUrl);

    // Require at least one actual image — without visual evidence the analysis is meaningless
    if (!citizenDataUrl && !repairDataUrl) {
      console.error(
        "[AI Assessment Error] No images could be loaded — skipping Groq call (no visual evidence available)."
      );
      return null;
    }

    const systemPrompt = `You are an evidence-analysis assistant for a civic accountability platform.
Your role is strictly advisory. You must NEVER claim that a repair is definitively complete or fabricate evidence.
Do NOT output any <think> tags or internal chain-of-thought reasoning. Immediately and strictly return structured JSON.`;

    const userPromptParts: Groq.Chat.ChatCompletionContentPart[] = [];

    if (citizenDataUrl) {
      userPromptParts.push({
        type: "text",
        text: "IMAGE 1: ORIGINAL CITIZEN REPORT EVIDENCE (the problem before repair):",
      });
      userPromptParts.push({
        type: "image_url",
        image_url: { url: citizenDataUrl, detail: "low" as const },
      });
    } else {
      userPromptParts.push({
        type: "text",
        text: "IMAGE 1: ORIGINAL CITIZEN REPORT EVIDENCE — not available.",
      });
    }

    if (repairDataUrl) {
      userPromptParts.push({
        type: "text",
        text: "IMAGE 2: AUTHORITY REPAIR EVIDENCE (the claimed fix):",
      });
      userPromptParts.push({
        type: "image_url",
        image_url: { url: repairDataUrl, detail: "low" as const },
      });
    } else {
      userPromptParts.push({
        type: "text",
        text: "IMAGE 2: AUTHORITY REPAIR EVIDENCE — not available.",
      });
    }

    userPromptParts.push({
      type: "text",
      text: `Compare the two images above and determine whether the visual evidence supports the authority's claim that the civic issue has been resolved.

Complaint Metadata:
- Category: ${context.category}
- Title: ${context.title}
- Description: ${context.description}
- Authority Resolution Notes: ${context.resolutionNotes}

Evaluation criteria:
- Look for visible improvement between the original and repair image
- Look for remaining damage, incomplete repair, or mismatched locations
- Note if visual evidence is insufficient to make a confident determination

Be concise in your reasoning. Return ONLY a JSON object with this exact structure:
{
  "result": "LIKELY_RESOLVED" | "NEEDS_REVIEW" | "LIKELY_NOT_RESOLVED",
  "confidenceScore": <float between 0.0 and 1.0>,
  "explanation": "<2-4 sentences describing what you observed in the images>"
}

Your assessment is purely advisory. The citizen makes the final decision.`,
    });

    console.log(
      `[AI Assessment] Sending request to Groq (model: ${GROQ_MODEL})...`
    );

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPromptParts },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      console.error(
        "[AI Assessment Error] Groq returned empty response content."
      );
      return null;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJsonFromResponse(responseText) as Record<string, unknown>;
    } catch (parseErr) {
      console.error(
        "[AI Assessment Error] Failed to parse JSON from Groq response:",
        { responseText, parseErr }
      );
      return null;
    }

    const result = parsed.result as string;
    if (!VALID_RESULTS.includes(result as AiAssessmentResult)) {
      console.error(
        `[AI Assessment Error] Invalid result value from Groq: "${result}". Expected one of: ${VALID_RESULTS.join(", ")}`
      );
      return null;
    }

    let confidence =
      typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 0.5;
    if (confidence < 0) confidence = 0;
    if (confidence > 1) confidence = 1;

    const explanation =
      typeof parsed.explanation === "string" && parsed.explanation.trim()
        ? parsed.explanation.trim()
        : "No detailed explanation provided.";

    console.log(
      `[AI Assessment Success] Evaluation completed. Result: ${result}, Confidence: ${confidence}, Model: ${GROQ_MODEL}`
    );

    return {
      result: result as AiAssessmentResult,
      confidenceScore: Math.round(confidence * 100) / 100,
      explanation,
      modelName: GROQ_MODEL,
    };
  } catch (error) {
    console.error("[AI Assessment Error] Groq API call threw an exception:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}
