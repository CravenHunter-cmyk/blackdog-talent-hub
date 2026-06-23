import Image from "next/image";
import type { CSSProperties } from "react";

type BlockLayout = {
  left: number;
  top: number;
  width: number;
};

type SummaryLayout = {
  right: number;
  bottom: number;
  width: number;
};

type PlatformIconName =
  | "people"
  | "globe"
  | "delivery"
  | "shield"
  | "eye"
  | "platform"
  | "workflow"
  | "lock"
  | "qa";

const WHY_LAYOUT = {
  mainTitle: { left: 3.2, top: 9.2, width: 35.5 },
  point01: { left: 40.6, top: 12.8, width: 19.2 },
  point02: { left: 16.2, top: 60.2, width: 24.2 },
  point03: { left: 35.3, top: 108.8, width: 23.8 },
  summary: { right: 160, bottom: 130, width: 480 },
} as const;

const WHY_POINTS = [
  {
    key: "point01",
    index: "01",
    label: "AI Matching",
    title: "AI Matches Both Sides",
    description:
      "BlackDog Brain understands the project and each talent profile, then recommends the right people, language pool, and delivery setup.",
    layout: WHY_LAYOUT.point01,
  },
  {
    key: "point02",
    index: "02",
    label: "Talent Intelligence",
    title: "Talent You Can See and Choose",
    description:
      "Clients can view profiles, education, experience, past projects, availability, and communicate directly when needed.",
    layout: WHY_LAYOUT.point02,
  },
  {
    key: "point03",
    index: "03",
    label: "Project Visibility",
    title: "Every Update in Real Time",
    description:
      "Your team can monitor live talent status, QA records, delivery progress, project risks, and ETA anytime — every update is visible and traceable.",
    layout: WHY_LAYOUT.point03,
  },
] as const;

const PROOF_METRICS: Array<{
  value: string;
  label: string;
  icon: PlatformIconName;
}> = [
  { value: "96", label: "Countries / Regions", icon: "globe" },
  { value: "89", label: "Evaluation Workflows", icon: "workflow" },
  { value: "1", label: "Connected Platform", icon: "platform" },
];

function blockStyle(layout: BlockLayout): CSSProperties {
  return {
    left: `${layout.left}%`,
    top: `${layout.top}%`,
    width: `${layout.width}%`,
  };
}

function summaryStyle(layout: SummaryLayout): CSSProperties {
  return {
    right: layout.right,
    bottom: layout.bottom,
    width: layout.width,
  };
}

function PlatformIcon({ name }: { name: PlatformIconName }) {
  if (name === "people") {
    return (
      <svg viewBox="0 0 24 24" className="why-platform-icon-svg" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M3.5 19c.8-3.4 2.8-5.2 5.7-5.2s4.9 1.8 5.7 5.2" />
        <path d="M13.5 14.8c2.8.3 4.8 1.7 5.9 4.2" />
      </svg>
    );
  }

  if (name === "globe") {
    return (
      <svg viewBox="0 0 24 24" className="why-platform-icon-svg" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.8 12h16.4" />
        <path d="M12 3.5c2.2 2.4 3.3 5.2 3.3 8.5s-1.1 6.1-3.3 8.5" />
        <path d="M12 3.5C9.8 5.9 8.7 8.7 8.7 12s1.1 6.1 3.3 8.5" />
      </svg>
    );
  }

  if (name === "delivery") {
    return (
      <svg viewBox="0 0 24 24" className="why-platform-icon-svg" aria-hidden="true">
        <path d="M4 7.5h10v9H4z" />
        <path d="M14 10h3.7l2.3 2.8v3.7h-6" />
        <circle cx="7.5" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" className="why-platform-icon-svg" aria-hidden="true">
        <path d="M12 3.7 19 6v5.4c0 4.4-2.7 7.4-7 9-4.3-1.6-7-4.6-7-9V6z" />
        <path d="m8.8 12.1 2.1 2.1 4.4-4.8" />
      </svg>
    );
  }

  if (name === "eye") {
    return (
      <svg viewBox="0 0 24 24" className="why-platform-icon-svg" aria-hidden="true">
        <path d="M3.5 12s3-5.2 8.5-5.2 8.5 5.2 8.5 5.2-3 5.2-8.5 5.2S3.5 12 3.5 12z" />
        <circle cx="12" cy="12" r="2.6" />
      </svg>
    );
  }

  if (name === "workflow") {
    return (
      <svg viewBox="0 0 24 24" className="why-platform-icon-svg" aria-hidden="true">
        <path d="M6 6h4v4H6zM14 14h4v4h-4zM14 6h4v4h-4zM8 10v2.5c0 1.1.9 2 2 2h4" />
      </svg>
    );
  }

  if (name === "lock") {
    return (
      <svg viewBox="0 0 24 24" className="why-platform-icon-svg" aria-hidden="true">
        <path d="M7 10V8a5 5 0 0 1 10 0v2" />
        <path d="M5.5 10h13v10h-13z" />
        <path d="M12 14v2.5" />
      </svg>
    );
  }

  if (name === "qa") {
    return (
      <svg viewBox="0 0 24 24" className="why-platform-icon-svg" aria-hidden="true">
        <path d="M5 5h14v10H8l-3 3z" />
        <path d="m9 10 2 2 4-4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="why-platform-icon-svg" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 9h8M8 13h5" />
      <path d="M16 13h.01" />
    </svg>
  );
}

export function WhyBlackDogSection() {
  return (
    <div className="why-choose-blackdog-stack" aria-label="Why Choose BlackDog">
      <section className="why-blackdog-section" aria-labelledby="why-blackdog-title">
        <div className="why-blackdog-stage">
          <div className="why-blackdog-block why-blackdog-main-title" style={blockStyle(WHY_LAYOUT.mainTitle)}>
            <div className="why-blackdog-copy-main">
              <p className="why-blackdog-eyebrow">
                <Image
                  src="/images/Logo_icon_tight.png"
                  alt=""
                  width={34}
                  height={34}
                  className="why-blackdog-eyebrow-paw"
                />
                <span className="why-blackdog-eyebrow-why">Why</span>
                <span className="why-blackdog-eyebrow-choose">Choose</span>
              </p>
              <h2 id="why-blackdog-title" className="why-blackdog-title">
                <span className="why-blackdog-title-gradient">BlackDog</span>
              </h2>
              <p className="why-blackdog-subtitle">
                One platform to match expert talent, evaluate AI outputs, and track delivery with full visibility.
              </p>
            </div>
          </div>

          {WHY_POINTS.map((point) => {
            return (
              <article
                className={`why-blackdog-block why-blackdog-point why-blackdog-${point.key}`}
                key={point.key}
                style={blockStyle(point.layout)}
              >
                <div className="why-blackdog-block-body">
                  <span className="why-blackdog-point-index">{point.index}</span>
                  <h3>{point.label}</h3>
                  <p>
                    <strong>{point.title}</strong>
                  </p>
                  <p>{point.description}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="why-proof-metrics" style={summaryStyle(WHY_LAYOUT.summary)}>
          {PROOF_METRICS.map((metric) => (
            <div className="why-proof-metric" key={metric.label}>
              <span className="why-proof-metric-icon">
                <PlatformIcon name={metric.icon} />
              </span>
              <span className="why-proof-metric-copy">
                <strong className="why-proof-metric-value">{metric.value}</strong>
                <span className="why-proof-metric-label">{metric.label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
