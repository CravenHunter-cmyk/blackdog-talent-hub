import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";
import { TopNav } from "@/components/layout/TopNav";
import { isBlackDogCommandWorkspaceEnabled } from "@/lib/blackdogCommandAccess";

export const metadata: Metadata = {
  title: "Command | BlackDog Talent Hub",
  description: "Manage users, permissions, account roles, and platform settings.",
};

export default async function Page() {
  if (!isBlackDogCommandWorkspaceEnabled()) {
    return (
      <>
        <TopNav />
        <AccessGate route="/settings" module="settings">
          <BrainComingSoon />
        </AccessGate>
      </>
    );
  }

  const [{ UsersPermissionsPage }, { loadTalentLibraryProfiles }] = await Promise.all([
    import("@/components/settings/UsersPermissionsPage"),
    import("@/data/talentPoolStore"),
  ]);
  const talentProfiles = await loadTalentLibraryProfiles();

  return (
    <>
      <TopNav />
      <AccessGate route="/settings" module="settings">
        <UsersPermissionsPage initialTalentProfiles={talentProfiles} />
      </AccessGate>
    </>
  );
}
