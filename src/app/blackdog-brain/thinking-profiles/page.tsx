import type { Metadata } from "next";
import { BlackDogBrainProtectedContent } from "@/components/blackdog-brain/BlackDogBrainProtectedContent";
import { BlackDogBrainShell } from "@/components/blackdog-brain/BlackDogBrainShell";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";

export const metadata: Metadata = {
  title: "Thinking Profiles | BlackDog Brain",
  description: "The structured memory layer behind personalized AI tools.",
};

export default function Page() {
  return (
    <BlackDogBrainShell>
      <BlackDogBrainProtectedContent route="/blackdog-brain/thinking-profiles">
        <BrainComingSoon />
      </BlackDogBrainProtectedContent>
    </BlackDogBrainShell>
  );
}
