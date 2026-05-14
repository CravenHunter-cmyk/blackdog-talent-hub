import type { Metadata } from "next";
import { TopNav } from "@/components/layout/TopNav";
import { TalentMessagesPage } from "@/components/talent-messages/TalentMessagesPage";

export const metadata: Metadata = {
  title: "Talent Workbench | BlackDog Talent Hub",
  description:
    "Publish internal recruiting tasks, coordinate with global talent, and manage task-related communication in one workspace.",
};

type TalentMessagesPageSearchParams = {
  tab?: string | string[];
  taskId?: string | string[];
  taskName?: string | string[];
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TalentMessagesPageSearchParams>;
}) {
  const query = await searchParams;
  return (
    <>
      <TopNav />
      <TalentMessagesPage
        initialTab={firstSearchParam(query.tab)}
        initialTaskId={firstSearchParam(query.taskId)}
        initialTaskName={firstSearchParam(query.taskName)}
      />
    </>
  );
}
