import type { Metadata } from "next";
import Link from "next/link";
import { FileText, PlusCircle, MapPin, Calendar, ArrowRight, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import type { ComplaintStatus } from "@/types";

export const metadata: Metadata = {
  title: "Complaints",
  description: "View and track civic complaints and resolution status.",
};

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAuth();
  const { status: statusFilter } = await searchParams;

  // Build Prisma query condition based on user role and optional status filter
  const statusCondition = statusFilter && statusFilter !== "ALL"
    ? (statusFilter as ComplaintStatus)
    : undefined;

  const complaints = await prisma.complaint.findMany({
    where: {
      ...(user.role === "CITIZEN" ? { authorId: user.id } : {}),
      ...(statusCondition ? { status: statusCondition } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const filterTabs = [
    { label: "All", value: "ALL" },
    { label: "Submitted", value: "SUBMITTED" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Claimed Resolved", value: "CLAIMED_RESOLVED" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === "CITIZEN" ? "My Complaints" : "All Civic Complaints"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user.role === "CITIZEN"
              ? "Track status updates and resolution history for your submitted complaints"
              : "Review, manage, and process civic grievances submitted by citizens"}
          </p>
        </div>

        {user.role === "CITIZEN" && (
          <Link href={ROUTES.report}>
            <Button variant="primary" size="sm">
              <PlusCircle className="h-4 w-4" />
              Report New Issue
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <span className="text-xs font-semibold text-gray-500 mr-1">Filter:</span>
        {filterTabs.map((tab) => {
          const isActive = (statusFilter ?? "ALL") === tab.value;
          return (
            <Link
              key={tab.value}
              href={
                tab.value === "ALL"
                  ? ROUTES.complaints
                  : `${ROUTES.complaints}?status=${tab.value}`
              }
              className={[
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "bg-civic-blue text-white shadow-xs font-semibold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Complaint List or Empty State */}
      {complaints.length === 0 ? (
        <Card className="text-center py-12 px-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No complaints found
          </h2>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto mb-6">
            {user.role === "CITIZEN"
              ? "You haven't reported any civic issues matching this filter."
              : "There are no complaints matching the selected filter in the database."}
          </p>
          {user.role === "CITIZEN" && (
            <Link href={ROUTES.report}>
              <Button variant="primary">
                <PlusCircle className="h-4 w-4" />
                Report an Issue
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <Card
              key={complaint.id}
              padding="sm"
              className="hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-civic-blue/10 text-civic-blue">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">
                        #{complaint.id}
                      </span>
                      <StatusBadge status={complaint.status as ComplaintStatus} />
                    </div>

                    <h2 className="font-semibold text-gray-900 truncate text-base">
                      {complaint.title}
                    </h2>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">
                        {complaint.category}
                      </span>

                      {/* Display Citizen Name for Authority Role */}
                      {user.role === "AUTHORITY" && (
                        <span className="flex items-center gap-1 text-gray-700 font-medium">
                          <User className="h-3 w-3 text-gray-400" />
                          {complaint.author.name}
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>

                      {complaint.latitude != null && complaint.longitude != null && (
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  <Link href={ROUTES.complaintDetail(complaint.id)}>
                    <Button variant="outline" size="sm">
                      {user.role === "AUTHORITY" ? "Process Complaint" : "View Details"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
