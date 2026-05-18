import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopNav } from "@/components/layout/TopNav";
import { UsersPermissionsPage } from "@/components/settings/UsersPermissionsPage";
import { loadTalentLibraryProfiles } from "@/data/talentPoolStore";

export const metadata: Metadata = {
  title: "Command | BlackDog Talent Hub",
  description: "Manage users, permissions, account roles, and platform settings.",
};

export default async function Page() {
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
