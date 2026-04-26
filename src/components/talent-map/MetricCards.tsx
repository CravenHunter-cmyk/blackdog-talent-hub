import type { LanguageResource } from "@/types/talent";

type MetricCardsProps = {
  resources: LanguageResource[];
};

export function MetricCards({ resources }: MetricCardsProps) {
  const metrics = [
    {
      label: "Total Resources",
      value: resources.reduce((sum, item) => sum + item.totalResources, 0).toLocaleString(),
    },
    {
      label: "Active Talents",
      value: resources.reduce((sum, item) => sum + item.activeTalents, 0).toLocaleString(),
    },
    {
      label: "Language Pools Covered",
      value: resources.length.toString(),
    },
    {
      label: "Managed Pools",
      value: resources.length.toString(),
    },
    {
      label: "Online Now",
      value: resources.reduce((sum, item) => sum + item.onlineNow, 0).toLocaleString(),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="relative overflow-hidden rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-4 shadow-[0_10px_22px_rgba(31,41,51,0.08)]"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[#1f5c43]" />
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center text-[#1f5c43]">
              <MetricIcon label={metric.label} />
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#6f6256]">
              {metric.label === "Online Now" ? (
                <span className="h-2 w-2 rounded-full bg-[#1f5c43]" />
              ) : null}
              {metric.label}
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black tabular-nums text-[#111827]">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
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
    case "Language Pools Covered":
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
