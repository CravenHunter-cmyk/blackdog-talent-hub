import type { ReactNode } from "react";

type BlackDogPlatformShellProps = {
  children: ReactNode;
};

type PlatformHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  signal: string;
  children: ReactNode;
};

type PlatformSectionProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function BlackDogPlatformShell({ children }: BlackDogPlatformShellProps) {
  return (
    <main className="min-h-screen bg-transparent pb-24 pt-8 text-[#111827]">
      <div className="page-shell space-y-8">
        {children}
      </div>
    </main>
  );
}

export function PlatformHero({ eyebrow, title, subtitle, signal, children }: PlatformHeroProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#d7e3d3] bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(244,250,240,0.92)_42%,rgba(231,246,239,0.88)_100%)] shadow-[0_24px_70px_rgba(31,41,51,0.10)]">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-10">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-[#cbdcc7] bg-white/82 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#1f5c43]">
            {eyebrow}
          </div>
          <h1 className="mt-5 text-[clamp(2.4rem,4vw,4.7rem)] font-black leading-[0.98] tracking-[-0.045em] text-[#111827]">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-[clamp(1rem,1.3vw,1.2rem)] font-semibold leading-7 text-[#4f6556]">
            {subtitle}
          </p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/72 p-5 shadow-[0_18px_48px_rgba(31,41,51,0.08)] backdrop-blur">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1f5c43]">{signal}</div>
          <div className="mt-5 space-y-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function PlatformSection({ eyebrow, title, description, children }: PlatformSectionProps) {
  return (
    <section className="rounded-[28px] border border-[#d7e3d3] bg-white/88 p-6 shadow-[0_18px_46px_rgba(31,41,51,0.08)] backdrop-blur sm:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1f5c43]">{eyebrow}</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] md:text-3xl">{title}</h2>
        </div>
        {description ? <p className="max-w-2xl text-sm font-semibold leading-6 text-[#66725f]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function PlatformCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="min-h-[210px] rounded-[22px] border border-[#dce7d8] bg-[#fbfdf8] p-5 shadow-[0_14px_34px_rgba(31,41,51,0.06)]">
      <h3 className="text-lg font-black tracking-tight text-[#111827]">{title}</h3>
      <div className="mt-4 space-y-2">{children}</div>
    </article>
  );
}

export function PlatformList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-[#5c6d5d]">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2aa36b]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function MetricGrid({ metrics }: { metrics: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-[18px] border border-[#dce7d8] bg-[#f7fbf4] px-4 py-4">
          <div className="text-2xl font-black tracking-tight text-[#1f5c43]">{metric.value}</div>
          <div className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#66725f]">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}
