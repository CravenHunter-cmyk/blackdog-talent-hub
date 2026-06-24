import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { WorkHubTabs } from "@/components/workhub/WorkHubTabs";

export default function WorkHubLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      <WorkHubTabs />
      {children}
    </>
  );
}
