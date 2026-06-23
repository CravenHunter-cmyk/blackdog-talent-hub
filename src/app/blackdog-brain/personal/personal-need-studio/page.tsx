import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Personal Need Studio | Personal Brain",
  description: "Understand personal needs, life scenarios, habits, goals, and privacy boundaries.",
};

export default function Page() {
  return (
    <>
      <AccessGate route="/blackdog-brain/personal/personal-need-studio">
        <BlackDogBrainModulePage trackId="personal" moduleId="personal-need-studio" />
      </AccessGate>
    </>
  );
}
