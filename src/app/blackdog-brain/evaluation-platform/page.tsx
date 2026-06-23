import type { Metadata } from "next";
import { BlackDogBrainProtectedContent } from "@/components/blackdog-brain/BlackDogBrainProtectedContent";
import { BlackDogBrainShell } from "@/components/blackdog-brain/BlackDogBrainShell";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";

export const metadata: Metadata = {
  title: "Evaluation Platform | BlackDog Brain",
  description: "Reusable templates for multimodal AI data evaluation.",
};

export default function Page() {
  return (
    <BlackDogBrainShell>
      <BlackDogBrainProtectedContent route="/blackdog-brain/evaluation-platform">
        <BrainComingSoon />
      </BlackDogBrainProtectedContent>
    </BlackDogBrainShell>
  );
}
