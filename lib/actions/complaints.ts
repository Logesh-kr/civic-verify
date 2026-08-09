"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createComplaintSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";
import { EvidenceType, ComplaintStatus, AiAssessmentStatus } from "@prisma/client";
import { runAiAssessment } from "@/lib/ai/assessment";
import { uploadImage } from "@/lib/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

/**
 * Citizen Action: Create a new evidence-backed complaint.
 */
export async function createComplaintAction(
  formData: FormData
): Promise<ApiResponse<{ complaintId: string }>> {
  // 1. Server-side security check — strictly enforce CITIZEN role & get session user
  const user = await requireRole(["CITIZEN"]);

  // 2. Extract text fields
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const latitudeStr = formData.get("latitude") as string | null;
  const longitudeStr = formData.get("longitude") as string | null;

  const latitude = latitudeStr && latitudeStr.trim() !== "" ? parseFloat(latitudeStr) : undefined;
  const longitude = longitudeStr && longitudeStr.trim() !== "" ? parseFloat(longitudeStr) : undefined;

  // 3. Validate input with Zod
  const validation = createComplaintSchema.safeParse({
    title,
    description,
    category,
    latitude,
    longitude,
  });

  if (!validation.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "Please fix the validation errors below.",
      fieldErrors,
    };
  }

  // 4. Handle Photo File Upload
  const photoFile = formData.get("photo") as File | null;
  let imageUrl: string | null = null;

  if (photoFile && photoFile.size > 0) {
    if (!ALLOWED_MIME_TYPES.includes(photoFile.type)) {
      return {
        success: false,
        error: "Invalid file type. Please upload a JPEG, PNG, or WebP photo.",
        fieldErrors: { photo: ["File must be an image (JPEG, PNG, or WebP)."] },
      };
    }

    if (photoFile.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "File size exceeds the 5 MB limit.",
        fieldErrors: { photo: ["File size must be 5 MB or smaller."] },
      };
    }

    try {
      imageUrl = await uploadImage(photoFile, "evidence");
    } catch (err) {
      console.error("Error saving uploaded image:", err);
      return {
        success: false,
        error: "Failed to process photo upload. Please try again.",
      };
    }
  }

  try {
    // 5. Create Complaint record in database
    const complaint = await prisma.complaint.create({
      data: {
        title: validation.data.title,
        description: validation.data.description,
        category: validation.data.category,
        latitude: validation.data.latitude ?? null,
        longitude: validation.data.longitude ?? null,
        status: ComplaintStatus.SUBMITTED,
        authorId: user.id,
      },
    });

    // 6. Create Evidence record if photo uploaded
    if (imageUrl) {
      await prisma.evidence.create({
        data: {
          imageUrl,
          type: EvidenceType.PHOTO,
          isRepairEvidence: false,
          uploadedById: user.id,
          complaintId: complaint.id,
        },
      });
    }

    // 7. Revalidate relevant dashboard pages
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/complaints");

    return {
      success: true,
      data: { complaintId: complaint.id },
    };
  } catch (error) {
    console.error("Error creating complaint in database:", error);
    return {
      success: false,
      error: "Failed to save complaint to database. Please try again.",
    };
  }
}

/**
 * Authority Action 1: Transition status from SUBMITTED -> IN_PROGRESS ("Start Work").
 */
