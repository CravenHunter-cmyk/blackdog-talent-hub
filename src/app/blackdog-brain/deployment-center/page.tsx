import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Deployment Center | BlackDog Brain",
  description: "Hosted, client-side, API, security, and handover center for BlackDog Brain projects.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/deployment-center">
        <BlackDogBrainModulePage moduleId="deployment-center" />
      </AccessGate>
    </>
  );
}
