import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainTabs } from "@/components/blackdog-brain/BlackDogBrainTabs";
import { BlackDogBrainTrackPage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Personal Brain | BlackDog Brain",
  description: "Private AI assistants and personalized apps for individuals, lifestyle workflows, secure data vaults, and continuous optimization.",
};

export default function Page() {
  return (
    <>
      <AccessGate route="/blackdog-brain/personal">
        <BlackDogBrainTabs />
        <BlackDogBrainTrackPage trackId="personal" />
      </AccessGate>
    </>
  );
}
