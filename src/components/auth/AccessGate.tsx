"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { loadCurrentPlatformUser } from "@/components/auth/useCurrentPlatformUser";
import { canAccessModule, readPlatformUser, routeFallbackType, type PlatformUser } from "@/lib/permissions";

type AccessGateProps = {
  route: string;
  module?: string;
  children: ReactNode;
  noPermissionFallback?: ReactNode;
};

export function PermissionFallback({ type, route }: { type: "access-required" | "no-permission"; route?: string }) {
  const isAccessRequired = type === "access-required";
  const isToolRoute = Boolean(route?.startsWith("/workspace/tools"));

  return (
    <main
      className="relative min-h-[calc(100vh-88px)] overflow-hidden bg-[#16110d] px-5 py-10 sm:px-8 lg:px-12"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(18, 13, 10, 0.46) 0%, rgba(31, 22, 16, 0.28) 38%, rgba(22, 17, 13, 0.08) 70%, rgba(22, 17, 13, 0.04) 100%), linear-gradient(180deg, rgba(20, 14, 10, 0.08) 0%, rgba(18, 13, 10, 0.20) 100%), url('/images/blackdog-brain-coming-soon.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_21%_58%,rgba(221,178,113,0.12),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,244,218,0.05),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#120d0a]/28 to-transparent" />

      <section className="relative mx-auto flex min-h-[calc(100vh-168px)] max-w-7xl items-end pb-[clamp(72px,15vh,140px)] pt-[clamp(96px,14vh,150px)]">
        <div className="max-w-[590px] pb-[clamp(10px,3vh,34px)] sm:ml-[clamp(8px,4vw,74px)]">
          <h1 className="max-w-2xl text-[clamp(2.6rem,5vw,4.55rem)] font-semibold leading-[0.95] tracking-[-0.015em] text-[#ead6af] drop-shadow-[0_2px_10px_rgba(0,0,0,0.30)]">
            Coming Soon
          </h1>
          <p className="mt-5 max-w-xl text-[clamp(1.05rem,1.7vw,1.45rem)] font-medium leading-7 text-[#f2e6d1] drop-shadow-[0_2px_8px_rgba(0,0,0,0.26)]">
            Personalized AI tools, shaped by individual thinking profiles.
          </p>
          <p className="mt-4 max-w-[540px] text-sm font-normal leading-6 text-[#dfcfb6] drop-shadow-[0_2px_7px_rgba(0,0,0,0.24)] sm:text-base sm:leading-7">
            BlackDog creates tailored AI workspaces for clients, teams, and individuals — turning unique needs, context, and habits into dedicated AI apps for work, communication, decision-making, and delivery.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/" className="inline-flex min-w-36 items-center justify-center rounded-full border border-[#ead6af]/32 bg-[#ead6af]/10 px-4 py-2 text-xs font-medium text-[#f2e6d1] shadow-[0_8px_20px_rgba(0,0,0,0.14)] backdrop-blur-sm transition hover:bg-[#ead6af]/16">
              Back to Talent Map
            </Link>
            {isAccessRequired || isToolRoute ? (
              <Link href="/login" className="inline-flex min-w-20 items-center justify-center rounded-full border border-[#f2e6d1]/24 bg-[#f2e6d1]/8 px-4 py-2 text-xs font-medium text-[#ead6af] shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm transition hover:bg-[#f2e6d1]/13">
                Login
              </Link>
            ) : null}
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
