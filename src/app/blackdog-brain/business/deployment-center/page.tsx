import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Deployment Center | Business Brain",
  description: "Hosted, client-side, API, security, and handover center for Business Brain projects.",
};

export default function Page() {
  return (
    <>
      <AccessGate route="/blackdog-brain/business/deployment-center">
        <BlackDogBrainModulePage trackId="business" moduleId="deployment-center" />
      </AccessGate>
    </>
  );
}
