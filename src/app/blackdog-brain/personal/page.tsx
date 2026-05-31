import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainTrackPage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Personal Brain | BlackDog Brain",
  description: "Private AI assistants and personalized apps for individuals, lifestyle workflows, secure data vaults, and continuous optimization.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/personal">
        <BlackDogBrainTrackPage trackId="personal" />
      </AccessGate>
    </>
  );
}
