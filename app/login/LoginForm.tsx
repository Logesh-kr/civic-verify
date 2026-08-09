"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, UserCheck, Building2 } from "lucide-react";
import { Button } from "@/components/ui";
import { loginUserAction } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await loginUserAction({ email, password });

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

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setGlobalError(null);
    setFieldErrors({});
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sign in to your CivicVerify account
        </p>
      </div>

      {globalError && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <div>{globalError}</div>
        </div>
      )}

      {/* Demo Credentials Helper Box */}
      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
        <p className="text-xs font-semibold text-blue-900 mb-2">
          ⚡ Hackathon Quick Demo Login:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              fillDemoAccount("citizen@demo.civicverify.local", "DemoCitizen123!")
            }
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Demo Citizen</span>
          </button>
          <button
            type="button"
            onClick={() =>
              fillDemoAccount("authority@demo.civicverify.local", "DemoAuthority123!")
            }
            className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors"
          >
            <Building2 className="h-3.5 w-3.5 text-purple-600" />
            <span>Demo Authority</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            id="login-email"
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

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-gray-700"
          >
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isPending}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href={ROUTES.register}
          className="font-medium text-civic-blue hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
