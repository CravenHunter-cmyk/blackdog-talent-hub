import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainTabs } from "@/components/blackdog-brain/BlackDogBrainTabs";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";

export const metadata: Metadata = {
  title: "Evaluation Platform | BlackDog Brain",
  description: "Reusable templates for multimodal AI data evaluation.",
};

export default function Page() {
  return (
    <>
      <AccessGate route="/blackdog-brain/evaluation-platform">
        <BlackDogBrainTabs />
        <BrainComingSoon />
      </AccessGate>
    </>
  );
}
