"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { BlackDogLogo } from "@/components/brand/BlackDogLogo";
import { TopNav } from "@/components/layout/TopNav";
import { LanguageDetailCard } from "@/components/talent-map/LanguageDetailCard";
import { LanguageResourceMatrixLayoutEditor } from "@/components/talent-map/LanguageResourceMatrixLayoutEditor";
import { LanguageResourceTable } from "@/components/talent-map/LanguageResourceTable";
import { MetricCards } from "@/components/talent-map/MetricCards";
import { DataControlSection } from "@/components/talent-map/DataControlSection";
import { PlatformShowcaseSection } from "@/components/talent-map/PlatformShowcaseSection";
import { RealTimeProjectVisibilitySection } from "@/components/talent-map/RealTimeProjectVisibilitySection";
import { TalentIntelligenceSection } from "@/components/talent-map/TalentIntelligenceSection";
import { TalentMapFilters } from "@/components/talent-map/TalentMapFilters";
import { TalentMapVisual } from "@/components/talent-map/TalentMapVisual";
import { WhyBlackDogSection } from "@/components/talent-map/WhyBlackDogSection";
import { WorkTogetherSection } from "@/components/talent-map/WorkTogetherSection";
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
    <main className="min-h-screen bg-transparent text-[#111827]">
      <TopNav />

      <section className="page-shell pb-24 pt-8">
        <div className="overflow-hidden rounded-[36px] border border-[#e6dbc7] bg-[#fff7eb] shadow-[0_24px_80px_rgba(18,24,38,0.08)]">
          <div
            className="relative isolate bg-no-repeat"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(248, 253, 252, 0.88) 0%, rgba(244, 252, 250, 0.62) 28%, rgba(234, 249, 248, 0.12) 56%, rgba(234, 249, 248, 0) 74%), url('/images/Talenti_Map_01.png')",
              backgroundPosition: "center 52%",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          >
            <div className="relative flex min-h-[860px] flex-col px-6 py-8 sm:px-8 sm:py-10 lg:min-h-[920px] lg:px-16 lg:py-14 xl:min-h-[960px]">
              <div className="w-full max-w-[620px] pt-4 sm:pt-6 lg:pt-8 xl:pt-12">
                <div className="relative -top-4 inline-flex h-10 items-center gap-3 bg-transparent p-0 shadow-none backdrop-none">
                  <span className="relative block h-9 w-9 shrink-0 overflow-visible">
                    <Image
                      src="/images/Logo_icon_tight.png"
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                      className="block h-9 w-9 object-contain"
                    />
                  </span>
                  <span className="whitespace-nowrap text-[24px] font-extrabold leading-none tracking-[-0.02em] text-[#071B3A]">
                    BlackDog
                  </span>
                </div>
                <div>
                  <h1 className="mt-8 max-w-[620px] text-[clamp(48px,4.8vw,72px)] font-black leading-[0.92] tracking-[-0.015em] text-[#0f172a] xl:text-[clamp(52px,5vw,78px)]">
                    <span className="block text-[#065f5b]">Global Native</span>
                    <span className="block bg-gradient-to-r from-[#f3a51a] via-[#d97706] to-[#176b4d] bg-clip-text text-transparent">
                      Talent Network
                    </span>
                  </h1>
                  <div className="mt-7 max-w-[620px] border-l-4 border-[#d49a3a] pl-5">
                    <p className="text-[16px] font-bold leading-[1.42] text-[#1f5c43] lg:text-[17px]">
                      True global talent capability is not a static list. It is real-time visibility,
                      trackable progress, and deployable delivery capacity.
                    </p>
                    <p className="mt-4 max-w-[620px] text-[15px] font-medium leading-[1.72] text-[#64748b] sm:text-base">
                      BlackDog Talent Hub turns global native talent resources into a visualized,
                      trackable, and deployable delivery network, helping multilingual AI data,
                      model evaluation, and localization projects assess coverage, match teams, and
                      launch faster.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <a
                      href="#global-talent-map"
                      className="inline-flex h-12 items-center gap-3 rounded-full bg-gradient-to-r from-[#0f766e] to-[#075b54] px-7 text-[14px] font-bold text-white shadow-[0_16px_34px_rgba(7,91,84,0.22)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/14">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 translate-x-[1px]" fill="none" aria-hidden="true">
                          <path d="M8 5v14l11-7z" fill="currentColor" />
                        </svg>
                      </span>
                      Explore the Network
                    </a>
                    <span className="inline-flex items-center gap-1.5 bg-transparent p-0 text-[14px] font-bold text-[#075b54] shadow-none backdrop-none">
                      <span className="inline-flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-visible bg-transparent p-0">
                        <Image
                          src="/images/Logo_icon.png"
                          alt=""
                          width={88}
                          height={88}
                          className="block h-[88px] w-[88px] max-w-none shrink-0 object-contain"
                        />
                      </span>
                      Live Network
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pb-2 pt-10 lg:pb-0 lg:pt-12">
                <MetricCards resources={languageResources} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <WhyBlackDogSection />
        </div>

        <div className="mt-6">
          <TalentIntelligenceSection />
        </div>

        <div className="mt-6">
          <TalentMapVisual
            resources={languageResources}
            selectedId={selectedLanguage}
            onSelect={setSelectedLanguage}
            detail={<LanguageDetailCard selected={selected} />}
          />
        </div>

        <section className="language-resource-matrix-section">
          <div className="language-resource-matrix-bg" aria-hidden="true" />
          <div
            className="language-resource-matrix-map-logo"
            data-matrix-movable="matrix-map-logo"
            data-matrix-label="Map logo"
          >
            <BlackDogLogo size="md" tone="white" />
          </div>
          <div
            className="language-resource-matrix-panel"
            data-matrix-movable="matrix-panel"
            data-matrix-label="Glass panel"
          >
            <div className="language-resource-matrix-header">
              <div data-matrix-movable="matrix-heading" data-matrix-label="Heading block">
                <div className="language-resource-matrix-eyebrow">
                  STRUCTURED VIEW OF THE GLOBAL TALENT MAP
                </div>
                <h2>LANGUAGE RESOURCE MATRIX</h2>
                <p>
                  Explore every language node behind the globe view. Filter by readiness, online
                  status, and region.
                </p>
              </div>
              <div className="language-resource-matrix-header-actions">
                <div
                  className="language-resource-matrix-count"
                  data-matrix-movable="matrix-count"
                  data-matrix-label="Entries count"
                >
                  <span className="language-resource-matrix-count-dot" />
                  <span>{filteredResources.length}</span> entries shown
                </div>
                <LanguageResourceMatrixLayoutEditor />
              </div>
            </div>

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

            <LanguageResourceTable
              resources={filteredResources}
              selectedId={selectedLanguage}
              onSelect={setSelectedLanguage}
            />
          </div>
        </section>

        <div className="mt-6">
          <RealTimeProjectVisibilitySection />
        </div>

        <div className="mt-6">
          <PlatformShowcaseSection />
        </div>

        <div className="mt-6">
          <DataControlSection />
        </div>

        <div className="mt-6">
          <WorkTogetherSection />
        </div>
      </section>
    </main>
  );
}
