"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ComplaintStatus, VerificationResult } from "@prisma/client";
import type { ApiResponse } from "@/types";

import { DISPUTE_REASONS } from "@/lib/constants";
export type { DisputeReason } from "@/lib/constants";

/**
 * Citizen Action: Verify that a CLAIMED_RESOLVED complaint is actually resolved.
 * Transitions: CLAIMED_RESOLVED -> VERIFIED
 */
export async function verifyResolutionAction(
  complaintId: string
): Promise<ApiResponse<{ complaintId: string }>> {
  const user = await requireRole(["CITIZEN"]);

  if (!complaintId || complaintId.trim() === "") {
    return { success: false, error: "Complaint ID is required." };
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { verifications: true },
    });

    if (!complaint) {
      return { success: false, error: "Complaint not found." };
    }

    if (complaint.authorId !== user.id) {
      return { success: false, error: "You are not authorised to verify this complaint." };
    }

    if (complaint.status !== ComplaintStatus.CLAIMED_RESOLVED) {
      return {
        success: false,
        error: `Cannot verify. Complaint is currently ${complaint.status}, but must be CLAIMED_RESOLVED.`,
      };
    }

    if (complaint.verifications.length > 0) {
      return { success: false, error: "This complaint has already been verified or disputed." };
    }

    await prisma.verification.create({
      data: {
        result: VerificationResult.VERIFIED,
        reasoning: "Citizen confirmed the resolution is genuine.",
        citizenId: user.id,
        complaintId: complaint.id,
      },
    });

    await prisma.complaint.update({
      where: { id: complaint.id },
      data: { status: ComplaintStatus.VERIFIED, updatedAt: new Date() },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${complaint.id}`);
    revalidatePath("/dashboard/verification");

    return { success: true, data: { complaintId: complaint.id } };
  } catch (error) {
    console.error("Error verifying resolution:", error);
    return { success: false, error: "Failed to verify resolution. Please try again." };
  }
}

/**
 * Citizen Action: Dispute a CLAIMED_RESOLVED complaint as not resolved.
 * Transitions: CLAIMED_RESOLVED -> DISPUTED
 */
export async function disputeResolutionAction(
  formData: FormData
): Promise<ApiResponse<{ complaintId: string }>> {
  const user = await requireRole(["CITIZEN"]);

  const complaintId = formData.get("complaintId") as string;
  const disputeReason = formData.get("disputeReason") as string;
  const explanation = (formData.get("explanation") as string) ?? "";

  if (!complaintId || complaintId.trim() === "") {
    return { success: false, error: "Complaint ID is required." };
  }

  if (!disputeReason || disputeReason.trim() === "") {
    return {
      success: false,
      error: "Please select a dispute reason.",
      fieldErrors: { disputeReason: ["A dispute reason is required."] },
    };
  }

  if (!(DISPUTE_REASONS as readonly string[]).includes(disputeReason)) {
    return {
      success: false,
      error: "Invalid dispute reason provided.",
      fieldErrors: { disputeReason: ["Please select a valid reason."] },
    };
  }

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { verifications: true },
    });

    if (!complaint) {
      return { success: false, error: "Complaint not found." };
    }

    if (complaint.authorId !== user.id) {
      return { success: false, error: "You are not authorised to dispute this complaint." };
    }

    if (complaint.status !== ComplaintStatus.CLAIMED_RESOLVED) {
      return {
        success: false,
        error: `Cannot dispute. Complaint is currently ${complaint.status}, but must be CLAIMED_RESOLVED.`,
      };
    }

    if (complaint.verifications.length > 0) {
      return { success: false, error: "This complaint has already been verified or disputed." };
    }

    const trimmedExplanation = explanation.trim();
    const reasoning = trimmedExplanation
      ? `${disputeReason.trim()}: ${trimmedExplanation}`
      : disputeReason.trim();

    await prisma.verification.create({
      data: {
        result: VerificationResult.DISPUTED,
        reasoning,
        citizenId: user.id,
        complaintId: complaint.id,
      },
    });

    await prisma.complaint.update({
      where: { id: complaint.id },
      data: { status: ComplaintStatus.DISPUTED, updatedAt: new Date() },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${complaint.id}`);
    revalidatePath("/dashboard/verification");

    return { success: true, data: { complaintId: complaint.id } };
  } catch (error) {
    console.error("Error disputing resolution:", error);
    return { success: false, error: "Failed to dispute resolution. Please try again." };
  }
}
