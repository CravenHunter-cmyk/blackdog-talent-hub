import type { Metadata } from "next";
import { BlackDogBrainProtectedContent } from "@/components/blackdog-brain/BlackDogBrainProtectedContent";
import { BlackDogBrainShell } from "@/components/blackdog-brain/BlackDogBrainShell";
import { BlackDogBrainTrackPage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Business Brain | BlackDog Brain",
  description: "Enterprise AI model evaluation workflows, workbenches, talent operations, QC, deployment, and model-ready delivery.",
};

export default function Page() {
  return (
    <BlackDogBrainShell>
      <BlackDogBrainProtectedContent route="/blackdog-brain/business">
        <BlackDogBrainTrackPage trackId="business" />
      </BlackDogBrainProtectedContent>
    </BlackDogBrainShell>
  );
}
