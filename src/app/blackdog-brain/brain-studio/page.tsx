import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Brain Studio | BlackDog Brain",
  description: "PM and solution design workspace for translating client requirements into evaluation logic.",
};

export default function Page() {
  return (
    <>
      <AccessGate route="/blackdog-brain/brain-studio">
        <BlackDogBrainModulePage moduleId="brain-studio" />
      </AccessGate>
    </>
  );
}
