import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { ROUTES } from "@/lib/constants";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-white py-20 sm:py-28"
      aria-labelledby="hero-heading"
    >
      {/* Subtle background grid */}
      <div
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Eyebrow */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-civic-blue/20 bg-civic-blue/5 px-4 py-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-civic-blue" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-wide text-civic-blue uppercase">
            Evidence-Based Civic Accountability
          </span>
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
        >
          Civic issues shouldn&apos;t disappear when they&apos;re marked{" "}
          <span className="text-civic-blue">&ldquo;resolved.&rdquo;</span>
        </h1>

        {/* Supporting message */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
          CivicVerify adds an evidence-based verification layer between{" "}
          <span className="font-medium text-gray-900">
            &ldquo;claimed resolved&rdquo;
          </span>{" "}
          and{" "}
          <span className="font-medium text-gray-900">
            &ldquo;actually resolved.&rdquo;
          </span>
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={ROUTES.report}>
            <Button size="lg" variant="primary" className="w-full sm:w-auto">
              Report an Issue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href={ROUTES.accountability}>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View Accountability
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
