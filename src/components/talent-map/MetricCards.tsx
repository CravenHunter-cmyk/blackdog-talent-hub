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
        <div key={metric.label} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-500">{metric.label}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-950">{metric.value}</div>
        </div>
      ))}
    </div>
  );
}
