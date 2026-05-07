import type { Metadata } from "next"
import { TopNav } from "@/components/layout/TopNav"
import { UsersPermissionsPage } from "@/components/settings/UsersPermissionsPage"
import { loadTalentLibraryProfiles } from "@/data/talentPoolStore"

export const metadata: Metadata = {
  title: "Users & Permissions | BlackDog Talent Hub",
  description: "Manage role templates and account-level permission overrides.",
}

export default async function Page() {
  const talentProfiles = await loadTalentLibraryProfiles()

  return (
    <>
      <TopNav />
      <UsersPermissionsPage initialTalentProfiles={talentProfiles} />
    </>
  )
}
