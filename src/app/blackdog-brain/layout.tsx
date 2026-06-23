import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/TopNav";

export default function BlackDogBrainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}
