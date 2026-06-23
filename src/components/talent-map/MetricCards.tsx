import type { LanguageResource } from "@/types/talent";

type MetricCardsProps = {
  resources: LanguageResource[];
};

export function MetricCards({ resources }: MetricCardsProps) {
  const metrics = [
    {
      label: "Total Resources",
      value: resources.reduce((sum, item) => sum + item.totalResources, 0).toLocaleString(),
      description: "Verified global talent profiles",
      tone: {
        accent: "bg-[#0f766e]",
        border: "border-[rgba(15,118,110,0.16)]",
        iconBg: "bg-[rgba(15,118,110,0.10)]",
        iconText: "text-[#0f766e]",
        valueText: "text-[#0f766e]",
        glow: "shadow-[0_10px_22px_rgba(15,118,110,0.10)]",
      },
    },
    {
      label: "Active Talents",
      value: resources.reduce((sum, item) => sum + item.activeTalents, 0).toLocaleString(),
      description: "Available for current projects",
      tone: {
        accent: "bg-[#2e9f6e]",
        border: "border-[rgba(46,159,110,0.16)]",
        iconBg: "bg-[rgba(46,159,110,0.10)]",
        iconText: "text-[#2e9f6e]",
        valueText: "text-[#2e9f6e]",
        glow: "shadow-[0_10px_22px_rgba(46,159,110,0.10)]",
      },
    },
    {
      label: "Language Pools",
      value: resources.length.toString(),
      description: "Native language networks",
      tone: {
        accent: "bg-[#1d7fa3]",
        border: "border-[rgba(29,127,163,0.16)]",
        iconBg: "bg-[rgba(29,127,163,0.10)]",
        iconText: "text-[#1d7fa3]",
        valueText: "text-[#1d7fa3]",
        glow: "shadow-[0_10px_22px_rgba(29,127,163,0.10)]",
      },
    },
    {
      label: "Managed Pools",
      value: resources.length.toString(),
      description: "Operated delivery groups",
      tone: {
        accent: "bg-[#d97706]",
        border: "border-[rgba(217,119,6,0.16)]",
        iconBg: "bg-[rgba(217,119,6,0.10)]",
        iconText: "text-[#d97706]",
        valueText: "text-[#d97706]",
        glow: "shadow-[0_10px_22px_rgba(217,119,6,0.10)]",
      },
    },
    {
      label: "Online Now",
      value: resources.reduce((sum, item) => sum + item.onlineNow, 0).toLocaleString(),
      description: "Ready for live coordination",
      tone: {
        accent: "bg-[#0891b2]",
        border: "border-[rgba(8,145,178,0.16)]",
        iconBg: "bg-[rgba(8,145,178,0.10)]",
        iconText: "text-[#0891b2]",
        valueText: "text-[#0891b2]",
        glow: "shadow-[0_10px_22px_rgba(8,145,178,0.10)]",
      },
    },
  ];

  return (
    <section aria-labelledby="platform-snapshot-title" className="bg-transparent">
      <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3">
        <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3">
          <h2 id="platform-snapshot-title" className="text-sm font-semibold text-[#1f5c43]">
            Platform Snapshot
          </h2>
          <p className="max-w-xl text-sm font-medium leading-5 text-[#6f6256]">
            Live talent network status.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`relative min-h-[132px] overflow-hidden rounded-[20px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(255,255,255,0.38))] p-4 shadow-[0_16px_36px_rgba(15,81,80,0.10)] backdrop-blur-[12px] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(31,41,51,0.12)] ${metric.tone.border} ${metric.tone.glow}`}
          >
            <div className={`absolute inset-x-0 top-0 h-1.5 ${metric.tone.accent}`} />
            <div className="mb-3 flex items-center gap-2.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${metric.tone.iconBg} ${metric.tone.iconText}`}>
                <MetricIcon label={metric.label} />
              </div>
              <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold leading-5 text-[#5f665c] xl:text-sm">
                {metric.label === "Online Now" ? (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#16a34a] shadow-[0_0_0_3px_rgba(22,163,74,0.14)]" />
                ) : null}
                <span className="min-w-0 whitespace-nowrap">{metric.label}</span>
              </div>
            </div>
            <div className={`font-mono text-[28px] font-black leading-none tabular-nums ${metric.tone.valueText}`}>
              {metric.value}
            </div>
            <p className="mt-3 text-[13px] font-medium leading-5 text-[#7a8178]">
              {metric.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricIcon({ label }: { label: string }) {
  const className = "h-3 w-3";

  switch (label) {
    case "Total Resources":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="9.5" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M17 7h4M19 5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "Active Talents":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 2v4M12 18v4M4.9 4.9 7.7 7.7M16.3 16.3 19.1 19.1M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "Language Pools":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "Managed Pools":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="4" y="5" width="7" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13" y="5" width="7" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="8.5" y="14" width="7" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M7.5 10v3.2M16.5 10v3.2M12 10v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "Online Now":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="17" r="1.5" fill="currentColor" />
          <path d="M7.5 14.5a7 7 0 0 1 9 0M5 11.5a10 10 0 0 1 14 0M2.5 8.5a13 13 0 0 1 19 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
