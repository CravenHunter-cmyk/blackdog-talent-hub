import Image from "next/image";
import type { CSSProperties } from "react";
import { WhyWorkflowLoop } from "@/components/talent-map/WhyWorkflowLoop";

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
          <WhyWorkflowLoop />
        </div>
      </section>
    </div>
  );
}
