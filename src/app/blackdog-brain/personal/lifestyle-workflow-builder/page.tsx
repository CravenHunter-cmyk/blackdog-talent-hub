import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Lifestyle Workflow Builder | Personal Brain",
  description: "Turn daily life needs into assistant workflows, recommendation logic, reminders, and feedback loops.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/personal/lifestyle-workflow-builder">
        <BlackDogBrainModulePage trackId="personal" moduleId="lifestyle-workflow-builder" />
      </AccessGate>
    </>
  );
}
