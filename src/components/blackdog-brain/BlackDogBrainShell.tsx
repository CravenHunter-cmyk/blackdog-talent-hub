import type { ReactNode } from "react";
import Link from "next/link";

export function BlackDogBrainShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function BrainSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        {eyebrow ? <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6a3f]">{eyebrow}</div> : null}
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] md:text-3xl">{title}</h2>
      </div>
      {description ? <p className="max-w-2xl text-sm font-medium leading-6 text-[#6f6256]">{description}</p> : null}
    </div>
  );
}

export function SoftCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#ded4c5] bg-white/88 p-5 shadow-[0_18px_42px_rgba(31,41,51,0.08)] backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

export function StatusPill({ children, tone = "warm" }: { children: ReactNode; tone?: "warm" | "green" | "dark" | "blue" | "bronze" }) {
  const className =
    tone === "green"
      ? "border-[#b7d5c1] bg-[#edf8f1] text-[#1f5c43]"
      : tone === "bronze"
        ? "border-[#d7c6ad] bg-[#fbf4e9] text-[#8a5b28]"
      : tone === "dark"
        ? "border-[#202a37] bg-[#111827] text-white"
        : tone === "blue"
          ? "border-[#cad9e8] bg-[#eef6fb] text-[#244860]"
          : "border-[#d7c6ad] bg-[#fbf4e9] text-[#8a5b28]";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${className}`}>{children}</span>;
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-[#1f5c43] bg-[#1f5c43] px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_26px_rgba(31,92,67,0.22)] transition hover:-translate-y-0.5 hover:bg-[#174936]"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-[#d7cec0] bg-white px-5 py-2.5 text-sm font-black text-[#40372f] shadow-[0_12px_24px_rgba(31,41,51,0.06)] transition hover:-translate-y-0.5 hover:border-[#1f5c43] hover:text-[#1f5c43]"
    >
      {children}
    </Link>
  );
}
