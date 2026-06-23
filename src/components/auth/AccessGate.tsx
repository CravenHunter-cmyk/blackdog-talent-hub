"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
      className="relative min-h-[calc(100vh-88px)] overflow-hidden bg-[#030712] px-5 py-10 sm:px-8 lg:px-12"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(0, 7, 14, 0.84) 0%, rgba(0, 12, 20, 0.66) 38%, rgba(0, 10, 18, 0.28) 70%, rgba(0, 8, 15, 0.12) 100%), linear-gradient(180deg, rgba(0, 7, 14, 0.10) 0%, rgba(0, 8, 15, 0.48) 100%), url('/images/blackdog-brain-coming-soon.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_21%_60%,rgba(88,120,150,0.07),transparent_31%),linear-gradient(90deg,rgba(0,12,18,0.18),transparent_56%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#000711]/60 to-transparent" />

      <section className="relative mx-auto flex min-h-[calc(100vh-168px)] max-w-7xl items-end pb-[clamp(72px,15vh,140px)] pt-[clamp(96px,14vh,150px)]">
        <div className="max-w-[590px] pb-[clamp(10px,3vh,34px)] sm:ml-[clamp(8px,4vw,74px)]">
          <h1 className="max-w-2xl text-[clamp(2.6rem,5vw,4.55rem)] font-semibold leading-[0.95] tracking-[-0.015em] text-[#f5f7fa] drop-shadow-[0_3px_15px_rgba(0,0,0,0.50)]">
            Coming Soon
          </h1>
          <p className="mt-5 max-w-xl text-[clamp(1.05rem,1.7vw,1.45rem)] font-medium leading-7 text-[#e8eef5] drop-shadow-[0_2px_10px_rgba(0,0,0,0.42)]">
            Personalized AI tools, shaped by individual thinking profiles.
          </p>
          <p className="mt-4 max-w-[540px] text-sm font-normal leading-6 text-[#c8d2dd] drop-shadow-[0_2px_9px_rgba(0,0,0,0.42)] sm:text-base sm:leading-7">
            BlackDog creates tailored AI workspaces for clients, teams, and individuals — turning unique needs, context, and habits into dedicated AI apps for work, communication, decision-making, and delivery.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/" className="inline-flex min-w-36 items-center justify-center rounded-md border border-[#17634f] bg-[#083f35] px-4 py-2 text-xs font-semibold text-[#f4faf7] shadow-[0_12px_24px_rgba(0,0,0,0.30)] transition hover:bg-[#0c5244]">
              Back to Talent Map
            </Link>
            {isAccessRequired || isToolRoute ? (
              <Link href="/login" className="inline-flex min-w-20 items-center justify-center rounded-md border border-[#d8e4ef]/30 bg-[#030912]/68 px-4 py-2 text-xs font-semibold text-[#e5edf5] shadow-[0_12px_24px_rgba(0,0,0,0.24)] backdrop-blur-sm transition hover:bg-[#07131f]/78">
                Login
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginRedirect({ route }: { route: string }) {
  const router = useRouter();

  useEffect(() => {
    const redirectTarget = route || "/";
    router.replace(`/login?redirect=${redirectTarget}`);
  }, [route, router]);

  return null;
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
  if (fallback === "access-required") return <LoginRedirect route={route} />;
  return <PermissionFallback type={fallback === "allowed" ? "no-permission" : fallback} route={route} />;
}
