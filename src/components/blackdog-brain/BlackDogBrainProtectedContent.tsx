"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PermissionFallback } from "@/components/auth/AccessGate";
import { loadCurrentPlatformUser } from "@/components/auth/useCurrentPlatformUser";
import { canAccessModule, readPlatformUser, routeFallbackType, type PlatformUser } from "@/lib/permissions";

type BlackDogBrainProtectedContentProps = {
  route: string;
  module?: string;
  children: ReactNode;
  noPermissionFallback?: ReactNode;
};

export function BlackDogBrainProtectedContent({
  route,
  module,
  children,
  noPermissionFallback,
}: BlackDogBrainProtectedContentProps) {
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

  return (
    <PermissionFallback
      type={fallback === "allowed" ? "no-permission" : fallback}
      route={route}
    />
  );
}
