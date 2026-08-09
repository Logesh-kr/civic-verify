"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCheck, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { registerUserAction } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants";
import type { Role } from "@/types";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("CITIZEN");

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await registerUserAction({
        name,
        email,
        password,
        confirmPassword,
        role,
      });

      if (!res.success) {
        setGlobalError(res.error);
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      } else {
        router.push(ROUTES.dashboard);
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Join CivicVerify to report, track, or resolve civic issues
        </p>
      </div>

      {globalError && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <div>{globalError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label
            htmlFor="register-name"
            className="block text-sm font-medium text-gray-700"
          >
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="register-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className={[
              "mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-colors",
              fieldErrors.name
                ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-civic-blue focus:ring-civic-blue",
            ].join(" ")}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="register-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            id="register-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={[
              "mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-colors",
              fieldErrors.email
                ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-civic-blue focus:ring-civic-blue",
            ].join(" ")}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Account Role <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("CITIZEN")}
              className={[
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                role === "CITIZEN"
                  ? "border-civic-blue bg-civic-blue/5 text-civic-blue ring-1 ring-civic-blue font-semibold"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              <UserCheck className="h-5 w-5" />
              <span className="text-xs">Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("AUTHORITY")}
              className={[
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                role === "AUTHORITY"
                  ? "border-civic-blue bg-civic-blue/5 text-civic-blue ring-1 ring-civic-blue font-semibold"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              <Building2 className="h-5 w-5" />
              <span className="text-xs">Authority</span>
            </button>
          </div>
          {fieldErrors.role && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.role[0]}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="register-password"
            className="block text-sm font-medium text-gray-700"
          >
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="register-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={[
              "mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-colors",
              fieldErrors.password
                ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-civic-blue focus:ring-civic-blue",
            ].join(" ")}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="register-confirm-password"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            id="register-confirm-password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className={[
              "mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-colors",
              fieldErrors.confirmPassword
                ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-civic-blue focus:ring-civic-blue",
            ].join(" ")}
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.confirmPassword[0]}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isPending}
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href={ROUTES.login}
          className="font-medium text-civic-blue hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
