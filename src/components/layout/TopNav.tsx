"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentPlatformUser } from "@/components/auth/useCurrentPlatformUser";

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

export function TopNav() {
  const pathname = usePathname();
  const { user: platformUser, logout } = useCurrentPlatformUser();

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
          {platformUser ? (
            <button
              type="button"
              onClick={logout}
              className={`${navLinkClass("/login")} cursor-pointer`}
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className={navLinkClass("/login")}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
