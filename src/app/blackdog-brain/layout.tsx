import type { ReactNode } from "react";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";
import { TopNav } from "@/components/layout/TopNav";

function isBrainWorkspaceEnabled() {
  return process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_BLACKDOG_BRAIN === "true";
}

export default function BlackDogBrainLayout({ children }: { children: ReactNode }) {
  if (!isBrainWorkspaceEnabled()) {
    return (
      <>
        <TopNav />
        <BrainComingSoon />
      </>
    );
  }

  return children;
}
