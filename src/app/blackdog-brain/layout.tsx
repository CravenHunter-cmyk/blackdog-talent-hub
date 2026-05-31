import { headers } from "next/headers";
import type { ReactNode } from "react";
import { BrainComingSoon } from "@/components/brain/BrainComingSoon";
import { TopNav } from "@/components/layout/TopNav";

function isLocalHost(host: string) {
  const normalizedHost = host.toLowerCase();
  if (normalizedHost.startsWith("[::1]") || normalizedHost === "::1") return true;
  const hostname = normalizedHost.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export default async function BlackDogBrainLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
  const isLocalDevelopment = process.env.NODE_ENV === "development" || isLocalHost(host);

  if (isLocalDevelopment) {
    return children;
  }

  return (
    <>
      <TopNav />
      <BrainComingSoon />
    </>
  );
}
