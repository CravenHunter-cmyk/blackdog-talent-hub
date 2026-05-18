import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopNav } from "@/components/layout/TopNav";
import { TaskManagementPage } from "@/components/task-management/TaskManagementPage";

export const metadata: Metadata = {
  title: "Task Management | BlackDog Talent Hub",
  description: "Manage client delivery tasks, progress, participants, and handoff readiness.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/task-management">
        <TaskManagementPage />
      </AccessGate>
    </>
  );
}
