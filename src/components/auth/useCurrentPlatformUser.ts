"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { persistMockUser, readPlatformUser, type PlatformUser } from "@/lib/permissions";

const AUTH_CACHE_TTL_MS = 30_000;
let cachedUser: PlatformUser | null = null;
let cachedAt = 0;
let inFlightAuthRequest: Promise<PlatformUser | null> | null = null;

export async function loadCurrentPlatformUser({ force = false }: { force?: boolean } = {}) {
  const now = Date.now();
  if (!force && now - cachedAt < AUTH_CACHE_TTL_MS) return cachedUser;
  if (!force && inFlightAuthRequest) return inFlightAuthRequest;

  inFlightAuthRequest = fetch("/api/auth/me", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        persistMockUser(null);
        cachedUser = null;
        cachedAt = Date.now();
        return null;
      }
      const payload = await response.json();
      if (payload.user) {
        persistMockUser(payload.user);
        cachedUser = readPlatformUser();
        cachedAt = Date.now();
        return cachedUser;
      }
      persistMockUser(null);
      cachedUser = null;
      cachedAt = Date.now();
      return null;
    })
    .catch(() => {
      persistMockUser(null);
      cachedUser = null;
      cachedAt = Date.now();
      return null;
    })
    .finally(() => {
      inFlightAuthRequest = null;
    });

  return inFlightAuthRequest;
}

export function clearCurrentPlatformUserCache() {
  cachedUser = null;
  cachedAt = Date.now();
  inFlightAuthRequest = null;
}

export function useCurrentPlatformUser() {
  const router = useRouter();
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    setLoading(true);
    const nextUser = await loadCurrentPlatformUser({ force });
    setUser(nextUser);
    setHydrated(true);
    setLoading(false);
    return nextUser;
  }, []);

  useEffect(() => {
    function handleStorageChange() {
      const nextUser = readPlatformUser();
      cachedUser = nextUser;
      cachedAt = Date.now();
      setUser(nextUser);
      setHydrated(true);
    }

    queueMicrotask(() => {
      void refresh();
    });
    window.addEventListener("storage", handleStorageChange);
    const handleAuthChanged = () => {
      void refresh({ force: true });
    };
    window.addEventListener("blackdog-auth-changed", handleAuthChanged);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("blackdog-auth-changed", handleAuthChanged);
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Local cleanup still runs if the network request fails.
    }
    persistMockUser(null);
    clearCurrentPlatformUserCache();
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
    hydrated,
    loading,
    isAuthenticated: Boolean(user),
    refresh,
    logout,
  };
}
