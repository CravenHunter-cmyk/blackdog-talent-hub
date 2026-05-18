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
        accent: "bg-[#1f4d3a]",
        border: "border-[#cdd9cf]",
        iconBg: "bg-[#e9f1ec]",
        iconText: "text-[#1f4d3a]",
        valueText: "text-[#14261f]",
        glow: "shadow-[0_10px_22px_rgba(31,77,58,0.10)]",
      },
    },
    {
      label: "Active Talents",
      value: resources.reduce((sum, item) => sum + item.activeTalents, 0).toLocaleString(),
      description: "Available for current projects",
      tone: {
        accent: "bg-[#2f7d57]",
        border: "border-[#c9dfd0]",
        iconBg: "bg-[#edf8f1]",
        iconText: "text-[#2f7d57]",
        valueText: "text-[#1f3f2f]",
        glow: "shadow-[0_10px_22px_rgba(47,125,87,0.10)]",
      },
    },
    {
      label: "Language Pools",
      value: resources.length.toString(),
      description: "Native language networks",
      tone: {
        accent: "bg-[#2f6f73]",
        border: "border-[#c8dcdd]",
        iconBg: "bg-[#edf7f7]",
        iconText: "text-[#2f6f73]",
        valueText: "text-[#1f3f46]",
        glow: "shadow-[0_10px_22px_rgba(47,111,115,0.10)]",
      },
    },
    {
      label: "Managed Pools",
      value: resources.length.toString(),
      description: "Operated delivery groups",
      tone: {
        accent: "bg-[#9a6a35]",
        border: "border-[#e2cfb4]",
        iconBg: "bg-[#fbf1e2]",
        iconText: "text-[#9a6a35]",
        valueText: "text-[#3f2f22]",
        glow: "shadow-[0_10px_22px_rgba(154,106,53,0.10)]",
      },
    },
    {
      label: "Online Now",
      value: resources.reduce((sum, item) => sum + item.onlineNow, 0).toLocaleString(),
      description: "Ready for live coordination",
      tone: {
        accent: "bg-[#16a34a]",
        border: "border-[#bfe4cc]",
        iconBg: "bg-[#eaf8ef]",
        iconText: "text-[#168a42]",
        valueText: "text-[#14532d]",
        glow: "shadow-[0_10px_22px_rgba(22,163,74,0.10)]",
      },
    },
  ];

  return (
    <section aria-labelledby="platform-snapshot-title">
      <div className="mb-2.5 flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3">
        <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3">
          <h2 id="platform-snapshot-title" className="text-sm font-semibold text-[#1f5c43]">
            Platform Snapshot
          </h2>
          <p className="max-w-xl text-sm font-medium leading-5 text-[#7a8178]">
            Live talent network status.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`relative min-h-[138px] overflow-hidden rounded-xl border bg-[#fbfaf6] p-4 shadow-[0_14px_30px_rgba(31,41,51,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(31,41,51,0.12)] ${metric.tone.border} ${metric.tone.glow}`}
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
