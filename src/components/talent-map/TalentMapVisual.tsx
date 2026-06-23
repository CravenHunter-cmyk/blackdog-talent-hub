"use client";

import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import { BlackDogLogo } from "@/components/brand/BlackDogLogo";
import { LanguageManagementTeam } from "@/components/talent-map/LanguageManagementTeam";
import { PawSectionIcon } from "@/components/talent-map/PawSectionIcon";
import type { ContinentGroup, LanguageResource } from "@/types/talent";

const continentGroups: ContinentGroup[] = [
  "Americas",
  "Europe",
  "Middle East & Africa",
  "Asia-Pacific",
  "Global / RoW",
];

const BACKGROUND_STAR_COUNT = 3600;
const MILKY_WAY_STAR_RATIO = 0.38;
const CLUSTER_STAR_RATIO = 0.24;

const starClusterCenters = [
  { x: 18, y: 73, spreadX: 10, spreadY: 8 },
  { x: 31, y: 35, spreadX: 12, spreadY: 10 },
  { x: 48, y: 58, spreadX: 16, spreadY: 13 },
  { x: 68, y: 29, spreadX: 14, spreadY: 10 },
  { x: 80, y: 68, spreadX: 12, spreadY: 11 },
  { x: 92, y: 42, spreadX: 7, spreadY: 15 },
];

type BackgroundStar = {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  twinkleDelay: number;
  twinkleDuration: number;
  cluster: "milky" | "cluster" | "field";
};

type TalentMapVisualProps = {
  resources: LanguageResource[];
  selectedId: string;
  onSelect: (id: string) => void;
  detail: React.ReactNode;
};

const BlackdogGlobeLanguageMap = dynamic(
  () =>
    import("@/components/talent-map/BlackdogGlobeLanguageMap").then(
      (mod) => mod.BlackdogGlobeLanguageMap,
    ),
  {
    ssr: false,
    loading: () => <div className="talent-map-globe-loading">Loading global talent map...</div>,
  },
);

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getStarColor(isBlue: boolean, isWarm: boolean) {
  if (isWarm) return "rgba(255, 221, 165, 1)";
  if (isBlue) return "rgba(145, 218, 255, 1)";
  return "rgba(255, 255, 255, 1)";
}

function bellCurveOffset(seed: number) {
  return (
    (seededRandom(seed) + seededRandom(seed + 17.39) + seededRandom(seed + 41.71)) / 3 - 0.5
  ) * 2;
}

function roundStarValue(value: number, precision = 3) {
  return Number(value.toFixed(precision));
}

function createBackgroundStars(count = BACKGROUND_STAR_COUNT): BackgroundStar[] {
  return Array.from({ length: count }, (_, index) => {
    const r1 = seededRandom(index * 13.17 + 3);
    const r2 = seededRandom(index * 27.91 + 11);
    const r3 = seededRandom(index * 41.73 + 19);
    const r4 = seededRandom(index * 59.11 + 29);
    const inMilkyWay = r3 < MILKY_WAY_STAR_RATIO;
    const inCluster = !inMilkyWay && r3 < MILKY_WAY_STAR_RATIO + CLUSTER_STAR_RATIO;
    let x = r1 * 100;
    let y = r2 * 100;

    if (inMilkyWay) {
      const t = seededRandom(index * 83.19 + 7);
      const wave = Math.sin(t * Math.PI * 2.7) * 4.2;
      const spread = bellCurveOffset(index * 91.37 + 5) * 18;
      x = 5 + t * 94 + bellCurveOffset(index * 43.13 + 2) * 4;
      y = 82 - t * 62 + wave + spread;
    } else if (inCluster) {
      const clusterIndex = Math.floor(seededRandom(index * 67.73 + 31) * starClusterCenters.length);
      const center = starClusterCenters[clusterIndex] ?? starClusterCenters[0];
      x = center.x + bellCurveOffset(index * 47.29 + 13) * center.spreadX;
      y = center.y + bellCurveOffset(index * 53.83 + 23) * center.spreadY;
    }

    x = Math.max(0.5, Math.min(99.5, x));
    y = Math.max(0.5, Math.min(99.5, y));

    const isBright = r4 > 0.93;
    const isTiny = r4 < 0.56;
    const isBlue = seededRandom(index * 101.3 + 17) > 0.62;
    const isWarm = seededRandom(index * 119.7 + 23) > 0.88;
    const clusterBoost = inMilkyWay || inCluster ? 0.08 : 0;

    return {
      id: `talent-map-star-${index}`,
      x: roundStarValue(x),
      y: roundStarValue(y),
      size: isBright
        ? roundStarValue(1.45 + seededRandom(index + 5) * 1.45, 2)
        : isTiny
          ? roundStarValue(0.38 + seededRandom(index + 9) * 0.5, 2)
          : roundStarValue(0.62 + seededRandom(index + 15) * 0.82, 2),
      opacity: isBright
        ? roundStarValue(0.55 + seededRandom(index + 13) * 0.34, 3)
        : roundStarValue(0.14 + clusterBoost + seededRandom(index + 21) * 0.34, 3),
      color: getStarColor(isBlue, isWarm),
      twinkleDelay: roundStarValue(seededRandom(index * 31.7) * 7, 2),
      twinkleDuration: roundStarValue(4.8 + seededRandom(index * 43.9) * 5.4, 2),
      cluster: inMilkyWay ? "milky" : inCluster ? "cluster" : "field",
    };
  });
}

