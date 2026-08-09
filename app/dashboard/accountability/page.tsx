import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, CheckCircle2, XCircle, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ComplaintStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Accountability",
  description: "A public record of civic complaint outcomes — verified and disputed resolutions, and escalated cases.",
};

export default async function AccountabilityPage() {
  await requireAuth();

  // Query real live metrics from Prisma database
  const [totalCount, verifiedCount, disputedCount, awaitingVerificationCount, escalatedCount] =
    await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: ComplaintStatus.VERIFIED } }),
      prisma.complaint.count({ where: { status: ComplaintStatus.DISPUTED } }),
      prisma.complaint.count({ where: { status: ComplaintStatus.CLAIMED_RESOLVED } }),
      prisma.complaint.count({ where: { status: ComplaintStatus.ESCALATED } }),
    ]);

  const STATS = [
    {
      label: "Total Complaints",
      value: totalCount,
      icon: BarChart3,
      color: "text-gray-500 bg-gray-100",
    },
    {
      label: "Verified",
      value: verifiedCount,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Disputed",
      value: disputedCount,
      icon: XCircle,
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Awaiting Verification",
      value: awaitingVerificationCount,
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Escalated",
      value: escalatedCount,
      icon: AlertTriangle,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  // Fetch recent complaint outcomes
  const recentOutcomes = await prisma.complaint.findMany({
    where: {
      status: {
        in: [
          ComplaintStatus.VERIFIED,
          ComplaintStatus.DISPUTED,
          ComplaintStatus.CLAIMED_RESOLVED,
          ComplaintStatus.ESCALATED,
        ],
      },
    },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Accountability</h1>
        <p className="mt-1 text-sm text-gray-500">
          A public record of civic complaint outcomes — verified and disputed
          resolutions, and escalated cases.
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} padding="sm" className="text-center">
            <div
              className={[
                "mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg",
                color,
              ].join(" ")}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{label}</p>
          </Card>
        ))}
      </div>

      {/* Recent outcomes */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Outcomes
        </h2>
        {recentOutcomes.length > 0 ? (
          <div className="space-y-3">
            {recentOutcomes.map((outcome) => (
              <Card key={outcome.id} padding="sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/complaints/${outcome.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-civic-blue transition-colors truncate block"
                    >
                      {outcome.title}
                    </Link>
                    <span className="text-xs text-gray-400">{outcome.category}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(outcome.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <StatusBadge status={outcome.status} />
                    <Link
                      href={`/dashboard/complaints/${outcome.id}`}
                      className="text-gray-400 hover:text-civic-blue"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="md" className="text-center text-xs text-gray-500">
            No resolved or disputed complaints yet. Outcomes will appear here as citizens verify authority claims.
          </Card>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        All accountability metrics are computed in real time from independent citizen verifications and authority claims.
      </p>
    </div>
  );
}

