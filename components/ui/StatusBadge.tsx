import { COMPLAINT_STATUS_COLORS, COMPLAINT_STATUS_LABELS } from "@/lib/constants";
import type { ComplaintStatus } from "@/types";

interface StatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const colors = COMPLAINT_STATUS_COLORS[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  };
  const label = COMPLAINT_STATUS_LABELS[status] ?? status;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors.bg,
        colors.text,
        className,
      ].join(" ")}
    >
      <span className={["h-1.5 w-1.5 rounded-full", colors.dot].join(" ")} />
      {label}
    </span>
  );
}
