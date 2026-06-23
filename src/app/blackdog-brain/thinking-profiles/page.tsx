import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainTabs } from "@/components/blackdog-brain/BlackDogBrainTabs";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";

export const metadata: Metadata = {
  title: "Thinking Profiles | BlackDog Brain",
  description: "The structured memory layer behind personalized AI tools.",
};

export default function Page() {
  return (
    <>
      <AccessGate route="/blackdog-brain/thinking-profiles">
        <BlackDogBrainTabs />
        <BrainComingSoon />
      </AccessGate>
    </>
  );
}
