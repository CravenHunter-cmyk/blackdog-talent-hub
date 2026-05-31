import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopNav } from "@/components/layout/TopNav";
import { BlackDogToolsPage } from "@/components/tools/BlackDogToolsPage";

export const metadata: Metadata = {
  title: "BlackDog Tools | BlackDog Talent Hub",
  description: "Internal BlackDog tool library for link collection, data preparation, and resource operations.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/workspace/tools">
        <BlackDogToolsPage />
      </AccessGate>
    </>
  );
}
