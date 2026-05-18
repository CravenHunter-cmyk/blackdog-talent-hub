import type { Metadata } from "next"
import { AccessGate } from "@/components/auth/AccessGate"
import { TopNav } from "@/components/layout/TopNav"
import { TalentLibraryPage } from "@/components/talent-pool/TalentLibraryPage"
import { loadTalentLibraryProfiles } from "@/data/talentPoolStore"

export const metadata: Metadata = {
  title: "BlackDog Talent Museum",
  description: "BlackDog admin talent museum and submitted candidate profiles.",
}

export default async function Page() {
  const profiles = await loadTalentLibraryProfiles()
  return (
    <>
      <TopNav />
      <AccessGate route="/talent-library">
        <TalentLibraryPage initialProfiles={profiles} />
      </AccessGate>
    </>
  )
}
