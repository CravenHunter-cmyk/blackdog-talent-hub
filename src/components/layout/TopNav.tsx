"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BlackDogLogo } from "@/components/brand/BlackDogLogo";
import { useCurrentPlatformUser } from "@/components/auth/useCurrentPlatformUser";

const navItems = [
  { label: "Talent Map", href: "/talent-map" },
  { label: "BlackDog Brain", href: "/blackdog-brain" },
  { label: "BlackDog Talent Museum", href: "/talent-museum" },
  { label: "BlackDog Tools", href: "/blackdog-tools" },
  { label: "WorkHub", href: "/workhub" },
  { label: "BlackDog Platform", href: "/blackdog-platform" },
  { label: "Command", href: "/command" },
];

export function TopNav() {
  const pathname = usePathname();
  const { user: platformUser, hydrated, logout } = useCurrentPlatformUser();

  const isNavActive = (href: string) => {
    if (href === "/talent-map") return pathname === "/" || pathname === href || pathname.startsWith(`${href}/`);
    if (href === "/workhub") {
      return (
        pathname === href ||
        pathname.startsWith(`${href}/`) ||
        pathname.startsWith("/talent-hub") ||
        pathname.startsWith("/pm-hub") ||
        pathname.startsWith("/sourcing-hub") ||
        pathname.startsWith("/talent-messages") ||
        pathname.startsWith("/team-hub") ||
        pathname.startsWith("/recruiting")
      );
    }
    return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinkClass = (href: string) => {
    const isActive = isNavActive(href);

    return isActive
      ? "whitespace-nowrap rounded-md border border-[#1f5c43] bg-[#1f5c43] px-2 py-1.5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
      : "whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] font-medium text-[#6f6256] hover:bg-[#f4efe2] hover:text-[#111827]";
  };

  return (
    <header
      className="sticky top-0 z-50 border-b border-[#e2d8c8] shadow-[0_8px_20px_rgba(31,41,51,0.05)] backdrop-blur"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundImage: "linear-gradient(180deg, rgba(255, 252, 246, 0.88) 0%, rgba(255, 250, 240, 0.78) 100%)",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="page-shell flex h-[76px] flex-nowrap items-center gap-4 overflow-visible px-[clamp(24px,3vw,56px)] lg:px-[clamp(40px,4.5vw,88px)]">
        <Link href="/" className="inline-flex shrink-0 items-center text-decoration-none">
          <BlackDogLogo size="md" tone="default" />
        </Link>

        <nav className="scroll-x-panel ml-auto flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1 lg:pr-2">
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
          {hydrated && platformUser ? (
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
