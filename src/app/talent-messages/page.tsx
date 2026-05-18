import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopNav } from "@/components/layout/TopNav";
import { TalentMessagesPage } from "@/components/talent-messages/TalentMessagesPage";
import { loadTalentLibraryProfiles } from "@/data/talentPoolStore";

export const metadata: Metadata = {
  title: "Talent Hub | BlackDog Talent Hub",
  description:
    "Publish internal recruiting tasks, coordinate with global talent, and manage task-related communication in one hub.",
};

type TalentMessagesPageSearchParams = {
  tab?: string | string[];
  taskId?: string | string[];
  taskName?: string | string[];
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function moduleFromTab(tab: string) {
  if (tab === "personal-center") return "personal-center";
  if (tab === "communication-hub") return "communication-hub";
  return undefined;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TalentMessagesPageSearchParams>;
}) {
  const query = await searchParams;
  const talentProfiles = await loadTalentLibraryProfiles();
  const initialTab = firstSearchParam(query.tab);
  return (
    <>
      <TopNav />
      <AccessGate route="/talent-messages" module={moduleFromTab(initialTab)}>
        <TalentMessagesPage
          initialTab={initialTab}
          initialTaskId={firstSearchParam(query.taskId)}
          initialTaskName={firstSearchParam(query.taskName)}
          initialTalentProfiles={talentProfiles}
        />
      </AccessGate>
    </>
  );
}
