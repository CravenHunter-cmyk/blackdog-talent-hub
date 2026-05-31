import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Brain Studio | Business Brain",
  description: "PM and solution design workspace for translating client requirements into evaluation logic.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/business/brain-studio">
        <BlackDogBrainModulePage trackId="business" moduleId="brain-studio" />
      </AccessGate>
    </>
  );
}
