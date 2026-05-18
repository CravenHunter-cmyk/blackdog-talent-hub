import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopNav } from "@/components/layout/TopNav";
import { BlackDogBrainPage } from "@/components/blackdog-brain/BlackDogBrainPage";
import { loadTalentLibraryProfiles } from "@/data/talentPoolStore";

export const metadata: Metadata = {
  title: "BlackDog Brain | BlackDog Talent Hub",
  description: "AI talent matching engine for client projects, talent profiles, and recruiting gaps.",
};

export default async function Page() {
  const profiles = await loadTalentLibraryProfiles();

  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain">
        <BlackDogBrainPage initialProfiles={profiles} />
      </AccessGate>
    </>
  );
}
