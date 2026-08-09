import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Dashboard — CivicVerify",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication protection
  const user = await requireAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar with role-based navigation and user identity */}
      <Sidebar user={user} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <main id="dashboard-main" className="flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
