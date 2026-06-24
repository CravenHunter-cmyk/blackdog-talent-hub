import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { RecruitingWorkbenchPage } from "@/components/recruiting/RecruitingWorkbenchPage";
import { WorkHubShell } from "@/components/workhub/WorkHubShell";

export const metadata: Metadata = {
  title: "Sourcing Hub | WorkHub",
  description: "Manage recruiting tasks, assigned HRs, target languages, timelines, and fixed scripts.",
};

export default function Page() {
  return (
    <AccessGate route="/workhub/sourcing-hub">
      <WorkHubShell>
        <RecruitingWorkbenchPage hideTopNav />
      </WorkHubShell>
    </AccessGate>
  );
}
