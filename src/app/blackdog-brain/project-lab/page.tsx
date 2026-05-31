import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogBrainModulePage } from "@/components/blackdog-brain/BlackDogBrainWorkspace";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "Project Lab | BlackDog Brain",
  description: "Project builder for workbenches, pilots, calibration, and launch-ready workflows.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/blackdog-brain/project-lab">
        <BlackDogBrainModulePage moduleId="project-lab" />
      </AccessGate>
    </>
  );
}
