import { redirect } from "next/navigation";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";
import { TopNav } from "@/components/layout/TopNav";
import { isBlackDogCommandWorkspaceEnabled } from "@/lib/blackdogCommandAccess";

export default function Page() {
  if (!isBlackDogCommandWorkspaceEnabled()) {
    return (
      <>
        <TopNav />
        <BrainComingSoon />
      </>
    );
  }

  redirect("/settings");
}
