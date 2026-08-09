import Link from "next/link";
import { Shield } from "lucide-react";
import { APP_NAME, ROUTES } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Brand */}
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-civic-blue">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800">{APP_NAME}</span>
          </Link>

          {/* Links */}
          <nav className="flex gap-6" aria-label="Footer navigation">
            <Link
              href="/#how-it-works"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href={ROUTES.accountability}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Accountability
            </Link>
            <Link
              href={ROUTES.report}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Report Issue
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-gray-400">
            &copy; {year} {APP_NAME}. Built for civic accountability.
          </p>
        </div>
      </div>
    </footer>
  );
}
