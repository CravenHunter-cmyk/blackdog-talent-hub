"use client";

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
    <main
      className="relative flex min-h-[calc(100vh-88px)] items-center justify-center overflow-hidden bg-[#111827] px-5 py-[clamp(74px,10vh,118px)] text-[#111827]"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(17, 24, 39, 0.76), rgba(31, 92, 67, 0.58) 48%, rgba(154, 106, 53, 0.46)), url('/images/blackdog-access-bg.jpeg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.20),transparent_26%),radial-gradient(circle_at_82%_20%,rgba(245,197,129,0.18),transparent_28%),linear-gradient(180deg,rgba(17,24,39,0.14),rgba(17,24,39,0.34))] backdrop-blur-[1px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#111827]/55 to-transparent" />

      <section className="relative w-full max-w-[760px] overflow-hidden rounded-[34px] border border-white/30 bg-[#fffdf8]/90 px-8 py-10 shadow-[0_32px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:px-12 sm:py-12">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <div className="relative">
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
          <div className="mt-5 rounded-2xl border border-[#eadfcd] bg-white/70 p-4 shadow-[0_14px_34px_rgba(31,41,51,0.08)]">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1f5c43]">Protected Workspace</div>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#4b4037]">
              Workspace access is reserved for authorized BlackDog platform accounts.
            </p>
          </div>
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
