import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  User,
  Building2,
  Clock,
  Wrench,
  ScanSearch,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROUTES, ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/types";

export const metadata: Metadata = {
  title: "Dashboard Overview",
};

interface QuickLinkCard {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  accent: string;
  roles: Role[];
}

const quickLinks: QuickLinkCard[] = [
  {
    title: "Complaints",
    description: "Browse and track civic complaints",
    href: ROUTES.complaints,
    icon: FileText,
    accent: "text-civic-blue bg-civic-blue/10",
    roles: ["CITIZEN", "AUTHORITY", "PUBLIC"],
  },
  {
    title: "Report an Issue",
    description: "File a new evidence-backed complaint",
    href: ROUTES.report,
    icon: PlusCircle,
    accent: "text-emerald-600 bg-emerald-50",
    roles: ["CITIZEN"],
  },
  {
    title: "Verification Queue",
    description: "Review resolution claims awaiting verification",
    href: ROUTES.verification,
    icon: CheckCircle2,
    accent: "text-amber-600 bg-amber-50",
    roles: ["CITIZEN"],
  },
  {
    title: "Accountability",
    description: "Public record of complaint outcomes",
    href: ROUTES.accountability,
    icon: BarChart3,
    accent: "text-purple-600 bg-purple-50",
    roles: ["AUTHORITY", "PUBLIC"],
  },
];

export default async function DashboardPage() {
  const user = await requireAuth();
  const userRole: Role = (user.role as Role) ?? "CITIZEN";
  const userRoleLabel = ROLE_LABELS[userRole] ?? userRole;

  // Calculate REAL complaint statistics from SQLite database
  const complaints = await prisma.complaint.findMany({
    where: userRole === "CITIZEN" ? { authorId: user.id } : undefined,
    select: { status: true },
  });

  const totalCount = complaints.length;
  const submittedCount = complaints.filter((c) => c.status === "SUBMITTED").length;
  const inProgressCount = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const claimedResolvedCount = complaints.filter((c) => c.status === "CLAIMED_RESOLVED").length;
  const verifiedCount = complaints.filter((c) => c.status === "VERIFIED").length;
  const disputedCount = complaints.filter((c) => c.status === "DISPUTED").length;

  const allowedQuickLinks = quickLinks.filter((link) =>
    link.roles.includes(userRole)
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Personalized Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            CivicVerify Dashboard &middot; Logged in as{" "}
            <span className="font-semibold text-gray-700">{user.email}</span>
          </p>
        </div>

        {/* Role badge */}
        <div className="inline-flex items-center gap-2 rounded-xl border border-civic-blue/20 bg-civic-blue/5 px-3 py-1.5 self-start sm:self-auto">
          {userRole === "AUTHORITY" ? (
            <Building2 className="h-4 w-4 text-civic-blue" />
          ) : (
            <User className="h-4 w-4 text-civic-blue" />
          )}
          <span className="text-xs font-bold tracking-wide text-civic-blue uppercase">
            {userRoleLabel}
          </span>
        </div>
      </div>

      {/* Real Statistics Metric Cards */}
      <div className="mb-8 grid grid-cols-3 sm:grid-cols-6 gap-3">
        <Card padding="sm" className="text-center col-span-1">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <FileText className="h-4 w-4" />
          </div>
          <p className="text-xl font-bold text-gray-900">{totalCount}</p>
          <p className="text-xs text-gray-500">Total</p>
        </Card>

        <Card padding="sm" className="text-center">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-xl font-bold text-gray-900">{submittedCount}</p>
          <p className="text-xs text-gray-500">Submitted</p>
        </Card>

        <Card padding="sm" className="text-center">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Wrench className="h-4 w-4" />
          </div>
          <p className="text-xl font-bold text-gray-900">{inProgressCount}</p>
          <p className="text-xs text-gray-500">In Progress</p>
        </Card>

        <Card padding="sm" className="text-center">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-xl font-bold text-gray-900">{claimedResolvedCount}</p>
          <p className="text-xs text-gray-500">Pending Verify</p>
        </Card>

        <Card padding="sm" className="text-center">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ScanSearch className="h-4 w-4" />
          </div>
          <p className="text-xl font-bold text-gray-900">{verifiedCount}</p>
          <p className="text-xs text-gray-500">Verified</p>
        </Card>

        <Card padding="sm" className="text-center">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <BarChart3 className="h-4 w-4" />
          </div>
          <p className="text-xl font-bold text-gray-900">{disputedCount}</p>
          <p className="text-xs text-gray-500">Disputed</p>
        </Card>
      </div>

      {/* Role Notice */}
      <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-blue-900">
            Authenticated as {userRoleLabel}
          </h2>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          {userRole === "CITIZEN"
            ? "As a Citizen, you can submit civic complaints with evidence, track status updates, and participate in independent verification."
            : "As an Authority official, you can inspect reported complaints, submit resolution claims, and publish official accountability metrics."}
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {allowedQuickLinks.map(
          ({ title, description, href, icon: Icon, accent }) => (
            <Link key={href} href={href} className="group block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        accent,
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{title}</h3>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-600"
                    aria-hidden="true"
                  />
                </div>
              </Card>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
