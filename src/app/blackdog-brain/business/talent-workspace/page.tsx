import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Talent Workspace | Business Brain",
  description: "Evaluator and reviewer workspace for calibration, task execution, QA feedback, and workload records.",
};

export default function Page() {
  return (
    <>
      <AccessGate route="/blackdog-brain/business/talent-workspace">
        <BlackDogBrainModulePage trackId="business" moduleId="talent-workspace" />
      </AccessGate>
    </>
  );
}
