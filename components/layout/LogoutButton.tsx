"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutUserAction } from "@/lib/actions/auth";

interface LogoutButtonProps {
  className?: string;
  showText?: boolean;
}

export function LogoutButton({ className = "", showText = true }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUserAction();
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={[
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50",
        className,
      ].join(" ")}
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      {showText && <span>{isPending ? "Signing out..." : "Sign out"}</span>}
    </button>
  );
}
