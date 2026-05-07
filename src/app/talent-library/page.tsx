import type { Metadata } from "next"
import { TopNav } from "@/components/layout/TopNav"
import { TalentLibraryPage } from "@/components/talent-pool/TalentLibraryPage"
import { loadTalentLibraryProfiles } from "@/data/talentPoolStore"

export const metadata: Metadata = {
  title: "BlackDog Talent Library",
  description: "BlackDog admin talent library and submitted candidate profiles.",
}

export default async function Page() {
  const profiles = await loadTalentLibraryProfiles()
  return (
    <>
      <TopNav />
      <TalentLibraryPage initialProfiles={profiles} />
    </>
  )
}
