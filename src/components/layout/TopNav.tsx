"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  MOCK_PLATFORM_USERS,
  getServerPlatformUserSnapshot,
  persistMockUser,
  readPlatformUser,
} from "@/lib/permissions";

const navItems = [
  { label: "Talent Map", href: "/" },
  { label: "BlackDog Brain", href: "/blackdog-brain" },
  { label: "BlackDog Tools", href: "/workspace/tools" },
  { label: "BlackDog Talent Museum", href: "/talent-library" },
  { label: "Talent Hub", href: "/talent-messages" },
  { label: "PM Hub", href: "/team-hub" },
  { label: "Sourcing Hub", href: "/recruiting" },
  { label: "Command", href: "/settings" },
];

function subscribePlatformUser(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const platformUser = useSyncExternalStore(
    subscribePlatformUser,
    readPlatformUser,
    getServerPlatformUserSnapshot,
  );
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const mockAccountSelectValue =
    MOCK_PLATFORM_USERS.find((user) => user?.id === platformUser?.id || user?.role === platformUser?.role)?.id || "logged-out";

  useEffect(() => {
    async function refreshServerSession() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          if (process.env.NODE_ENV !== "development") persistMockUser(null);
          return;
        }
        const payload = await response.json();
        if (payload.user) persistMockUser(payload.user);
      } catch {
        if (process.env.NODE_ENV !== "development") persistMockUser(null);
        // Client-side navigation can continue with the local snapshot.
      }
    }
    refreshServerSession();
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Local cleanup still runs if the network request fails.
    }
    persistMockUser(null);
    router.replace("/login");
  }

  function handleMockUserChange(userId: string) {
    const nextUser = MOCK_PLATFORM_USERS.find((user) => (user?.id || "logged-out") === userId) || null;
    persistMockUser(nextUser);
  }

  const isNavActive = (href: string) => (href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const navLinkClass = (href: string) => {
    const isActive = isNavActive(href);

    return isActive
      ? "whitespace-nowrap rounded-md border border-[#1f5c43] bg-[#1f5c43] px-2 py-1.5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
      : "whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] font-medium text-[#6f6256] hover:bg-[#f4efe2] hover:text-[#111827]";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#e2d8c8] bg-[#fbfaf6]/96 shadow-[0_8px_20px_rgba(31,41,51,0.05)] backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1600px] flex-nowrap items-center gap-4 px-[clamp(16px,2.5vw,40px)]">
        <div className="w-[210px] shrink-0">
          <div className="whitespace-nowrap text-base font-bold tracking-tight text-[#111827]">BlackDog Talent Hub</div>
          <div className="whitespace-nowrap text-xs font-medium text-[#64748b]">Global native talent network</div>
        </div>

        <nav className="scroll-x-panel ml-auto flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isNavActive(item.href) ? "page" : undefined}
              className={navLinkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              className={navLinkClass("/login")}
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
            >
              {platformUser ? "Account" : "Login"}
            </button>

            {accountMenuOpen ? (
              <div className="absolute right-0 top-full z-[70] mt-3 w-[260px] rounded-xl border border-[#e4d7c6] bg-[#fffdf8] p-3 text-left shadow-[0_18px_45px_rgba(31,41,51,0.16)]">
                {process.env.NODE_ENV === "development" ? (
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a6a2b]">Dev only</div>
                ) : null}
                <div className="mt-2 text-sm font-bold text-[#111827]">
                  {platformUser ? `Current: ${platformUser.name}` : "Current: Logged out"}
                </div>
                <div className="mt-1 text-xs font-medium text-[#6f6256]">
                  {platformUser ? platformUser.role : "No mock account selected"}
                </div>

                {process.env.NODE_ENV === "development" ? (
                  <label className="mt-4 block">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f6256]">Switch Mock Account</span>
                    <select
                      value={mockAccountSelectValue}
                      onChange={(event) => handleMockUserChange(event.target.value)}
                      className="mt-2 h-9 w-full rounded-md border border-[#d7dccf] bg-white px-2 text-xs font-semibold text-[#40372f] outline-none"
                      aria-label="Mock account switcher"
                    >
                      {MOCK_PLATFORM_USERS.map((user) => (
                        <option key={user?.id || "logged-out"} value={user?.id || "logged-out"}>
                          {user ? `${user.name} · ${user.role}` : "Logged out"}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <div className="mt-4 grid gap-2 border-t border-[#eadfcd] pt-3">
                  <Link
                    href="/login"
                    onClick={() => setAccountMenuOpen(false)}
                    className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Login
                  </Link>
                  {platformUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        handleLogout();
                      }}
                      className="rounded-md border border-[#b42318] bg-[#fff1ef] px-3 py-2 text-sm font-semibold text-[#b42318]"
                    >
                      Logout
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
