import type { Metadata } from "next";
import Link from "next/link";
import { ScanSearch, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import { VerificationCard } from "./VerificationCard";

export const metadata: Metadata = {
  title: "Verification Queue",
  description:
    "Review resolution claims for your complaints and confirm or dispute them.",
};

export default async function VerificationPage() {
  const user = await requireRole(["CITIZEN"]);

  // Fetch ONLY the authenticated citizen's CLAIMED_RESOLVED complaints
  const pendingComplaints = await prisma.complaint.findMany({
    where: {
      authorId: user.id,
      status: "CLAIMED_RESOLVED",
    },
    include: {
      author: { select: { name: true } },
      aiAssessment: true,
      evidence: {
        select: {
          id: true,
          imageUrl: true,
          isRepairEvidence: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Also fetch recently verified/disputed for context (last 5)
  const recentlyActioned = await prisma.complaint.findMany({
    where: {
      authorId: user.id,
      status: { in: ["VERIFIED", "DISPUTED"] },
    },
    include: {
      verifications: {
        select: { result: true, reasoning: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-3xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ScanSearch className="h-6 w-6 text-amber-600" />
          Verification Queue
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Complaints where the authority has claimed resolution — awaiting your independent
          verification.
        </p>
      </div>

      {/* Pending Verification */}
      {pendingComplaints.length === 0 ? (
        <Card className="text-center py-12 px-6 mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">No pending verifications</h2>
          <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
            None of your complaints are currently awaiting your verification.
          </p>
          <Link
            href={ROUTES.complaints}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-civic-blue hover:underline"
          >
            View all complaints <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      ) : (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Pending Your Decision
            </h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              {pendingComplaints.length} awaiting
            </span>
          </div>
          {pendingComplaints.map((complaint) => (
            <VerificationCard
              key={complaint.id}
              complaint={{
                ...complaint,
                createdAt: complaint.createdAt.toISOString(),
                updatedAt: complaint.updatedAt.toISOString(),
                author: { name: complaint.author.name },
                aiAssessment: complaint.aiAssessment,
                evidence: complaint.evidence.map((e) => ({
                  ...e,
                  createdAt: e.createdAt.toISOString(),
                })),
              }}
            />
          ))}
        </div>
      )}

      {/* Recently Actioned */}
      {recentlyActioned.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
            Recently Actioned
          </h2>
          <div className="space-y-2">
            {recentlyActioned.map((complaint) => {
              const verification = complaint.verifications[0];
              const isVerified = complaint.status === "VERIFIED";
              return (
                <Card key={complaint.id} padding="sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          isVerified
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600",
                        ].join(" ")}
                      >
                        {isVerified ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {complaint.title}
                        </p>
                        {verification?.reasoning && (
                          <p className="text-xs text-gray-500 truncate">
                            {isVerified ? "Verified" : `Disputed: ${verification.reasoning}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={ROUTES.complaintDetail(complaint.id)}
                      className="shrink-0 text-xs font-medium text-civic-blue hover:underline flex items-center gap-1"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
