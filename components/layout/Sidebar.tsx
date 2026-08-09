"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  CheckCircle2,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  Building2,
  User,
} from "lucide-react";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { LogoutButton } from "./LogoutButton";
import type { Role } from "@/types";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role: Role;
  } | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const allNavItems: NavItem[] = [
  {
    label: "Overview",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    roles: ["CITIZEN", "AUTHORITY", "PUBLIC"],
  },
  {
    label: "Complaints",
    href: ROUTES.complaints,
    icon: FileText,
    roles: ["CITIZEN", "AUTHORITY", "PUBLIC"],
  },
  {
    label: "Report Issue",
    href: ROUTES.report,
    icon: PlusCircle,
    roles: ["CITIZEN"],
  },
  {
    label: "Verification",
    href: ROUTES.verification,
    icon: CheckCircle2,
    roles: ["CITIZEN"],
  },
  {
    label: "Accountability",
    href: ROUTES.accountability,
    icon: BarChart3,
    roles: ["AUTHORITY", "PUBLIC"],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const userRole: Role = user?.role ?? "CITIZEN";

  // Filter navigation links allowed for user's role
  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white shadow-xs">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-civic-blue">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-gray-900">{APP_NAME}</span>
        </Link>
        <span className="rounded bg-civic-blue/10 px-2 py-0.5 text-[11px] font-semibold text-civic-blue uppercase">
          {userRole}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Dashboard navigation">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === ROUTES.dashboard
              ? pathname === ROUTES.dashboard
              : pathname?.startsWith(href) ?? false;

          return (
            <Link
              key={href}
              href={href}
              className={[
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-civic-blue/10 text-civic-blue"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Authenticated User Profile & Logout Footer */}
      <div className="border-t border-gray-100 p-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-civic-blue/10 text-civic-blue font-bold text-xs">
                {user.role === "AUTHORITY" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-900">{user.name}</p>
                <p className="truncate text-[11px] text-gray-500">{user.email}</p>
              </div>
            </div>

            <LogoutButton className="w-full justify-center bg-gray-50 hover:bg-red-50" />
          </div>
        ) : (
          <div className="text-center">
            <Link
              href={ROUTES.login}
              className="text-xs font-medium text-civic-blue hover:underline"
            >
              Sign in to your account
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
