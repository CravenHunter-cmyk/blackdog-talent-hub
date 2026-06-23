"use client";

import Image from "next/image";
import { type CSSProperties, type ReactNode } from "react";

import { BlackDogLogo } from "@/components/brand/BlackDogLogo";

type VisibilityFeature = {
  number: string;
  title: string;
  body: string;
  icon: VisibilityIconName;
  tone: "violet" | "teal" | "blue" | "orange" | "green";
  className: string;
  layerKey: VisibilityLayerKey;
};

type VisibilityIconName = "activity" | "chart" | "clock" | "database" | "file" | "lock" | "shield" | "trace" | "users";
type VisibilityLayerKey = "titleBlock" | "card1" | "card2" | "card3" | "card4" | "card5" | "summary";
type VisibilityLayerLayout = {
  left: number;
  top: number;
  width: number;
  scale: number;
};
type VisibilityLayout = Record<VisibilityLayerKey, VisibilityLayerLayout>;

const PROJECT_VISIBILITY_LAYOUT: VisibilityLayout = {
  titleBlock: { left: 20.73, top: 6.03, width: 89.65, scale: 0.67 },
  card1: { left: 19.63, top: 26.09, width: 31.52, scale: 0.77 },
  card2: { left: 10.52, top: 52.18, width: 28.1, scale: 0.82 },
  card3: { left: 57.72, top: 26.92, width: 28.82, scale: 0.82 },
  card4: { left: 68.09, top: 53.97, width: 27.35, scale: 0.82 },
  card5: { left: 38.8, top: 77.78, width: 29.86, scale: 0.77 },
  summary: { left: 12.12, top: 93.17, width: 44.78, scale: 0.62 },
};

const visibilityFeatures: VisibilityFeature[] = [
  {
    number: "1.",
    title: "DATA TRACEABILITY",
    body: "Every data creation, annotation, review, edit, and delivery is recorded and traceable.",
    icon: "trace",
    tone: "violet",
    className: "project-visibility-card-1",
    layerKey: "card1",
  },
  {
    number: "2.",
    title: "PROJECT ACTIVITY LOGS",
    body: "Every project operation is logged, searchable, and verifiable in real time.",
    icon: "activity",
    tone: "teal",
    className: "project-visibility-card-2",
    layerKey: "card2",
  },
  {
    number: "3.",
    title: "PEOPLE ACCOUNTABILITY",
    body: "See who is involved, what role they play, what data they handled, and what actions they performed.",
    icon: "users",
    tone: "blue",
    className: "project-visibility-card-3",
    layerKey: "card3",
  },
  {
    number: "4.",
    title: "ROLE-BASED ACCESS",
    body: "Each role has its own permissions. Clients have a dedicated view with secure query access.",
    icon: "lock",
    tone: "orange",
    className: "project-visibility-card-4",
    layerKey: "card4",
  },
  {
    number: "5.",
    title: "ON-DEMAND REPORTS",
    body: "The platform can automatically generate project, data, quality, and delivery reports based on client needs.",
    icon: "chart",
    tone: "orange",
    className: "project-visibility-card-5",
    layerKey: "card5",
  },
];

function formatFeatureNumber(number: string) {
  return number.replace(/\D/g, "").padStart(2, "0");
}

function VisibilityIcon({ name }: { name: VisibilityIconName }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === "activity" && (
        <>
          <path {...commonProps} d="M8 6h11" />
          <path {...commonProps} d="M8 12h11" />
          <path {...commonProps} d="M8 18h11" />
          <path {...commonProps} d="M4 6h.01" />
          <path {...commonProps} d="M4 12h.01" />
          <path {...commonProps} d="M4 18h.01" />
        </>
      )}
      {name === "database" && (
        <>
          <ellipse {...commonProps} cx="12" cy="5" rx="7" ry="3" />
          <path {...commonProps} d="M5 5v10c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
          <path {...commonProps} d="M5 10c0 1.66 3.13 3 7 3s7-1.34 7-3" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle {...commonProps} cx="12" cy="12" r="8" />
          <path {...commonProps} d="M12 7v5l3 2" />
          <path {...commonProps} d="M4 5.5 2.5 4" />
          <path {...commonProps} d="M20 5.5 21.5 4" />
        </>
      )}
      {name === "chart" && (
        <>
          <path {...commonProps} d="M5 20h14" />
          <path {...commonProps} d="M7 16v4" />
          <path {...commonProps} d="M12 10v10" />
          <path {...commonProps} d="M17 5v15" />
        </>
      )}
      {name === "trace" && (
        <>
          <path {...commonProps} d="M7 3h7l4 4v14H7z" />
          <path {...commonProps} d="M14 3v5h5" />
          <path {...commonProps} d="M10 11h5" />
          <path {...commonProps} d="M10 15h3" />
          <circle {...commonProps} cx="17" cy="17" r="4" />
          <path {...commonProps} d="M17 14.8V17l1.6 1" />
        </>
      )}
      {name === "file" && (
        <>
          <path {...commonProps} d="M7 3h7l4 4v14H7z" />
          <path {...commonProps} d="M14 3v5h5" />
          <path {...commonProps} d="M10 13h6" />
          <path {...commonProps} d="M10 17h5" />
        </>
      )}
      {name === "lock" && (
        <>
          <rect {...commonProps} x="5" y="10" width="14" height="10" rx="2" />
          <path {...commonProps} d="M8 10V7a4 4 0 0 1 8 0v3" />
          <path {...commonProps} d="M12 14v2" />
        </>
      )}
      {name === "shield" && (
        <>
          <path {...commonProps} d="M12 3 19 6v5c0 4.4-2.9 8.3-7 10-4.1-1.7-7-5.6-7-10V6z" />
          <path {...commonProps} d="m9 12 2 2 4-4" />
        </>
      )}
      {name === "users" && (
        <>
          <path {...commonProps} d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle {...commonProps} cx="9.5" cy="7" r="4" />
          <path {...commonProps} d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path {...commonProps} d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      )}
    </svg>
  );
}

