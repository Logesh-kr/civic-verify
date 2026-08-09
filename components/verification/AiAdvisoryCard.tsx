import { Bot, CheckCircle2, AlertTriangle, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { AiAssessmentData, AiAssessmentResult } from "@/types";

interface AiAdvisoryCardProps {
  aiAssessment?: AiAssessmentData | null;
  className?: string;
}

const RESULT_CONFIG: Record<
  AiAssessmentResult,
  {
    label: string;
    icon: React.ElementType;
    badgeStyle: string;
    progressStyle: string;
    bgStyle: string;
  }
> = {
  LIKELY_RESOLVED: {
    label: "Likely Resolved",
    icon: CheckCircle2,
    badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-200",
    progressStyle: "bg-emerald-500",
    bgStyle: "border-emerald-200 bg-emerald-50/40",
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    icon: AlertTriangle,
    badgeStyle: "bg-amber-100 text-amber-800 border-amber-200",
    progressStyle: "bg-amber-500",
    bgStyle: "border-amber-200 bg-amber-50/40",
  },
  LIKELY_NOT_RESOLVED: {
    label: "Likely Not Resolved",
    icon: XCircle,
    badgeStyle: "bg-red-100 text-red-800 border-red-200",
    progressStyle: "bg-red-500",
    bgStyle: "border-red-200 bg-red-50/40",
  },
};

export function AiAdvisoryCard({ aiAssessment, className = "" }: AiAdvisoryCardProps) {
  // Case 1: AI Assessment is missing or FAILED
  if (!aiAssessment || aiAssessment.status === "FAILED") {
    return (
      <Card padding="sm" className={["border-gray-200 bg-gray-50/70", className].join(" ")}>
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-600">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Bot className="h-3.5 w-3.5 text-gray-500" />
                AI Evidence Advisory
              </span>
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-mono text-gray-600">
                Unavailable
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              AI advisory currently unavailable. Please inspect the evidence manually.
            </p>
            <p className="mt-1.5 text-[11px] text-gray-400 italic">
              Note: The final verification decision always belongs to the citizen.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Case 2: AI Assessment is still PENDING
  if (aiAssessment.status === "PENDING" || !aiAssessment.result) {
    return (
      <Card padding="sm" className={["border-blue-200 bg-blue-50/40", className].join(" ")}>
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                <Bot className="h-3.5 w-3.5 text-blue-600" />
                AI Evidence Advisory
              </span>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-mono text-blue-700 animate-pulse">
                Analyzing...
              </span>
            </div>
            <p className="mt-1 text-xs text-blue-800">
              Groq AI is currently evaluating the visual evidence.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Case 3: AI Assessment is COMPLETED
  const config = RESULT_CONFIG[aiAssessment.result];
  const ResultIcon = config.icon;
  const confidencePercent = Math.round((aiAssessment.confidenceScore ?? 0) * 100);

  return (
    <Card padding="sm" className={[config.bgStyle, className].join(" ")}>
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 border shadow-xs text-gray-700">
              <Bot className="h-4 w-4 text-civic-blue" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                AI Evidence Advisory
              </h3>
              <span className="text-[10px] font-mono text-gray-400">
                Model: {aiAssessment.modelName}
              </span>
            </div>
          </div>

          {/* Result Badge */}
          <div
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-2xs",
              config.badgeStyle,
            ].join(" ")}
          >
            <ResultIcon className="h-3.5 w-3.5 shrink-0" />
            {config.label}
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="space-y-1 bg-white/70 rounded-lg p-2.5 border border-gray-200/60">
          <div className="flex items-center justify-between text-xs font-medium text-gray-700">
            <span>AI confidence</span>
            <span className="font-bold font-mono">{confidencePercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={["h-full transition-all duration-500", config.progressStyle].join(" ")}
              style={{ width: `${Math.max(5, Math.min(100, confidencePercent))}%` }}
            />
          </div>
        </div>

        {/* Explanation */}
        {aiAssessment.explanation && (
          <div className="text-xs text-gray-700 leading-relaxed bg-white/50 rounded-lg p-2.5 border border-gray-200/40">
            <span className="font-semibold text-gray-900 block mb-0.5">Visual Analysis:</span>
            {aiAssessment.explanation}
          </div>
        )}

        {/* Advisory Disclaimer */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1 border-t border-gray-200/40">
          <AlertCircle className="h-3 w-3 text-gray-400 shrink-0" />
          <span>
            AI-generated advisory. The final verification decision belongs to the citizen.
          </span>
        </div>
      </div>
    </Card>
  );
}
