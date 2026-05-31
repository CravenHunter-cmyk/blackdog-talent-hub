import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Talent Workspace | BlackDog Brain",
  description: "Evaluator and reviewer workspace for calibration, task execution, QA feedback, and workload records.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/talent-workspace">
        <BlackDogBrainModulePage moduleId="talent-workspace" />
      </AccessGate>
    </>
  );
}
