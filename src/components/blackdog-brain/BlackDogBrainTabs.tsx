"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const brainTabItems = [
  { label: "Overview", href: "/blackdog-brain" },
  { label: "Business Brain", href: "/blackdog-brain/business" },
  { label: "Personal Brain", href: "/blackdog-brain/personal" },
  { label: "Evaluation Platform", href: "/blackdog-brain/evaluation-platform" },
  { label: "Thinking Profiles", href: "/blackdog-brain/thinking-profiles" },
];

export function BlackDogBrainTabs() {
  const pathname = usePathname();

  return (
    <section
      aria-label="BlackDog Brain sections"
      className="sticky top-[76px] z-40 border-b border-[#eadfce] bg-[#fff8f1]/92 shadow-[0_10px_24px_rgba(31,41,51,0.04)] backdrop-blur"
      data-brain-subnav="true"
      style={{
        position: "sticky",
        top: 76,
        zIndex: 40,
      }}
    >
      <div className="page-shell flex min-h-[66px] items-center justify-center py-3">
        <nav className="scroll-x-panel flex w-fit max-w-full flex-nowrap items-center gap-2 rounded-full border border-[#dfd6c8] bg-white/90 p-1.5 shadow-[0_16px_36px_rgba(31,41,51,0.10)] backdrop-blur">
          {brainTabItems.map((item) => {
            const isActive =
              item.href === "/blackdog-brain"
                ? pathname === item.href || pathname === "/blackdog-brain/overview"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "whitespace-nowrap rounded-full bg-[#111827] px-4 py-2 text-xs font-bold text-white shadow-[0_10px_20px_rgba(17,24,39,0.18)]"
                    : "whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-[#6f6256] transition hover:bg-[#f4efe6] hover:text-[#111827]"
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
