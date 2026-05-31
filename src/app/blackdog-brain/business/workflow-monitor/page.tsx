import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Workflow Monitor | Business Brain",
  description: "Transparent delivery layer for progress, quality, risk, decisions, and final model-ready packages.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/business/workflow-monitor">
        <BlackDogBrainModulePage trackId="business" moduleId="workflow-monitor" />
      </AccessGate>
    </>
  );
}
