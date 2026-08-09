// Shared TypeScript types for CivicVerify
// These mirror Prisma model shapes but are decoupled from Prisma Client
// so UI components don't depend directly on the ORM.

// ─── Enums (mirror Prisma schema) ─────────────────────────────────────────────

export type Role = "CITIZEN" | "AUTHORITY" | "PUBLIC";

export type ComplaintStatus =
  | "SUBMITTED"
  | "IN_PROGRESS"
  | "CLAIMED_RESOLVED"
  | "VERIFIED"
  | "DISPUTED"
  | "ESCALATED";

export type EvidenceType = "PHOTO" | "VIDEO" | "DOCUMENT";

export type VerificationResult = "VERIFIED" | "DISPUTED" | "INCONCLUSIVE";

export type AiAssessmentResult =
  | "LIKELY_RESOLVED"
  | "NEEDS_REVIEW"
  | "LIKELY_NOT_RESOLVED";

export type AiAssessmentStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface AiAssessmentData {
  id: string;
  result: AiAssessmentResult | null;
  confidenceScore: number | null;
  explanation: string | null;
  modelName: string;
  status: AiAssessmentStatus;
  createdAt: Date | string;
}

// ─── Data shapes ──────────────────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface EvidenceItem {
  id: string;
  imageUrl: string;
  type: EvidenceType;
  isRepairEvidence: boolean;
  uploadedById: string;
  complaintId: string;
  createdAt: Date;
}

export interface VerificationRecord {
  id: string;
  complaintId: string;
  citizenId: string;
  similarityScore: number | null;
  confidenceScore: number | null;
  result: VerificationResult | null;
  reasoning: string | null;
  createdAt: Date;
}

export interface ComplaintSummary {
  id: string;
  title: string;
  category: string;
  status: ComplaintStatus;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

export interface ComplaintDetail extends ComplaintSummary {
  description: string;
  author: UserSummary;
  evidence: EvidenceItem[];
  verifications: VerificationRecord[];
}

// ─── API response wrapper ─────────────────────────────────────────────────────

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string; fieldErrors?: Record<string, string[]> };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
