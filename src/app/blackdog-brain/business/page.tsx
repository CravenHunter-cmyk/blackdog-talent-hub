import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainTabs } from "@/components/blackdog-brain/BlackDogBrainTabs";
import { BlackDogBrainTrackPage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Business Brain | BlackDog Brain",
  description: "Enterprise AI model evaluation workflows, workbenches, talent operations, QC, deployment, and model-ready delivery.",
};

export default function Page() {
  return (
    <>
      <AccessGate route="/blackdog-brain/business">
        <BlackDogBrainTabs />
        <BlackDogBrainTrackPage trackId="business" />
      </AccessGate>
    </>
  );
}
