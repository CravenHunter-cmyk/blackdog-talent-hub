import type { ReactNode } from "react";
import { BlackDogPlatformTabs } from "@/components/blackdog-platform/BlackDogPlatformTabs";
import { TopNav } from "@/components/layout/TopNav";

export default function BlackDogPlatformLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      <BlackDogPlatformTabs />
      {children}
    </>
  );
}
