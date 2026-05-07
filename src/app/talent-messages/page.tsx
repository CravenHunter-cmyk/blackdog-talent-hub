import type { Metadata } from "next";
import { TopNav } from "@/components/layout/TopNav";
import { TalentMessagesPage } from "@/components/talent-messages/TalentMessagesPage";

export const metadata: Metadata = {
  title: "Talent Messages | BlackDog Talent Hub",
  description: "Communicate with Talent Library profiles through direct messages, project groups, and language groups.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <TalentMessagesPage />
    </>
  );
}
