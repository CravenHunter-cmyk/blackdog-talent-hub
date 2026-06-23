import type { ReactNode } from "react";
import { BlackDogBrainTabs } from "@/components/blackdog-brain/BlackDogBrainTabs";
import { TopNav } from "@/components/layout/TopNav";

export default function BlackDogBrainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      <BlackDogBrainTabs />
      {children}
    </>
  );
}
