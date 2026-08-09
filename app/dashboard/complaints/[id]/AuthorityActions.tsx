"use client";

import { useState, useRef, useTransition } from "react";
import { Wrench, CheckCircle2, Camera, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { startWorkAction, claimResolutionAction } from "@/lib/actions/complaints";
import type { ComplaintStatus } from "@/types";

interface AuthorityActionsProps {
  complaintId: string;
  currentStatus: ComplaintStatus;
}

export function AuthorityActions({
  complaintId,
  currentStatus,
}: AuthorityActionsProps) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showClaimForm, setShowClaimForm] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [repairFile, setRepairFile] = useState<File | null>(null);
  const [repairPreview, setRepairPreview] = useState<string | null>(null);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // 1. Handle "Start Work" (SUBMITTED -> IN_PROGRESS)
  const handleStartWork = () => {
    setGlobalError(null);
    startTransition(async () => {
      const res = await startWorkAction(complaintId);
      if (!res.success) {
        setGlobalError(res.error);
      }
    });
  };

  // 2. Handle File selection for Repair Evidence
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({
        ...prev,
        repairPhoto: ["Please select an image file (JPEG, PNG, WebP)."],
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        repairPhoto: ["File size must be 5 MB or smaller."],
      }));
      return;
    }

    setRepairFile(file);
    setFieldErrors((prev) => ({ ...prev, repairPhoto: [] }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setRepairPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeRepairFile = () => {
    setRepairFile(null);
    setRepairPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 3. Handle "Claim Resolution" submit (IN_PROGRESS -> CLAIMED_RESOLVED)
  const handleClaimResolutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    if (!repairFile) {
      setFieldErrors({
        repairPhoto: ["Repair evidence photo is required."],
      });
      return;
    }

    const formData = new FormData();
    formData.append("complaintId", complaintId);
    formData.append("resolutionNotes", resolutionNotes);
    formData.append("repairPhoto", repairFile);

    startTransition(async () => {
      const res = await claimResolutionAction(formData);
      if (!res.success) {
        setGlobalError(res.error);
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      } else {
        setShowClaimForm(false);
      }
    });
  };

  if (currentStatus !== "SUBMITTED" && currentStatus !== "IN_PROGRESS") {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Wrench className="h-4 w-4 text-civic-blue" />
          Official Authority Actions
        </CardTitle>
      </CardHeader>

      {globalError && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <div>{globalError}</div>
        </div>
      )}

      {/* Case 1: Status is SUBMITTED -> Show "Start Work" Button */}
      {currentStatus === "SUBMITTED" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              Acknowledge & Start Work
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Change complaint status to <span className="font-semibold">IN_PROGRESS</span> to indicate authority response.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleStartWork}
            isLoading={isPending}
            className="shrink-0"
          >
            <Wrench className="h-4 w-4" />
            Start Work
          </Button>
        </div>
      )}

      {/* Case 2: Status is IN_PROGRESS -> Show "Claim Resolution" Button / Form */}
      {currentStatus === "IN_PROGRESS" && (
        <div>
          {!showClaimForm ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Claim Issue Resolution
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Upload repair evidence photo and notes to mark as <span className="font-semibold">CLAIMED_RESOLVED</span>.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowClaimForm(true)}
                className="shrink-0"
              >
                <CheckCircle2 className="h-4 w-4" />
                Claim Resolution
              </Button>
            </div>
          ) : (
            <form onSubmit={handleClaimResolutionSubmit} className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Resolution Claim Form
                </h3>
                <button
                  type="button"
                  onClick={() => setShowClaimForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Resolution Notes */}
              <div>
                <label
                  htmlFor="authority-resolution-notes"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Official Resolution Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="authority-resolution-notes"
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe the repair actions taken (e.g., Pothole filled with high-grade asphalt, road surface smoothed)..."
                  className={[
                    "w-full rounded-lg border px-3 py-2 text-sm bg-white focus:ring-civic-teal focus:border-civic-teal",
                    fieldErrors.resolutionNotes ? "border-red-300 bg-red-50/50" : "border-gray-300",
                  ].join(" ")}
                />
                {fieldErrors.resolutionNotes && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.resolutionNotes[0]}
                  </p>
                )}
              </div>

              {/* Repair Photo Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Repair Evidence Photo <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {repairPreview ? (
                  <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-white max-w-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={repairPreview}
                      alt="Repair evidence preview"
                      className="max-h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeRepairFile}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 cursor-pointer hover:border-civic-teal transition-colors text-center"
                  >
                    <Camera className="h-6 w-6 text-gray-400 mb-1" />
                    <span className="text-xs font-medium text-gray-700">
                      Click to upload photo of completed repair
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5">
                      JPEG, PNG, WebP up to 5 MB
                    </span>
                  </div>
                )}

                {fieldErrors.repairPhoto && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.repairPhoto[0]}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClaimForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  isLoading={isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Submit Resolution Claim
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Card>
  );
}