export function RealTimeProjectVisibilitySection() {
  function getLayerStyle(key: VisibilityLayerKey): CSSProperties {
    const layer = PROJECT_VISIBILITY_LAYOUT[key];
    return {
      left: `${layer.left}%`,
      top: `${layer.top}%`,
      width: `${layer.width}%`,
      "--project-visibility-layer-scale": layer.scale,
    } as CSSProperties;
  }

  function renderLayer(
    key: VisibilityLayerKey,
    label: string,
    children: ReactNode,
    className?: string,
  ) {
    return (
      <div
        key={key}
        className={`project-visibility-layer ${className ?? ""}`}
        data-layer={label}
        style={getLayerStyle(key)}
      >
        <div className="project-visibility-layer-content">{children}</div>
      </div>
    );
  }

  return (
    <section className="project-visibility-section" aria-labelledby="project-visibility-title">
      <Image
        className="project-visibility-background"
        src="/images/Project_Visible.png"
        alt=""
        fill
        priority={false}
        sizes="(max-width: 1760px) 100vw, 1760px"
      />

      <div className="project-visibility-logo" aria-label="BlackDog">
        <BlackDogLogo size="md" tone="default" />
      </div>

      {renderLayer(
        "titleBlock",
        "titleBlock",
        <div className="project-visibility-title-block">
          <h2 id="project-visibility-title">
            <span>WHY OUR PROJECTS</span>
            <span>
              ARE <em>REAL-TIME VISIBLE</em>
            </span>
          </h2>
          <p>Every data change, project action, and contributor role is recorded, traceable, and visible in real time.</p>
        </div>,
      )}

      {visibilityFeatures.map((feature) =>
        renderLayer(
          feature.layerKey,
          feature.layerKey,
          <article
            className={`project-visibility-feature-card ${feature.className} project-visibility-tone-${feature.tone}`}
          >
            <div className="project-visibility-feature-icon" aria-hidden="true">
              <VisibilityIcon name={feature.icon} />
            </div>
            <h3>
              <span className="project-visibility-feature-number">{formatFeatureNumber(feature.number)}</span>
              {feature.title}
            </h3>
            <span className="project-visibility-feature-rule" aria-hidden="true" />
            <p>{feature.body}</p>
          </article>,
          `project-visibility-layer-${feature.layerKey}`,
        ),
      )}

      {renderLayer(
        "summary",
        "summary",
        <p className="project-visibility-summary">
          <span className="project-visibility-summary-item">
            <span className="project-visibility-summary-icon" aria-hidden="true">
              <VisibilityIcon name="clock" />
            </span>
            <span>
              Real-time <em>visibility.</em>
            </span>
          </span>
          <span className="project-visibility-summary-divider" aria-hidden="true" />
          <span className="project-visibility-summary-item">
            <span className="project-visibility-summary-icon" aria-hidden="true">
              <VisibilityIcon name="shield" />
            </span>
            <span>
              Full <em>traceability.</em>
            </span>
          </span>
          <span className="project-visibility-summary-divider" aria-hidden="true" />
          <span className="project-visibility-summary-item">
            <span className="project-visibility-summary-icon" aria-hidden="true">
              <VisibilityIcon name="lock" />
            </span>
            <span>
              Secure <em>control.</em>
            </span>
          </span>
        </p>,
      )}
    </section>
  );
}
