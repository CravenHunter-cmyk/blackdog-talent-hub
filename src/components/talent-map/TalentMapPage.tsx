"use client";

import { useMemo, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { LanguageDetailCard } from "@/components/talent-map/LanguageDetailCard";
import { LanguageResourceTable } from "@/components/talent-map/LanguageResourceTable";
import { MetricCards } from "@/components/talent-map/MetricCards";
import { TalentMapFilters } from "@/components/talent-map/TalentMapFilters";
import { TalentMapVisual } from "@/components/talent-map/TalentMapVisual";
import { languageResources } from "@/data/languageResources";
import type { LanguageResource, OnlineStatusFilter, ReadinessFilter } from "@/types/talent";

function matchesOnlineStatus(item: LanguageResource, onlineStatus: OnlineStatusFilter) {
  if (onlineStatus === "Online Now") return item.onlineNow > 0;
  if (onlineStatus === "Offline") return item.onlineNow === 0;

  return true;
}

export function TalentMapPage() {
  const [selectedLanguage, setSelectedLanguage] = useState(languageResources[0].id);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("All");
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusFilter>("All");

  const selected =
    languageResources.find((item) => item.id === selectedLanguage) ?? languageResources[0];

  const languages = useMemo(() => {
    return ["All", ...Array.from(new Set(languageResources.map((item) => item.language))).sort()];
  }, []);

  const filteredResources = useMemo(() => {
    const rawKeyword = search.trim();
    const keyword = rawKeyword.toLowerCase();
    const exactCodeMatch =
      rawKeyword.length > 0 &&
      languageResources.some((item) => item.code.toLowerCase() === keyword);

    return languageResources.filter((item) => {
      const matchesLanguage = languageFilter === "All" || item.language === languageFilter;
      const matchesReadiness = readinessFilter === "All" || item.readiness === readinessFilter;
      const matchesStatus = matchesOnlineStatus(item, onlineStatus);
      const matchesKeyword =
        !keyword ||
        (exactCodeMatch
          ? item.code.toLowerCase() === keyword
          : [item.code, item.language, item.region]
              .join(" ")
              .toLowerCase()
              .includes(keyword));

      return matchesLanguage && matchesReadiness && matchesStatus && matchesKeyword;
    });
  }, [search, languageFilter, readinessFilter, onlineStatus]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
          <div>
            <div className="mb-3 text-sm font-medium text-gray-600">
              Talent Map · Public Coverage View
            </div>
            <h1 className="text-4xl font-semibold text-gray-950 md:text-5xl">
              BlackDog Talent Hub
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700">
              A public Talent Map for viewing native talent coverage by language, region,
              resource pool size, active talent capacity, online status, skill coverage,
              average rate, and readiness. Current stage uses mock data and does not connect
              to a database.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase text-gray-500">Access Rule</div>
            <div className="mt-2 text-xl font-semibold text-gray-950">
              Public map, protected workspace.
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              Talent Map can be viewed publicly. Candidates, Screening, Intake Forms,
              AI Assistant, and Settings require login permissions in later releases.
            </p>
          </div>
        </div>

        <MetricCards resources={filteredResources} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.65fr_0.95fr]">
          <TalentMapVisual
            resources={languageResources}
            selectedId={selectedLanguage}
            onSelect={setSelectedLanguage}
          />
          <LanguageDetailCard selected={selected} />
        </div>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <h2 className="text-xl font-semibold text-gray-950">Full Language Resource List</h2>
              <p className="mt-1 text-sm text-gray-600">
                Scroll, filter, and click any language row to update the detail panel.
              </p>
            </div>
            <div className="text-sm text-gray-500">{filteredResources.length} entries shown</div>
          </div>

          <div className="mb-4">
            <TalentMapFilters
              search={search}
              languageFilter={languageFilter}
              readinessFilter={readinessFilter}
              onlineStatus={onlineStatus}
              languages={languages}
              onSearchChange={setSearch}
              onLanguageFilterChange={setLanguageFilter}
              onReadinessFilterChange={setReadinessFilter}
              onOnlineStatusChange={setOnlineStatus}
            />
          </div>

          <LanguageResourceTable
            resources={filteredResources}
            selectedId={selectedLanguage}
            onSelect={setSelectedLanguage}
          />
        </section>
      </section>
    </main>
  );
}
