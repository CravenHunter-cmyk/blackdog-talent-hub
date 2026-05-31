import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Continuous Optimization | Personal Brain",
  description: "Improve private assistants through feedback, behavior patterns, usage review, and personal goal updates.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/personal/continuous-optimization">
        <BlackDogBrainModulePage trackId="personal" moduleId="continuous-optimization" />
      </AccessGate>
    </>
  );
}
