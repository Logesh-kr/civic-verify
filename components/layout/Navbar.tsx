"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui";

const navLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Accountability", href: ROUTES.accountability },
];

export function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={ROUTES.home}
          className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity"
          aria-label={`${APP_NAME} home`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-civic-blue">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </Link>

        {/* Nav links */}
        {!isDashboard && (
          <nav className="hidden items-center gap-6 sm:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link href={ROUTES.login}>
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href={ROUTES.report}>
            <Button variant="primary" size="sm">
              Report Issue
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
