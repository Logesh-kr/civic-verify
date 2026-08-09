import {
  Camera,
  Wrench,
  ScanSearch,
  Scale,
  ArrowDown,
} from "lucide-react";

interface Step {
  number: number;
  icon: React.ElementType;
  label: string;
  title: string;
  description: string;
  accent: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: Camera,
    label: "REPORT",
    title: "Citizens file evidence-backed reports",
    description:
      "A citizen documents a civic issue — pothole, broken streetlight, sewage overflow — with a photo and location. The complaint enters the system as SUBMITTED.",
    accent: "bg-civic-blue/10 text-civic-blue border-civic-blue/20",
  },
  {
    number: 2,
    icon: Wrench,
    label: "REPAIR",
    title: "Authority processes the complaint",
    description:
      "The relevant authority acknowledges the complaint, works on it, and updates the status to CLAIMED_RESOLVED when they believe the issue is fixed.",
    accent: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    number: 3,
    icon: ScanSearch,
    label: "VERIFY",
    title: "Independent evidence-based verification",
    description:
      "A claim of resolution is not automatically trusted. Fresh evidence is submitted and compared. The system determines VERIFIED or DISPUTED — not the authority.",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    number: 4,
    icon: Scale,
    label: "ACCOUNTABILITY",
    title: "Public record of outcomes",
    description:
      "Every complaint, claim, and verification outcome is recorded. Disputed resolutions can be escalated. Authorities are held to a verifiable track record.",
    accent: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-gray-50 py-20 sm:py-28"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            How CivicVerify works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            A four-stage accountability pipeline that closes the gap between a
            claimed fix and a verified one.
          </p>
        </div>

        {/* Steps */}
        <div className="mx-auto mt-16 max-w-2xl">
          {steps.map((step, index) => (
            <div key={step.label} className="relative">
              {/* Step card */}
              <div className="flex gap-6">
                {/* Icon column */}
                <div className="flex flex-col items-center">
                  <div
                    className={[
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
                      step.accent,
                    ].join(" ")}
                  >
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div className="mt-2 flex flex-1 flex-col items-center pb-2">
                      <div className="h-full w-px bg-gray-200" />
                      <ArrowDown
                        className="mt-1 h-4 w-4 text-gray-300"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="pb-10">
                  <span
                    className={[
                      "inline-block rounded border px-2 py-0.5 text-xs font-bold tracking-widest",
                      step.accent,
                    ].join(" ")}
                  >
                    {step.label}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
