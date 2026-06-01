import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainHome } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";
import { TopNav } from "@/components/layout/TopNav";
import { isBlackDogBrainWorkspaceEnabled } from "@/lib/blackdogBrainAccess";

export const metadata: Metadata = {
  title: "BlackDog Brain | BlackDog Talent Hub",
  description: "The brain that turns human needs into AI-powered workflows, workspaces, and personalized operating systems.",
};

export default function Page() {
  if (!isBlackDogBrainWorkspaceEnabled()) {
    return <BrainComingSoon />;
  }

  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain" noPermissionFallback={<BrainComingSoon />}>
        <BlackDogBrainHome />
      </AccessGate>
    </>
  );
}
