import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TeamHubPage } from "@/components/team-hub/TeamHubPage";
import { WorkHubShell } from "@/components/workhub/WorkHubShell";

export const metadata: Metadata = {
  title: "PM Hub | WorkHub",
  description: "Explore BlackDog delivery management teams, manager profiles, and project groups.",
};

export default function Page() {
  return (
    <AccessGate route="/workhub/pm-hub">
      <WorkHubShell>
        <TeamHubPage />
      </WorkHubShell>
    </AccessGate>
  );
}
