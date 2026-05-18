import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopNav } from "@/components/layout/TopNav";
import { RecruitingWorkbenchPage } from "@/components/recruiting/RecruitingWorkbenchPage";

export const metadata: Metadata = {
  title: "Sourcing Hub | BlackDog Talent Hub",
  description: "Manage recruiting tasks, assigned HRs, target languages, timelines, and fixed scripts.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/recruiting">
        <RecruitingWorkbenchPage hideTopNav />
      </AccessGate>
    </>
  );
}
