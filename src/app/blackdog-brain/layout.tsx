import type { ReactNode } from "react";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";
import { TopNav } from "@/components/layout/TopNav";
import { isBlackDogBrainWorkspaceEnabled } from "@/lib/blackdogBrainAccess";

export default function BlackDogBrainLayout({ children }: { children: ReactNode }) {
  if (!isBlackDogBrainWorkspaceEnabled()) {
    return (
      <>
        <TopNav />
        <BrainComingSoon />
      </>
    );
  }

  return children;
}
