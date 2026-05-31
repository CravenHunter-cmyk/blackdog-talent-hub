import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopNav } from "@/components/layout/TopNav";
import { WorkCenterPage } from "@/components/work-center/WorkCenterPage";

export const metadata: Metadata = {
  title: "AI Capability Diagnosis | BlackDog Talent Hub",
  description: "Diagnose model capabilities, design evaluation workflows, match expert talent, and deliver model-ready results.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/work-center">
        <WorkCenterPage />
      </AccessGate>
    </>
  );
}
