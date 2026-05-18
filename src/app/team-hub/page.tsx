import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopNav } from "@/components/layout/TopNav";
import { TeamHubPage } from "@/components/team-hub/TeamHubPage";

export const metadata: Metadata = {
  title: "PM Hub | BlackDog Talent Hub",
  description: "Explore BlackDog delivery management teams, manager profiles, and project groups.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/team-hub">
        <TeamHubPage />
      </AccessGate>
    </>
  );
}
