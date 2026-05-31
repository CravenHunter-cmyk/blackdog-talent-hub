import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Personal Data Vault | Personal Brain",
  description: "Protect preferences, habits, feedback, history, and permission settings in a private data vault.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/personal/personal-data-vault">
        <BlackDogBrainModulePage trackId="personal" moduleId="personal-data-vault" />
      </AccessGate>
    </>
  );
}
