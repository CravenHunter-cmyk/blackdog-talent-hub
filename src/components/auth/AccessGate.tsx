"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { loadCurrentPlatformUser } from "@/components/auth/useCurrentPlatformUser";
import { canAccessModule, isClient, readPlatformUser, routeFallbackType, type PlatformUser } from "@/lib/permissions";

type AccessGateProps = {
  route: string;
  module?: string;
  children: ReactNode;
  noPermissionFallback?: ReactNode;
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
    <main className="relative flex min-h-[calc(100vh-88px)] items-start justify-center overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(31,92,67,0.14),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(154,106,53,0.13),transparent_24%),linear-gradient(180deg,#fbf7ef_0%,#efe6d8_100%)] px-5 pb-20 pt-[clamp(74px,10vh,118px)] text-[#111827]">
      <div className="pointer-events-none absolute left-[8%] top-[18%] hidden h-28 w-28 rounded-[34px] border border-white/70 bg-white/35 shadow-[0_24px_60px_rgba(31,41,51,0.10)] backdrop-blur md:block" />
      <div className="pointer-events-none absolute bottom-[16%] right-[10%] hidden h-36 w-36 rounded-full border border-[#e4d7c6]/70 bg-[#fff8eb]/55 shadow-[0_24px_60px_rgba(31,41,51,0.08)] md:block" />

      <section className="relative grid w-full max-w-[880px] overflow-hidden rounded-[34px] border border-[#e4d7c6] bg-[#fffdf8] shadow-[0_32px_90px_rgba(31,41,51,0.20)] lg:grid-cols-[0.42fr_0.58fr]">
        <div className="relative min-h-[280px] border-b border-[#eadfcd] bg-[linear-gradient(145deg,#f4eadc_0%,#fff8eb_56%,#edf8f1_100%)] p-7 lg:border-b-0 lg:border-r">
          <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-[#c8b79f] to-transparent" />
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex rounded-full border border-[#d7cec0] bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#9a6a35]">
                Protected Workspace
              </div>
              <div className="mt-8 flex h-28 w-28 items-center justify-center overflow-hidden rounded-[30px] border border-[#e4d7c6] bg-white shadow-[0_18px_38px_rgba(31,41,51,0.18)]">
                <Image src="/blackdog-mascot.jpg" alt="BlackDog mascot" width={112} height={112} className="h-full w-full object-cover" priority />
              </div>
            </div>
            <div className="mt-8 rounded-2xl border border-white/80 bg-white/65 p-4 shadow-[0_14px_34px_rgba(31,41,51,0.08)] backdrop-blur">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1f5c43]">BlackDog Talent Hub</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#4b4037]">
                Workspace access is reserved for authorized platform accounts.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-10 sm:px-12 sm:py-12">
          <div className="inline-flex rounded-full border border-[#d7cec0] bg-[#fbfaf6] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#6f6256]">
            BlackDog Talent Hub · Protected Workspace
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-[#111827] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-[500px] text-base font-semibold leading-7 text-[#40372f]">
            {description}
          </p>
          {helperText ? (
            <p className="mt-4 max-w-[500px] rounded-xl border border-[#eadfcd] bg-[#fbfaf6] px-4 py-3 text-sm font-semibold leading-6 text-[#6f6256]">{helperText}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center gap-3">
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
        </div>
      </section>
    </main>
  );
}

export function AccessGate({ route, module, children, noPermissionFallback }: AccessGateProps) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function refresh() {
      const nextUser = await loadCurrentPlatformUser();
      setUser(nextUser || (process.env.NODE_ENV === "development" ? readPlatformUser() : null));
      setReady(true);
    }
    function handleStorageChange() {
      setUser(readPlatformUser());
      setReady(true);
    }
    void refresh();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (!ready) return null;

  const fallback = routeFallbackType(user, route);
  if (fallback === "allowed" && (!module || canAccessModule(user, module))) return <>{children}</>;
  if (fallback === "no-permission" && noPermissionFallback) return <>{noPermissionFallback}</>;
  return <PermissionFallback type={fallback === "allowed" ? "no-permission" : fallback} route={route} />;
}
