import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TalentMessagesPage } from "@/components/talent-messages/TalentMessagesPage";
import { WorkHubShell } from "@/components/workhub/WorkHubShell";
import { loadTalentLibraryProfiles } from "@/data/talentPoolStore";

export const metadata: Metadata = {
  title: "WorkHub | BlackDog Talent Hub",
  description: "One workspace for talent resources, project management, and sourcing operations.",
};

export default async function Page() {
  const talentProfiles = await loadTalentLibraryProfiles();

  return (
    <AccessGate route="/workhub">
      <WorkHubShell>
        <TalentMessagesPage initialTalentProfiles={talentProfiles} />
      </WorkHubShell>
    </AccessGate>
  );
}
