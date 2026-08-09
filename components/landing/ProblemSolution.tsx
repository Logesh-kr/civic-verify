import { AlertTriangle, Lightbulb } from "lucide-react";

export function ProblemSolution() {
  return (
    <section
      className="py-20 sm:py-28"
      aria-labelledby="problem-solution-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="problem-solution-heading"
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            The accountability gap
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Most civic grievance systems track whether a complaint was
            &ldquo;closed&rdquo; — not whether the issue was actually fixed.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
          {/* Problem */}
          <div className="rounded-xl border border-red-100 bg-red-50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle
                  className="h-5 w-5 text-red-600"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-semibold text-red-900">The Problem</h3>
            </div>
            <ul className="space-y-3 text-sm text-red-800">
              <li className="flex gap-2">
                <span className="mt-0.5 text-red-400" aria-hidden="true">
                  ✕
                </span>
                Complaints can be marked &ldquo;resolved&rdquo; without
                independent verification
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-red-400" aria-hidden="true">
                  ✕
                </span>
                Citizens have no mechanism to dispute a premature closure
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-red-400" aria-hidden="true">
                  ✕
                </span>
                There is no public, auditable record of how often claims hold up
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-red-400" aria-hidden="true">
                  ✕
                </span>
                Accountability is difficult to establish without evidence
              </li>
            </ul>
          </div>

          {/* Solution */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Lightbulb
                  className="h-5 w-5 text-emerald-600"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-semibold text-emerald-900">The Solution</h3>
            </div>
            <ul className="space-y-3 text-sm text-emerald-800">
              <li className="flex gap-2">
                <span className="mt-0.5 text-emerald-500" aria-hidden="true">
                  ✓
                </span>
                A clear separation between CLAIMED_RESOLVED and VERIFIED
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-emerald-500" aria-hidden="true">
                  ✓
                </span>
                Fresh evidence submitted after a resolution claim enables
                verification
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-emerald-500" aria-hidden="true">
                  ✓
                </span>
                DISPUTED status allows structured escalation of contested claims
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-emerald-500" aria-hidden="true">
                  ✓
                </span>
                A public accountability view records outcomes for civic
                transparency
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
