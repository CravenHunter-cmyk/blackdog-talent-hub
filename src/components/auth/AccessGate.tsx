"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { canAccessModule, isClient, readPlatformUser, routeFallbackType, type PlatformUser } from "@/lib/permissions";

type AccessGateProps = {
  route: string;
  module?: string;
  children: ReactNode;
};

export function PermissionFallback({ type, route }: { type: "access-required" | "no-permission"; route?: string }) {
  const router = useRouter();
  const isAccessRequired = type === "access-required";
  const [user, setUser] = useState<PlatformUser | null>(null);
  const clientBlocked = !isAccessRequired && isClient(user);
  const isToolRoute = Boolean(route?.startsWith("/workspace/tools/"));
  const title = isAccessRequired ? "Access Required" : isToolRoute ? "No Tool Access" : "No Permission";
  const description = isAccessRequired
    ? isToolRoute
      ? "Sign in required to use this tool."
      : "Please log in with an authorized BlackDog account to access this workspace."
    : clientBlocked
      ? "Client accounts are read-only and cannot access personal workspaces, internal communication, or system command."
      : isToolRoute
        ? "You do not have access to this tool. Contact your administrator to request access."
        : "Your current account does not have permission to access this workspace.";
  const helperText = isAccessRequired ? "Need access? Please contact the BlackDog team." : "";

  useEffect(() => {
    function refresh() {
      setUser(readPlatformUser());
    }
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  return (
    <main className="flex min-h-[calc(100vh-88px)] items-start justify-center bg-[radial-gradient(circle_at_center,rgba(31,92,67,0.10),transparent_32%),linear-gradient(180deg,#f8f3ea_0%,#efe6d8_100%)] px-5 pb-20 pt-[clamp(80px,12vh,140px)] text-[#111827]">
      <section className="w-full max-w-[660px] rounded-[30px] border border-[#e4d7c6] bg-[#fffdf8] px-8 py-12 text-center shadow-[0_30px_90px_rgba(31,41,51,0.22)] sm:px-14">
        <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-[#e4d7c6] bg-[#f6f0e6] shadow-[0_14px_32px_rgba(31,41,51,0.16)]">
          <Image src="/blackdog-mascot.jpg" alt="BlackDog mascot" width={96} height={96} className="h-full w-full object-cover" priority />
        </div>
        <h1 className="mt-7 text-3xl font-black tracking-tight text-[#111827]">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-[420px] text-base font-semibold leading-7 text-[#40372f]">
          {description}
        </p>
        {helperText ? (
          <p className="mx-auto mt-3 max-w-[420px] text-sm leading-6 text-[#6f6256]">{helperText}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isAccessRequired ? (
            <>
              <Link href="/login" className="inline-flex min-w-28 items-center justify-center rounded-md border border-[#1f5c43] bg-[#1f5c43] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(31,92,67,0.18)]">Login</Link>
              <Link href="/" className="inline-flex min-w-40 items-center justify-center rounded-md border border-[#d7cec0] bg-white px-5 py-2.5 text-sm font-semibold text-[#4b5563]">Back to Talent Map</Link>
            </>
          ) : (
            <>
              <button type="button" onClick={() => router.back()} className="inline-flex min-w-24 items-center justify-center rounded-md border border-[#d7cec0] bg-white px-5 py-2.5 text-sm font-semibold text-[#4b5563]">Back</button>
              <Link href="/talent-messages" className="inline-flex min-w-40 items-center justify-center rounded-md border border-[#1f5c43] bg-[#1f5c43] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(31,92,67,0.18)]">Go to My Workspace</Link>
              <button type="button" className="inline-flex min-w-32 items-center justify-center rounded-md border border-[#d7cec0] bg-white px-5 py-2.5 text-sm font-semibold text-[#4b5563]">Contact Admin</button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export function AccessGate({ route, module, children }: AccessGateProps) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function refresh() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const payload = await response.json();
          setUser(payload.user || (process.env.NODE_ENV === "development" ? readPlatformUser() : null));
          setReady(true);
          return;
        }
      } catch {
        // Fall back to the local development snapshot.
      }
      setUser(process.env.NODE_ENV === "development" ? readPlatformUser() : null);
      setReady(true);
    }
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  if (!ready) return null;

  const fallback = routeFallbackType(user, route);
  if (fallback === "allowed" && (!module || canAccessModule(user, module))) return <>{children}</>;
  return <PermissionFallback type={fallback === "allowed" ? "no-permission" : fallback} route={route} />;
}
