import { redirect } from "next/navigation";
import { AccessGate } from "@/components/auth/AccessGate";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";
import { TopNav } from "@/components/layout/TopNav";
import { isBlackDogCommandWorkspaceEnabled } from "@/lib/blackdogCommandAccess";

export default function Page() {
  if (!isBlackDogCommandWorkspaceEnabled()) {
    return (
      <>
        <TopNav />
        <AccessGate route="/users-permissions" module="settings">
          <BrainComingSoon />
        </AccessGate>
      </>
    );
  }

  redirect("/settings");
}
