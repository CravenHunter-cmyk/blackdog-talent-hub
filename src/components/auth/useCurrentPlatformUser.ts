"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { persistMockUser, readPlatformUser, type PlatformUser } from "@/lib/permissions";

export function useCurrentPlatformUser() {
  const router = useRouter();
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        persistMockUser(null);
        setUser(null);
        return null;
      }
      const payload = await response.json();
      if (payload.user) {
        persistMockUser(payload.user);
        const nextUser = readPlatformUser();
        setUser(nextUser);
        return nextUser;
      }
      persistMockUser(null);
      setUser(null);
      return null;
    } catch {
      persistMockUser(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function handleStorageChange() {
      setUser(readPlatformUser());
    }

    queueMicrotask(() => {
      void refresh();
    });
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("blackdog-auth-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("blackdog-auth-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Local cleanup still runs if the network request fails.
    }
    persistMockUser(null);
    try {
      window.sessionStorage.clear();
    } catch {
      // Session storage may be unavailable in restricted browsers.
    }
    setUser(null);
    router.replace("/");
  }, [router]);

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    refresh,
    logout,
  };
}
