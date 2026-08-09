import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProblemSolution } from "@/components/landing/ProblemSolution";

export const metadata: Metadata = {
  title: "CivicVerify — Evidence-Based Civic Accountability",
  description:
    "CivicVerify adds an evidence-based verification layer between 'claimed resolved' and 'actually resolved.' Report civic issues. Verify outcomes. Hold authorities accountable.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero />
        <HowItWorks />
        <ProblemSolution />
      </main>
      <Footer />
    </>
  );
}
