import type { Metadata } from "next";
import { RecruitingWorkbenchPage } from "@/components/recruiting/RecruitingWorkbenchPage";

export const metadata: Metadata = {
  title: "Recruiting Workbench | BlackDog Talent Hub",
  description: "AI-assisted Upwork recruiting workspace powered by BlackDog Browser Helper.",
};

export default function Page() {
  return <RecruitingWorkbenchPage />;
}