export async function startWorkAction(
  complaintId: string
): Promise<ApiResponse<{ complaintId: string }>> {
  // 1. Strictly enforce AUTHORITY role server-side
  await requireRole(["AUTHORITY"]);

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return { success: false, error: "Complaint not found." };
    }

    // Server-side status transition check: MUST be SUBMITTED
    if (complaint.status !== ComplaintStatus.SUBMITTED) {
      return {
        success: false,
        error: `Cannot start work. Complaint status is currently ${complaint.status}, but must be SUBMITTED.`,
      };
    }

    // Update status to IN_PROGRESS
    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: ComplaintStatus.IN_PROGRESS,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${complaintId}`);

    return {
      success: true,
      data: { complaintId: updated.id },
    };
  } catch (error) {
    console.error("Error starting work on complaint:", error);
    return {
      success: false,
      error: "Failed to update complaint status. Please try again.",
    };
  }
}

/**
 * Authority Action 2: Upload repair evidence and transition status from IN_PROGRESS -> CLAIMED_RESOLVED.
 */
export async function claimResolutionAction(
  formData: FormData
): Promise<ApiResponse<{ complaintId: string }>> {
  // 1. Strictly enforce AUTHORITY role server-side
  const user = await requireRole(["AUTHORITY"]);

  // 2. Extract fields
  const complaintId = formData.get("complaintId") as string;
  const resolutionNotes = formData.get("resolutionNotes") as string;
  const photoFile = formData.get("repairPhoto") as File | null;

  if (!complaintId) {
    return { success: false, error: "Complaint ID is required." };
  }

  // Validate resolution notes
  if (!resolutionNotes || resolutionNotes.trim().length < 10) {
    return {
      success: false,
      error: "Please provide detailed resolution notes (at least 10 characters).",
      fieldErrors: {
        resolutionNotes: ["Resolution notes must be at least 10 characters long."],
      },
    };
  }

  // Validate repair photo file
  if (!photoFile || photoFile.size === 0) {
    return {
      success: false,
      error: "Repair evidence photo is required when claiming resolution.",
      fieldErrors: {
        repairPhoto: ["Please upload a photo of the completed repair work."],
      },
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(photoFile.type)) {
    return {
      success: false,
      error: "Invalid image format. Please upload a JPEG, PNG, or WebP photo.",
      fieldErrors: {
        repairPhoto: ["File must be an image (JPEG, PNG, or WebP)."],
      },
    };
  }

  if (photoFile.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "File size exceeds the 5 MB limit.",
      fieldErrors: {
        repairPhoto: ["Image size must be 5 MB or smaller."],
      },
    };
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return { success: false, error: "Complaint not found." };
    }

    // Server-side status transition check: MUST be IN_PROGRESS
    if (complaint.status !== ComplaintStatus.IN_PROGRESS) {
      return {
        success: false,
        error: `Cannot claim resolution. Complaint status is currently ${complaint.status}, but must be IN_PROGRESS.`,
      };
    }

    // Upload repair evidence photo to persistent storage
    const imageUrl = await uploadImage(photoFile, "repair");

    // Create Evidence record for Authority Repair Evidence
    await prisma.evidence.create({
      data: {
        imageUrl,
        type: EvidenceType.PHOTO,
        isRepairEvidence: true,
        uploadedById: user.id,
        complaintId: complaint.id,
      },
    });

    // Update Complaint status to CLAIMED_RESOLVED and store resolution notes
    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: ComplaintStatus.CLAIMED_RESOLVED,
        resolutionNotes: resolutionNotes.trim(),
        updatedAt: new Date(),
      },
    });

    // Safely trigger AI Evidence Intelligence (non-blocking failure)
    try {
      console.log(`[AI Action Trigger] Triggering AI assessment for complaint ID: ${complaint.id}`);

      const aiRecord = await prisma.aiAssessment.upsert({
        where: { complaintId: complaint.id },
        create: {
          complaintId: complaint.id,
          status: AiAssessmentStatus.PENDING,
        },
        update: {
          status: AiAssessmentStatus.PENDING,
        },
      });

      const citizenEvidence = await prisma.evidence.findFirst({
        where: { complaintId: complaint.id, isRepairEvidence: false },
        select: { imageUrl: true },
      });

      const aiContext = {
        title: updated.title,
        category: updated.category,
        description: updated.description,
        resolutionNotes: updated.resolutionNotes || "",
        citizenPhotoUrl: citizenEvidence?.imageUrl || null,
        repairPhotoUrl: imageUrl,
      };

      const aiResult = await runAiAssessment(aiContext);

      if (aiResult) {
        console.log(`[AI Action Success] Saving completed AI assessment to DB for complaint ID: ${complaint.id}`);
        await prisma.aiAssessment.update({
          where: { id: aiRecord.id },
          data: {
            status: AiAssessmentStatus.COMPLETED,
            result: aiResult.result,
            confidenceScore: aiResult.confidenceScore,
            explanation: aiResult.explanation,
            modelName: aiResult.modelName || "qwen/qwen3.6-27b",
          },
        });
      } else {
        console.error(`[AI Action Failure] AI assessment returned null for complaint ID: ${complaint.id}. Updating DB status to FAILED.`);
        await prisma.aiAssessment.update({
          where: { id: aiRecord.id },
          data: { status: AiAssessmentStatus.FAILED },
        });
      }
    } catch (aiErr) {
      console.error(`[AI Action Exception] Unexpected exception during AI assessment execution for complaint ID: ${complaint.id}:`, {
        message: aiErr instanceof Error ? aiErr.message : String(aiErr),
        error: aiErr,
      });
      await prisma.aiAssessment
        .update({
          where: { complaintId: complaint.id },
          data: { status: AiAssessmentStatus.FAILED },
        })
        .catch(() => {});
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${complaint.id}`);
    revalidatePath("/dashboard/verification");

    return {
      success: true,
      data: { complaintId: updated.id },
    };
  } catch (error) {
    console.error("Error claiming resolution for complaint:", error);
    return {
      success: false,
      error: "Failed to claim resolution. Please try again.",
    };
  }
}
