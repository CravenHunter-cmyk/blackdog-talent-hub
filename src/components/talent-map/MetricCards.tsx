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
      label: "Languages Covered",
      value: new Set(resources.map((item) => item.language)).size.toString(),
    },
    {
      label: "Regions Covered",
      value: new Set(resources.map((item) => item.region)).size.toString(),
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
          className="relative overflow-hidden rounded-xl border border-[#d2c8ba] bg-white p-4 shadow-[0_14px_34px_rgba(31,41,51,0.09)]"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[#214d3a]" />
          <div className="mb-3 h-1 w-10 rounded-full bg-[#c9852b]" />
          <div className="flex items-center gap-2 text-sm font-semibold text-[#6b6258]">
            {metric.label === "Online Now" ? (
              <span className="h-2 w-2 rounded-full bg-[#214d3a]" />
            ) : null}
            {metric.label}
          </div>
          <div className="mt-2 font-mono text-2xl font-black tabular-nums text-[#1f2933]">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}
