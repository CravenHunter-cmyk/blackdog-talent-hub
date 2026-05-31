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
  const [mascotImageFailed, setMascotImageFailed] = useState(false);

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
    <main className="min-h-screen bg-transparent text-[#111827]">
      <TopNav />

      <section className="page-shell pb-24 pt-8">
        <div className="mb-3 grid gap-5 xl:gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.65fr)] xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.65fr)]">
          <div className="pt-4 lg:pt-7">
            <h1 className="max-w-[900px] text-5xl font-black leading-[1.02] tracking-[-0.012em] text-[#111827] xl:whitespace-nowrap xl:text-[58px]">
              Global Native Talent Network
            </h1>
            <div className="ml-0 sm:ml-8">
              <p className="mt-7 max-w-[650px] border-l-4 border-[#d49a3a] py-1 pl-5 text-xl font-bold leading-[1.45] text-[#1f5c43]">
                True global talent capability is not a static list. It is real-time visibility,
                trackable progress, and deployable delivery capacity.
              </p>
              <p className="mt-7 max-w-[690px] text-base font-medium leading-[1.7] text-[#64748b]">
                BlackDog Talent Hub turns global native talent resources into a visualized,
                trackable, and deployable delivery network, helping multilingual AI data, model
                evaluation, and localization projects assess coverage, match teams, and launch
                faster.
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[370px] rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-3.5 shadow-[0_10px_24px_rgba(31,41,51,0.08)]">
            <div className="mx-auto flex w-full max-w-[136px] items-center justify-center overflow-hidden rounded-2xl border border-[#d8ccb8] bg-[#f7f3ea] shadow-[0_6px_16px_rgba(31,41,51,0.06)]">
              <div className="relative aspect-square w-full max-w-[136px]">
                {mascotImageFailed ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#1f5c43] text-white">
                    <div className="text-center">
                      <div className="text-2xl font-black leading-none">BD</div>
                      <div className="text-[10px] font-semibold tracking-[0.24em] text-white/80">
                        BLACKDOG
                      </div>
                    </div>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/blackdog-mascot.jpg"
                    alt="BlackDog mascot"
                    width="136"
                    height="136"
                    onError={() => setMascotImageFailed(true)}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>

            <div className="mt-2.5 text-center">
              <div className="text-lg font-bold text-[#111827]">BlackDog Talent Hub</div>
              <div className="mt-1 text-sm font-medium text-[#6f6256]">Global Native Talent Network</div>
            </div>

            <div className="mt-3 border-t border-[#e2d8c8] pt-3 text-sm">
              <div className="flex items-center justify-between gap-4 py-1.5">
                <span className="text-[#6f6256]">Email</span>
                <span className="font-semibold text-[#1e1712]">yinxz.personal@gmail.com</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-1.5">
                <span className="text-[#6f6256]">Chat</span>
                {/* Future: wire this to the in-app chat surface. */}
                <a
                  href="#"
                  onClick={(event) => event.preventDefault()}
                  className="inline-flex items-center rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Chat
                </a>
              </div>
            </div>
          </div>
        </div>

        <MetricCards resources={languageResources} />

        <div className="mt-6">
          <TalentMapVisual
            resources={languageResources}
            selectedId={selectedLanguage}
            onSelect={setSelectedLanguage}
            detail={<LanguageDetailCard selected={selected} />}
          />
        </div>

        <section className="mt-6 rounded-xl border border-[#cbd5dc] bg-white p-5 shadow-[0_18px_44px_rgba(31,41,51,0.09)]">
          <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">Full Language Resource List</h2>
              <p className="mt-1 text-sm text-[#64748b]">
                Scroll, filter, and click any language row to update the detail panel.
              </p>
            </div>
            <div className="text-sm text-[#64748b]">{filteredResources.length} entries shown</div>
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
