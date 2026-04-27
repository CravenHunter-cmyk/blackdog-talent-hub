"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Talent Map", href: "/" },
  { label: "Recruiting Workbench", href: "/recruiting" },
  { label: "Screening" },
  { label: "Intake Forms" },
  { label: "AI Assistant" },
  { label: "Settings" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#e2d8c8] bg-[#fbfaf6]/96 shadow-[0_8px_20px_rgba(31,41,51,0.05)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-lg font-bold tracking-tight text-[#111827]">BlackDog Talent Hub</div>
          <div className="text-sm font-medium text-[#64748b]">Global native talent coverage</div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm text-[#6f6256]">
          {navItems.map((item) => (
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={
                  pathname === item.href
                    ? "rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                    : "rounded-md px-3 py-2 font-medium hover:bg-[#f4efe2] hover:text-[#111827]"
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
          <span className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]">
            Login
          </span>
        </nav>
      </div>
    </header>
  );
}
