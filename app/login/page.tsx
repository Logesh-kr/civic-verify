import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { APP_NAME, ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sign In",
  description: `Sign in to your ${APP_NAME} account to report and track civic complaints.`,
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(ROUTES.dashboard);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href={ROUTES.home}
          className="mb-8 flex items-center justify-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-civic-blue">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
        </Link>

        {/* Form */}
        <LoginForm />
      </div>
    </div>
  );
}
