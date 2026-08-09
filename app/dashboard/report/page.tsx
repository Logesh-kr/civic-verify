import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { ReportForm } from "./ReportForm";

export const metadata: Metadata = {
  title: "Report an Issue",
  description: "Submit a new evidence-backed civic complaint.",
};

export default async function ReportPage() {
  // Enforce CITIZEN role requirement server-side
  await requireRole(["CITIZEN"]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Report a Civic Issue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Provide issue details, location, and photo evidence to log a verifiable complaint.
        </p>
      </div>

      <ReportForm />
    </div>
  );
}
