import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Tag,
  Camera,
  CheckCircle2,
  Clock,
  Wrench,
  ScanSearch,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  XCircle,
  History,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import { AuthorityActions } from "./AuthorityActions";
import { CitizenVerificationPanel } from "./CitizenVerificationPanel";
import { AiAdvisoryCard } from "@/components/verification/AiAdvisoryCard";
import type { ComplaintStatus } from "@/types";

export const metadata: Metadata = {
  title: "Complaint Detail",
};

const STAGES: Array<{
  status: ComplaintStatus;
  label: string;
  icon: React.ElementType;
}> = [
  { status: "SUBMITTED", label: "Reported", icon: Clock },
  { status: "IN_PROGRESS", label: "In Progress", icon: Wrench },
  { status: "CLAIMED_RESOLVED", label: "Claimed Fixed", icon: CheckCircle2 },
  { status: "VERIFIED", label: "Verified", icon: ScanSearch },
];


export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  // 1. Fetch real complaint from SQLite database with related author & evidence records
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      evidence: {
        include: {
          uploadedBy: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      verifications: {
        include: {
          citizen: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      aiAssessment: true,
    },
  });

  // 2. If complaint does not exist, return 404
  if (!complaint) {
    notFound();
  }

  // 3. Security Authorization Guard:
  // A CITIZEN user may ONLY access their own complaints.
  // An AUTHORITY user can view any complaint.
  if (user.role === "CITIZEN" && complaint.authorId !== user.id) {
    notFound();
  }

  const citizenEvidence = complaint.evidence.filter((e) => !e.isRepairEvidence);
  const repairEvidence = complaint.evidence.filter((e) => e.isRepairEvidence);

  const currentStatusIndex = STAGES.findIndex(
    (s) => s.status === complaint.status
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href={ROUTES.complaints}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Complaints
      </Link>

      {/* Header & Status */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <StatusBadge status={complaint.status as ComplaintStatus} />
          <span className="text-xs font-mono text-gray-400">ID: {complaint.id}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{complaint.title}</h1>
      </div>

      {/* Status banners for CLAIMED_RESOLVED, VERIFIED, DISPUTED */}
      {complaint.status === "CLAIMED_RESOLVED" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-amber-900">
                Authority Claimed Resolution — Independent Verification Required
              </h2>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                The authority has submitted repair evidence.{" "}
                <span className="font-semibold">Note:</span> This complaint is{" "}
                <span className="font-semibold">NOT yet VERIFIED</span>. A citizen must
                independently confirm or dispute before it is considered resolved.
              </p>
            </div>
          </div>
        </div>
      )}

      {complaint.status === "VERIFIED" && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-emerald-900">
                Resolution Verified
              </h2>
              <p className="mt-1 text-xs text-emerald-800">
                The citizen has independently confirmed this issue is resolved.
              </p>
            </div>
          </div>
        </div>
      )}

      {complaint.status === "DISPUTED" && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-red-900">
                Resolution Disputed
              </h2>
              <p className="mt-1 text-xs text-red-800">
                The citizen has disputed the authority&apos;s resolution claim. The issue may not
                be resolved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline Progress Bar */}
      <Card className="mb-6 bg-slate-50/50">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-civic-blue" />
          Verification Lifecycle
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center relative">
          {STAGES.map((stage, idx) => {
            const isCompleted = currentStatusIndex >= idx;
            const isCurrent = currentStatusIndex === idx;

            return (
              <div key={stage.status} className="flex flex-col items-center">
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all mb-1.5",
                    isCurrent
                      ? "border-civic-blue bg-civic-blue text-white ring-4 ring-civic-blue/20"
                      : isCompleted
                      ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                      : "border-gray-200 bg-white text-gray-400",
                  ].join(" ")}
                >
                  <stage.icon className="h-4 w-4" />
                </div>
                <span
                  className={[
                    "text-xs font-medium",
                    isCurrent
                      ? "text-civic-blue font-bold"
                      : isCompleted
                      ? "text-gray-900"
                      : "text-gray-400",
                  ].join(" ")}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Authority Control Panel (Rendered only for AUTHORITY role) */}
      {user.role === "AUTHORITY" && (
        <AuthorityActions
          complaintId={complaint.id}
          currentStatus={complaint.status as ComplaintStatus}
        />
      )}

      {/* AI Evidence Advisory — rendered when AI assessment exists */}
      {complaint.aiAssessment && (
        <AiAdvisoryCard aiAssessment={complaint.aiAssessment} className="mb-6" />
      )}

      {/* Citizen Verification Panel — shown to the complaint author when CLAIMED_RESOLVED */}
      {user.role === "CITIZEN" &&
        complaint.authorId === user.id &&
        complaint.status === "CLAIMED_RESOLVED" && (
          <CitizenVerificationPanel complaintId={complaint.id} />
        )}

      {/* Official Resolution Notes (If available) */}
      {complaint.resolutionNotes && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/30">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-800 flex items-center gap-1.5">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            Official Authority Resolution Notes
          </h2>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {complaint.resolutionNotes}
          </p>
        </Card>
      )}

      {/* Verification History */}
      {complaint.verifications.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
            <History className="h-4 w-4 text-civic-blue" />
            Verification History
          </h2>
          <div className="space-y-2">
            {complaint.verifications.map((v) => {
              const isVerified = v.result === "VERIFIED";
              return (
                <div
                  key={v.id}
                  className={[
                    "rounded-lg border px-3 py-2.5 flex items-start gap-3",
                    isVerified
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-red-200 bg-red-50/40",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      isVerified ? "bg-emerald-100" : "bg-red-100",
                    ].join(" ")}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={[
                        "text-sm font-semibold",
                        isVerified ? "text-emerald-800" : "text-red-800",
                      ].join(" ")}
                    >
                      {isVerified ? "Verified" : "Disputed"}
                    </p>
                    {v.reasoning && (
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        {v.reasoning}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      By {v.citizen.name} &middot;{" "}
                      {new Date(v.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Description */}
      <Card className="mb-6">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
          Description
        </h2>
        <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
          {complaint.description}
        </p>
      </Card>

      {/* Photo Evidence Section (Citizen Original vs Authority Repair) */}
      <Card className="mb-6">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
          <Camera className="h-4 w-4 text-civic-blue" />
          Photo Evidence
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Citizen Original Evidence */}
          <div>
            <span className="block text-xs font-semibold text-gray-700 mb-2">
              📸 Citizen Report Photo
            </span>
            {citizenEvidence.length > 0 ? (
              <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={citizenEvidence[0].imageUrl}
                  alt={`Citizen evidence photo for complaint ${complaint.id}`}
                  className="max-h-64 w-full object-cover bg-black/5"
                />
                <div className="p-2.5 bg-white text-[11px] text-gray-500 flex items-center justify-between border-t">
                  <span>Reported by {complaint.author.name}</span>
                  <span>
                    {new Date(citizenEvidence[0].createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-400">
                No initial photo evidence attached.
              </div>
            )}
          </div>

          {/* Authority Repair Evidence */}
          <div>
            <span className="block text-xs font-semibold text-gray-700 mb-2">
              🛠️ Authority Repair Proof Photo
            </span>
            {repairEvidence.length > 0 ? (
              <div className="rounded-xl border border-emerald-200 overflow-hidden bg-emerald-50/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={repairEvidence[0].imageUrl}
                  alt={`Authority repair evidence photo for complaint ${complaint.id}`}
                  className="max-h-64 w-full object-cover bg-black/5"
                />
                <div className="p-2.5 bg-white text-[11px] text-emerald-700 flex items-center justify-between border-t border-emerald-100">
                  <span className="font-semibold">Official Repair Proof</span>
                  <span>
                    {new Date(repairEvidence[0].createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-400">
                {complaint.status === "SUBMITTED"
                  ? "Awaiting authority work."
                  : complaint.status === "IN_PROGRESS"
                  ? "Work in progress — repair proof pending."
                  : "No repair evidence uploaded."}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Tag className="h-3.5 w-3.5" />
            Category
          </div>
          <p className="text-sm font-medium text-gray-800">
            {complaint.category}
          </p>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Calendar className="h-3.5 w-3.5" />
            Reported Date
          </div>
          <p className="text-sm font-medium text-gray-800">
            {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <User className="h-3.5 w-3.5" />
            Reported By
          </div>
          <p className="text-sm font-medium text-gray-800">
            {complaint.author.name}
          </p>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <MapPin className="h-3.5 w-3.5" />
            Location Coordinates
          </div>
          <p className="text-sm font-medium font-mono text-gray-800">
            {complaint.latitude != null && complaint.longitude != null
              ? `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`
              : "Not provided"}
          </p>
        </Card>
      </div>
    </div>
  );
}
