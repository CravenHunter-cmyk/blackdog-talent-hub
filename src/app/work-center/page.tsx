import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopNav } from "@/components/layout/TopNav";
import { WorkCenterPage } from "@/components/work-center/WorkCenterPage";

export const metadata: Metadata = {
  title: "Delivery Hub | BlackDog Talent Hub",
  description: "Manage delivery projects, records, review workflows, and delivery sync.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/work-center">
        <WorkCenterPage />
      </AccessGate>
    </>
  );
}
