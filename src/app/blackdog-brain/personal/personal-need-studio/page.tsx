import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Personal Need Studio | Personal Brain",
  description: "Understand personal needs, life scenarios, habits, goals, and privacy boundaries.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/personal/personal-need-studio">
        <BlackDogBrainModulePage trackId="personal" moduleId="personal-need-studio" />
      </AccessGate>
    </>
  );
}