const BACKGROUND_STARS = createBackgroundStars(BACKGROUND_STAR_COUNT);

export function TalentMapVisual({ resources, selectedId, onSelect, detail }: TalentMapVisualProps) {
  const [focusedGroup, setFocusedGroup] = useState<ContinentGroup>("Global / RoW");
  const selected = resources.find((item) => item.id === selectedId) ?? resources[0];
  const handleSelectLanguage = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect],
  );
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
  const readinessMetrics = useMemo(() => {
    return (["Core", "Stable", "Developing"] as const).map((readiness) => ({
      readiness,
      count: resources.filter((item) => item.readiness === readiness).length,
    }));
  }, [resources]);

  return (
    <section id="global-talent-map" className="talent-map-workspace">
      <div className="talent-map-natural-starfield" aria-hidden="true">
        {BACKGROUND_STARS.map((star) => (
          <span
            key={star.id}
            className={`talent-map-natural-star talent-map-natural-star--${star.cluster}`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              "--star-opacity": String(star.opacity),
              color: star.color,
              backgroundColor: star.color,
              animationDelay: `${star.twinkleDelay}s`,
              animationDuration: `${star.twinkleDuration}s`,
            } as CSSProperties}
          />
        ))}
      </div>

      <div className="talent-map-header">
        <div className="talent-map-heading-stack">
          <div className="talent-map-brand-lockup">
            <BlackDogLogo size="md" tone="white" />
          </div>
          <div>
            <h2>GLOBAL TALENT MAP</h2>
            <p>Real-time global talent landscape at your fingertips.</p>
            <span className="talent-map-title-rule" aria-hidden="true" />
          </div>
        </div>
        <div className="talent-map-status-chips">
          {readinessMetrics.map((metric) => (
            <span key={metric.readiness} className={`talent-map-status-chip is-${metric.readiness.toLowerCase()}`}>
              {metric.readiness} <strong>{metric.count}</strong>
            </span>
          ))}
        </div>
      </div>

        <div className="talent-map-hero">
          <div className="talent-map-globe-column">
            <div className="talent-map-globe-shell">
              <BlackdogGlobeLanguageMap
                resources={resources}
                selectedId={selectedId}
                onSelect={handleSelectLanguage}
                focusedGroup={focusedGroup}
                variant="embedded"
              />
            </div>
          </div>

        <div className="talent-map-detail-column">
          {detail}
        </div>
      </div>

      <div className="talent-map-region-panel">
        <div className="talent-map-section-heading talent-section-heading">
          <PawSectionIcon className="talent-map-section-spark talent-section-heading__icon" />
          <div className="talent-section-heading__copy">
            <h3>Key Language Regions</h3>
            <p>
              Quickly focus the map on key language regions to review native talent coverage,
              active capacity, and online availability.
            </p>
          </div>
        </div>

        <div className="talent-map-region-grid">
          {continentMetrics.map((metric) => (
            <button
              key={metric.group}
              type="button"
              onClick={() => setFocusedGroup(metric.group)}
              className={`talent-map-region-card talent-map-region-${getRegionSlug(metric.group)}${
                focusedGroup === metric.group ? " is-active" : ""
              }`}
            >
              <span className="talent-map-region-graphic" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <div className="talent-map-region-title">
                <span aria-hidden="true" />
                <strong>{metric.group}</strong>
              </div>
              <div className="talent-map-region-stats">
                <div>
                  <strong>{metric.pools}</strong>
                  <span>pools</span>
                </div>
                <div>
                  <strong>{metric.activeTalents.toLocaleString()}</strong>
                  <span>active</span>
                </div>
                <div>
                  <strong>{metric.onlineNow.toLocaleString()}</strong>
                  <span>online</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="talent-map-team-wrap">
        <LanguageManagementTeam selected={selected} />
      </div>
    </section>
  );
}

function getRegionSlug(group: ContinentGroup) {
  return group
    .toLowerCase()
    .replace(/[^a-z]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
