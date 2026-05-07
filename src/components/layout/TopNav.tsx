"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readLoggedInSession } from "@/lib/currentUser";

const navItems = [
  { label: "Talent Map", href: "/" },
  { label: "Recruiting Workbench", href: "/recruiting" },
  { label: "BlackDog Talent Library", href: "/talent-library" },
  { label: "Talent Messages", href: "/talent-messages" },
  { label: "BlackDog Brain", href: "/blackdog-brain" },
  { label: "Users", href: "/users-permissions" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [, setSessionTick] = useState(0);
  const loggedInSession = readLoggedInSession();

  useEffect(() => {
    function handleStorage() {
      setSessionTick((value) => value + 1);
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function handleLogout() {
    window.localStorage.removeItem("blackdog_current_user");
    window.localStorage.removeItem("blackdogCurrentUser");
    window.localStorage.removeItem("blackdogCurrentUserV1");
    setSessionTick((value) => value + 1);
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#e2d8c8] bg-[#fbfaf6]/96 shadow-[0_8px_20px_rgba(31,41,51,0.05)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:gap-4">
        <div className="shrink-0">
          <div className="text-lg font-bold tracking-tight text-[#111827]">BlackDog Talent Hub</div>
          <div className="text-sm font-medium text-[#64748b]">Global native talent coverage</div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm text-[#6f6256] lg:ml-auto lg:flex-nowrap">
          {navItems.map((item) => (
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={
                  pathname === item.href
                    ? "whitespace-nowrap rounded-md border border-[#1f5c43] bg-[#1f5c43] px-2.5 py-2 font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                    : "whitespace-nowrap rounded-md px-2.5 py-2 font-medium hover:bg-[#f4efe2] hover:text-[#111827]"
                }
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="rounded-md px-3 py-2 font-medium hover:bg-[#f4efe2] hover:text-[#111827]"
              >
                {item.label}
              </span>
            )
          ))}
          {loggedInSession ? (
            <button
              type="button"
              onClick={handleLogout}
              className="whitespace-nowrap rounded-md border border-[#b42318] bg-[#fff1ef] px-2.5 py-2 text-xs font-semibold text-[#b42318] hover:bg-[#ffe7e3]"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className={
                pathname === "/login"
                  ? "whitespace-nowrap rounded-md border border-[#1f5c43] bg-[#1f5c43] px-2.5 py-2 font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                  : "whitespace-nowrap rounded-md px-2.5 py-2 font-medium hover:bg-[#f4efe2] hover:text-[#111827]"
              }
              aria-current={pathname === "/login" ? "page" : undefined}
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
