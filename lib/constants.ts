// Application-wide constants for CivicVerify

export const APP_NAME = "CivicVerify";
export const APP_DESCRIPTION =
  "An evidence-based civic complaint accountability platform";

// ─── Complaint status display ─────────────────────────────────────────────────

export const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_PROGRESS: "In Progress",
  CLAIMED_RESOLVED: "Claimed Resolved",
  VERIFIED: "Verified",
  DISPUTED: "Disputed",
  ESCALATED: "Escalated",
};

export const COMPLAINT_STATUS_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  SUBMITTED: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  IN_PROGRESS: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  CLAIMED_RESOLVED: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  VERIFIED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  DISPUTED: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  ESCALATED: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
};

// ─── User role display ────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Citizen",
  AUTHORITY: "Authority",
  PUBLIC: "Public",
};

// ─── Routes ───────────────────────────────────────────────────────────────────

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  complaints: "/dashboard/complaints",
  complaintDetail: (id: string) => `/dashboard/complaints/${id}`,
  report: "/dashboard/report",
  verification: "/dashboard/verification",
  accountability: "/dashboard/accountability",
} as const;

// ─── Verification constants ───────────────────────────────────────────────────

export const DISPUTE_REASONS = [
  "Issue is still present",
  "Repair is incomplete",
  "Wrong location",
  "Evidence does not show the actual repair",
  "Other",
] as const;

export type DisputeReason = (typeof DISPUTE_REASONS)[number];
