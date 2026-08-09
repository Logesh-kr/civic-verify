"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, AlertTriangle, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { verifyResolutionAction, disputeResolutionAction } from "@/lib/actions/verification";

const DISPUTE_REASONS = [
  "Issue is still present",
  "Repair is incomplete",
  "Wrong location",
  "Evidence does not show the actual repair",
  "Other",
] as const;

interface CitizenVerificationPanelProps {
  complaintId: string;
}

type Stage = "idle" | "confirm-verify" | "dispute-form";

export function CitizenVerificationPanel({ complaintId }: CitizenVerificationPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<Stage>("idle");
  const [disputeReason, setDisputeReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleVerify = () => {
    setGlobalError(null);
    startTransition(async () => {
      const res = await verifyResolutionAction(complaintId);
      if (res.success) {
        setSuccess("Resolution verified. Status updated to VERIFIED.");
      } else {
        setGlobalError(res.error);
        setStage("idle");
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
    formData.append("complaintId", complaintId);
    formData.append("disputeReason", disputeReason);
    formData.append("explanation", explanation);

    startTransition(async () => {
      const res = await disputeResolutionAction(formData);
      if (res.success) {
        setSuccess("Dispute submitted. Status updated to DISPUTED.");
      } else {
        setGlobalError(res.error);
        if ("fieldErrors" in res && res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  if (success) {
    return (
      <Card className="mb-6 border-emerald-200 bg-emerald-50/40">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">{success}</p>
        </div>
        <p className="mt-1 text-xs text-emerald-700">Refresh the page to see the updated status.</p>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/40">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-amber-900">Verification Required</h2>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            The authority has claimed this issue is resolved. Review the repair evidence and
            confirm whether it has been actually resolved. Your decision is final.
          </p>
        </div>
      </div>

      {globalError && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          {globalError}
        </div>
      )}

      {stage === "idle" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600 text-white"
            onClick={() => setStage("confirm-verify")}
          >
            <CheckCircle2 className="h-4 w-4" />
            Verify Resolution
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={() => setStage("dispute-form")}>
            <XCircle className="h-4 w-4" />
            Dispute Resolution
          </Button>
        </div>
      )}

      {stage === "confirm-verify" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-emerald-800">Are you sure this issue has actually been resolved?</p>
            <p className="text-xs text-emerald-700 mt-0.5">This confirms the repair is complete. This action is final.</p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setStage("idle")} disabled={isPending}>Cancel</Button>
            <Button type="button" size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600 text-white" onClick={handleVerify} isLoading={isPending}>
              <CheckCircle2 className="h-4 w-4" />
              Confirm Resolution
            </Button>
          </div>
        </div>
      )}

      {stage === "dispute-form" && (
        <form onSubmit={handleDisputeSubmit} className="space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs font-semibold text-red-800">Select a dispute reason</p>
          </div>
          <div>
            <div className="space-y-1.5">
              {DISPUTE_REASONS.map((reason) => (
                <label key={reason} className={["flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors", disputeReason === reason ? "border-red-400 bg-red-50 text-red-900" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"].join(" ")}>
                  <input type="radio" name={`dr-${complaintId}`} value={reason} checked={disputeReason === reason} onChange={() => setDisputeReason(reason)} className="accent-red-600" />
                  <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                  {reason}
                </label>
              ))}
            </div>
            {fieldErrors.disputeReason && <p className="mt-1 text-xs text-red-600">{fieldErrors.disputeReason[0]}</p>}
          </div>
          <div>
            <label htmlFor={`exp-${complaintId}`} className="block text-xs font-medium text-gray-700 mb-1">Additional Details <span className="text-gray-400">(optional)</span></label>
            <textarea id={`exp-${complaintId}`} rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Describe what you observed..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-red-400 focus:border-red-400" />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setStage("idle"); setDisputeReason(""); setExplanation(""); setFieldErrors({}); }} disabled={isPending}>Cancel</Button>
            <Button type="submit" variant="danger" size="sm" className="flex-1" isLoading={isPending}>
              <XCircle className="h-4 w-4" />
              Submit Dispute
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
