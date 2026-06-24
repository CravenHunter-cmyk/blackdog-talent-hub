"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const platformTabItems = [
  { label: "Audio Annotation Platform", href: "/blackdog-platform/audio-annotation" },
  { label: "Evaluation Platform", href: "/blackdog-platform/evaluation" },
];

export function BlackDogPlatformTabs() {
  const pathname = usePathname();

  return (
    <section
      aria-label="BlackDog Platform sections"
      className="sticky top-[76px] z-40 border-b border-[#dfe8df] bg-[#f6fbf4]/94 shadow-[0_10px_24px_rgba(31,41,51,0.04)] backdrop-blur"
      data-platform-subnav="true"
      style={{
        position: "sticky",
        top: 76,
        zIndex: 40,
      }}
    >
      <div className="page-shell flex min-h-[66px] items-center justify-center py-3">
        <nav className="scroll-x-panel flex w-fit max-w-full flex-nowrap items-center gap-2 rounded-full border border-[#cddccb] bg-white/92 p-1.5 shadow-[0_16px_36px_rgba(31,41,51,0.09)] backdrop-blur">
          {platformTabItems.map((item) => {
            const isAudioRoot = item.href === "/blackdog-platform/audio-annotation";
            const isActive = isAudioRoot
              ? pathname === "/blackdog-platform" || pathname === item.href || pathname.startsWith(`${item.href}/`)
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "whitespace-nowrap rounded-full bg-[#1f5c43] px-4 py-2 text-xs font-bold text-white shadow-[0_10px_20px_rgba(31,92,67,0.18)]"
                    : "whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-[#66725f] transition hover:bg-[#edf6ea] hover:text-[#111827]"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
