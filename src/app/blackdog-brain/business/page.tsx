import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainTrackPage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Business Brain | BlackDog Brain",
  description: "Enterprise AI model evaluation workflows, workbenches, talent operations, QC, deployment, and model-ready delivery.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/business">
        <BlackDogBrainTrackPage trackId="business" />
      </AccessGate>
    </>
  );
}
