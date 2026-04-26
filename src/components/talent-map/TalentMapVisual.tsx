import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { LanguageManagementTeam } from "@/components/talent-map/LanguageManagementTeam";
import type { ContinentGroup, LanguageResource } from "@/types/talent";

const LeafletTalentMap = dynamic(
  () => import("@/components/talent-map/LeafletTalentMap").then((mod) => mod.LeafletTalentMap),
  { ssr: false },
);

const continentGroups: ContinentGroup[] = [
  "Americas",
  "Europe",
  "Middle East & Africa",
  "Asia-Pacific",
  "Global / RoW",
];

type TalentMapVisualProps = {
  resources: LanguageResource[];
  selectedId: string;
  onSelect: (id: string) => void;
  detail: React.ReactNode;
};

export function TalentMapVisual({ resources, selectedId, onSelect, detail }: TalentMapVisualProps) {
  const [focusedGroup, setFocusedGroup] = useState<ContinentGroup>("Global / RoW");
  const selected = resources.find((item) => item.id === selectedId) ?? resources[0];
  const continentMetrics = useMemo(() => {
    return continentGroups.map((group) => {
      const groupResources = resources.filter((item) => item.continentGroup === group);

      return {
        group,
        pools: groupResources.length,
        activeTalents: groupResources.reduce((sum, item) => sum + item.activeTalents, 0),
        onlineNow: groupResources.reduce((sum, item) => sum + item.onlineNow, 0),
      };
    });
  }, [resources]);

  return (
    <section className="rounded-xl border border-[#d2c8ba] bg-white/95 p-5 shadow-[0_18px_48px_rgba(31,41,51,0.11)]">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold text-[#1e1712]">Global Talent Map</h2>
          <p className="mt-1 text-sm font-medium text-[#6b6258]">
            Click a language node to update the detail panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#6b6258]">
          <span className="rounded-md border border-[#214d3a] bg-[#f4f8f0] px-2 py-1">Core</span>
          <span className="rounded-md border border-[#6b7d3a] bg-[#f4f8f0] px-2 py-1">Stable</span>
          <span className="rounded-md border border-[#c9852b] bg-[#fff8ed] px-2 py-1">Developing</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative h-[540px] overflow-hidden rounded-xl border border-[#cbbfae] bg-[#f7f6f0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65),0_16px_38px_rgba(31,41,51,0.10)] lg:h-[660px]">
          <LeafletTalentMap
            resources={resources}
            selectedId={selectedId}
            onSelect={onSelect}
            focusedGroup={focusedGroup}
          />
        </div>

        {detail}
      </div>

      <div className="mt-5 rounded-xl border border-[#d2c8ba] bg-[#f7f6f0]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div className="mb-3 flex flex-col justify-between gap-1 md:flex-row md:items-end">
          <div>
            <h3 className="text-lg font-bold text-[#1e1712]">Continent Focus</h3>
            <p className="mt-1 text-sm font-medium text-[#6b6258]">
              Quickly focus the map by region to review native talent coverage across major continents.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {continentMetrics.map((metric) => (
            <button
              key={metric.group}
              type="button"
              onClick={() => setFocusedGroup(metric.group)}
              className={`rounded-lg border p-3 text-left shadow-[0_8px_18px_rgba(31,41,51,0.04)] transition hover:border-[#214d3a] hover:bg-[#eef3e7] ${
                focusedGroup === metric.group
                  ? "border-[#214d3a] bg-[#eef3e7] shadow-[0_10px_24px_rgba(33,77,58,0.12)]"
                  : "border-[#d2c8ba] bg-white"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-[#1e1712]">
                <span className="h-2 w-2 rounded-full bg-[#214d3a]" />
                {metric.group}
              </div>
              <div className="mt-2 space-y-1 font-mono text-xs tabular-nums text-[#6b6258]">
                <div>{metric.pools} pools</div>
                <div>{metric.activeTalents.toLocaleString()} active</div>
                <div>{metric.onlineNow.toLocaleString()} online</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <LanguageManagementTeam selected={selected} />
    </section>
  );
}
