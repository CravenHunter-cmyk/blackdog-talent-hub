import type { Metadata } from "next";
import { BlackDogBrainProtectedContent } from "@/components/blackdog-brain/BlackDogBrainProtectedContent";
import { BlackDogBrainShell } from "@/components/blackdog-brain/BlackDogBrainShell";
import { BlackDogBrainTrackPage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Personal Brain | BlackDog Brain",
  description: "Private AI assistants and personalized apps for individuals, lifestyle workflows, secure data vaults, and continuous optimization.",
};

export default function Page() {
  return (
    <BlackDogBrainShell>
      <BlackDogBrainProtectedContent route="/blackdog-brain/personal">
        <BlackDogBrainTrackPage trackId="personal" />
      </BlackDogBrainProtectedContent>
    </BlackDogBrainShell>
  );
}
