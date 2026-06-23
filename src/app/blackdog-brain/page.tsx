import type { Metadata } from "next";
import { BlackDogBrainOverview } from "@/components/blackdog-brain/BlackDogBrainOverview";

export const metadata: Metadata = {
  title: "Overview | BlackDog Brain",
  description: "Overview landing page for BlackDog Brain, the total brain for turning human needs into dedicated AI tools.",
};

export default function Page() {
  return <BlackDogBrainOverview />;
}
