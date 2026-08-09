"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  Camera,
  MapPin,
  Calendar,
  Tag,
  AlertTriangle,
  FileCheck,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { AiAdvisoryCard } from "@/components/verification/AiAdvisoryCard";
import { verifyResolutionAction, disputeResolutionAction } from "@/lib/actions/verification";
import type { ComplaintStatus, AiAssessmentData } from "@/types";

const DISPUTE_REASONS = [
  "Issue is still present",
  "Repair is incomplete",
  "Wrong location",
  "Evidence does not show the actual repair",
  "Other",
] as const;

interface Evidence {
  id: string;
  imageUrl: string;
  isRepairEvidence: boolean;
  createdAt: string;
}

interface VerificationCardProps {
  complaint: {
    id: string;
    title: string;
    category: string;
    description: string;
    latitude: number | null;
    longitude: number | null;
    status: ComplaintStatus;
    resolutionNotes: string | null;
    createdAt: string;
    updatedAt: string;
    author: { name: string };
    evidence: Evidence[];
    aiAssessment?: AiAssessmentData | null;
  };
}

type Stage = "idle" | "confirm-verify" | "dispute-form" | "success" | "error";

export function VerificationCard({ complaint }: VerificationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<Stage>("idle");
  const [disputeReason, setDisputeReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const citizenEvidence = complaint.evidence.filter((e) => !e.isRepairEvidence);
  const repairEvidence = complaint.evidence.filter((e) => e.isRepairEvidence);

  const handleVerify = () => {
    setGlobalError(null);
    startTransition(async () => {
      const res = await verifyResolutionAction(complaint.id);
      if (res.success) {
        setStage("success");
        setSuccessMessage("Resolution verified. Thank you for confirming!");
      } else {
        setStage("error");
        setGlobalError(res.error);
      }
    });
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    if (!disputeReason) {
      setFieldErrors({ disputeReason: ["Please select a reason."] });
      return;
    }

    const formData = new FormData();
    formData.append("complaintId", complaint.id);
    formData.append("disputeReason", disputeReason);
    formData.append("explanation", explanation);

    startTransition(async () => {
      const res = await disputeResolutionAction(formData);
      if (res.success) {
        setStage("success");
        setSuccessMessage("Dispute submitted. Your report will be reviewed.");
      } else {
        setGlobalError(res.error);
        if ("fieldErrors" in res && res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  if (stage === "success") {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800">{successMessage}</p>
            <p className="text-sm text-emerald-700 mt-0.5">{complaint.title}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={complaint.status} />
            <span className="text-xs font-mono text-gray-400">#{complaint.id.slice(-8)}</span>
          </div>
          <h2 className="text-base font-bold text-gray-900 leading-snug">{complaint.title}</h2>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Tag className="h-3 w-3" />
            {complaint.category}
          </div>
        </div>
      </div>

      {/* Trust UX Notice */}
      <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Your decision matters.</span>{" "}
            The authority has claimed this issue is resolved. Your verification determines whether
            the issue is{" "}
            <span className="font-semibold">actually resolved</span> — do not confirm unless you are satisfied.
          </p>
        </div>
      </div>

      {/* Before / After Evidence Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* --- BEFORE: Original Report --- */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden">
          <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
            <Camera className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              📸 Original Report
            </span>
          </div>
          {citizenEvidence.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={citizenEvidence[0].imageUrl}
              alt="Original citizen report photo"
              className="w-full object-cover max-h-44 bg-black/5"
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-xs text-gray-400">
              No photo attached
            </div>
          )}
          <div className="px-3 py-2.5 space-y-1.5">
            <p className="text-xs font-semibold text-gray-700">{complaint.title}</p>
            <p className="text-xs text-gray-500 line-clamp-2">{complaint.description}</p>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Calendar className="h-3 w-3" />
              {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {complaint.latitude != null && (
                <>
                  <span className="mx-1">·</span>
                  <MapPin className="h-3 w-3" />
                  <span className="font-mono">
                    {complaint.latitude.toFixed(3)}, {complaint.longitude?.toFixed(3)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* --- AFTER: Authority Repair Claim --- */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 overflow-hidden">
          <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
            <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              🛠️ Authority Repair Claim
            </span>
          </div>
          {repairEvidence.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={repairEvidence[0].imageUrl}
              alt="Authority repair evidence photo"
              className="w-full object-cover max-h-44 bg-black/5"
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-xs text-gray-400">
              No repair photo uploaded
            </div>
          )}
          <div className="px-3 py-2.5 space-y-1.5">
            {complaint.resolutionNotes ? (
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                {complaint.resolutionNotes}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">No resolution notes provided.</p>
            )}
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Not yet independently verified
            </div>
          </div>
        </div>
      </div>

      {/* 🤖 AI Evidence Advisory */}
      <AiAdvisoryCard aiAssessment={complaint.aiAssessment} className="mb-5" />

      {/* Error display */}
      {globalError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          {globalError}
        </div>
      )}

      {/* ── Action Panel ── */}
      {stage === "idle" && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600"
            onClick={() => setStage("confirm-verify")}
          >
            <CheckCircle2 className="h-4 w-4" />
            Verify Resolution
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            onClick={() => setStage("dispute-form")}
          >
            <XCircle className="h-4 w-4" />
            Dispute Resolution
          </Button>
        </div>
      )}

      {/* ── Confirm Verify ── */}
      {stage === "confirm-verify" && (
        <div className="pt-3 border-t border-gray-100">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-3">
            <p className="text-sm font-semibold text-emerald-900 mb-1">
              Confirm Resolution Verified
            </p>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Are you sure this civic issue has actually been resolved? This action is final and
              cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setStage("idle")}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600"
              onClick={handleVerify}
              isLoading={isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Resolution
            </Button>
          </div>
        </div>
      )}

      {/* ── Dispute Form ── */}
      {stage === "dispute-form" && (
        <form onSubmit={handleDisputeSubmit} className="pt-3 border-t border-gray-100 space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-red-800 mb-0.5">Submit a Dispute</p>
            <p className="text-xs text-red-700">
              Select the reason this resolution claim is incorrect.
            </p>
          </div>

          {/* Reason selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Dispute Reason <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {DISPUTE_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={[
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors",
                    disputeReason === reason
                      ? "border-red-400 bg-red-50 text-red-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="disputeReason"
                    value={reason}
                    checked={disputeReason === reason}
                    onChange={() => setDisputeReason(reason)}
                    className="accent-red-600"
                  />
                  <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                  {reason}
                </label>
              ))}
            </div>
            {fieldErrors.disputeReason && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.disputeReason[0]}</p>
            )}
          </div>

          {/* Optional explanation */}
          <div>
            <label htmlFor={`explanation-${complaint.id}`} className="block text-xs font-medium text-gray-700 mb-1">
              Additional Details <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id={`explanation-${complaint.id}`}
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Describe what you observed..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-red-400 focus:border-red-400"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setStage("idle");
                setDisputeReason("");
                setExplanation("");
                setFieldErrors({});
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              className="flex-1"
              isLoading={isPending}
            >
              <XCircle className="h-4 w-4" />
              Submit Dispute
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
