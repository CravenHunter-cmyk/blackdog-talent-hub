import type { Metadata } from "next";
import { BlackDogBrainTabs } from "@/components/blackdog-brain/BlackDogBrainTabs";
import { BlackDogBrainHome } from "@/components/blackdog-brain/BlackDogBrainWorkspace";

export const metadata: Metadata = {
  title: "Overview | BlackDog Brain",
  description: "Overview landing page for BlackDog Brain, the total brain for turning human needs into dedicated AI tools.",
};

export default function Page() {
  return (
    <>
      <BlackDogBrainTabs />
      <BlackDogBrainHome />
    </>
  );
}
