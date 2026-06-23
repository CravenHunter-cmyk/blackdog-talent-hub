import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Private App Builder | Personal Brain",
  description: "Build private AI app interfaces around individual needs, context, and daily use.",
};

export default function Page() {
  return (
    <>
      <AccessGate route="/blackdog-brain/personal/private-app-builder">
        <BlackDogBrainModulePage trackId="personal" moduleId="private-app-builder" />
      </AccessGate>
    </>
  );
}
