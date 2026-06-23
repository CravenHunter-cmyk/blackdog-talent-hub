import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainShell } from "@/components/blackdog-brain/BlackDogBrainShell";
import { BlackDogBrainTrackPage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Business Brain | BlackDog Brain",
  description: "Enterprise AI model evaluation workflows, workbenches, talent operations, QC, deployment, and model-ready delivery.",
};

export default function Page() {
  return (
    <BlackDogBrainShell>
      <AccessGate route="/blackdog-brain/business">
        <BlackDogBrainTrackPage trackId="business" />
      </AccessGate>
    </BlackDogBrainShell>
  );
}
