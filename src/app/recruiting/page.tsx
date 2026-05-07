import type { Metadata } from "next";
import { RecruitingWorkbenchPage } from "@/components/recruiting/RecruitingWorkbenchPage";

export const metadata: Metadata = {
  title: "Recruiting Tasks | BlackDog Talent Hub",
  description: "Manage recruiting tasks, assigned HRs, target languages, timelines, and fixed scripts.",
};

export default function Page() {
  return <RecruitingWorkbenchPage />;
}
