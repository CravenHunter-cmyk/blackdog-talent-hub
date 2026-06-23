"use client";

import { BlackDogLogo } from "@/components/brand/BlackDogLogo";
import type { CSSProperties } from "react";

type ProfileIconName = "calendar" | "chart" | "education" | "folder" | "globe" | "layers" | "location" | "verified" | "work";
type CommunicationIconName = "calendar" | "check" | "clock" | "need" | "shield" | "thinking";
type BrainIconName = "brain" | "database" | "match" | "performance" | "skill" | "star" | "target" | "user" | "warning";
type LeftCardId = "clientNeed" | "talentThinking" | "platformCommunication";
type LeftCardLayout = Record<LeftCardId, { left: number; top: number; width: number }>;
type BrainLayerId =
  | "brainHeading"
  | "dataSignals"
  | "skillMapping"
  | "performanceModeling"
  | "matchCalculation"
  | "matchScore"
  | "bestFit"
  | "strengths"
  | "riskNote"
  | "recommendedRole";
type BrainLayerLayout = Record<BrainLayerId, { left: number; top: number; width: number }>;

const expertiseTags = ["Search & Relevance", "Localization & QA", "E-commerce", "AI & LLM Evaluation"];

const DEFAULT_LEFT_CARD_LAYOUT: LeftCardLayout = {
  clientNeed: { left: 12.495535714285714, top: 15.618449571423177, width: 16.17138206845238 },
  talentThinking: { left: 18.365069289434526, top: 47.00073632141374, width: 13.474881417410714 },
  platformCommunication: { left: 18.24096447172619, top: 65.3719669221765, width: 13.403383091517858 },
};

const DEFAULT_BRAIN_LAYOUT: BrainLayerLayout = {
  brainHeading: { left: 67.61578776041667, top: 8.597862779896538, width: 24.5 },
  dataSignals: { left: 69.39568219866071, top: 38.098610429332034, width: 9.4 },
  skillMapping: { left: 91.29750744047621, top: 38.08183362912056, width: 5.473837425595238 },
  performanceModeling: { left: 69.30930524553571, top: 22.874360910772943, width: 10.6 },
  matchCalculation: { left: 91.19795851934524, top: 22.88757693614772, width: 5 },
  matchScore: { left: 80.74755161830358, top: 47.3829173432013, width: 8.008775111607143 },
  bestFit: { left: 67.041, top: 60.224, width: 28.2 },
  strengths: { left: 71.106, top: 66.368, width: 8.8 },
  riskNote: { left: 79.854, top: 66.466, width: 8.414 },
  recommendedRole: { left: 88.274, top: 66.606, width: 8.56 },
};

const TALENT_PROFILE_INNER_SCALE = 0.88;
const BRAIN_RESULT_CARD_SCALE = 0.86;

const talentProfileInnerScaleStyle: CSSProperties = {
  width: `${100 / TALENT_PROFILE_INNER_SCALE}%`,
  transform: `scale(${TALENT_PROFILE_INNER_SCALE})`,
  transformOrigin: "top left",
};

const brainResultCardScaleStyle: CSSProperties = {
  transform: `scale(${BRAIN_RESULT_CARD_SCALE})`,
  transformOrigin: "top center",
};

const performanceMetrics = [
  { value: "186", label: ["Tasks", "Completed"] },
  { value: "920h", label: ["Delivered", "Hours"] },
  { value: "97.8%", label: ["Avg. QA", "Score"] },
  { value: "98.6%", label: ["On-time", "Rate"] },
];

const projectExperience = [
  { name: "LLM Response Evaluation", level: "Advanced" },
  { name: "Search Relevance Review", level: "Advanced" },
  { name: "Localization QA (Korean/EN/EU)", level: "Advanced" },
  { name: "Multilingual Safety Review", level: "Intermediate" },
];

function ProfileIcon({ name }: { name: ProfileIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" className="talent-profile-icon-svg" aria-hidden="true">
      {name === "calendar" && (
        <>
          <path d="M7 3.5v3M17 3.5v3M5 8h14" {...common} />
          <rect x="4" y="5.5" width="16" height="15" rx="2.2" {...common} />
          <path d="M8 12h3M8 16h6" {...common} />
        </>
      )}
      {name === "location" && (
        <>
          <path d="M12 21s6.5-5.2 6.5-11A6.5 6.5 0 0 0 5.5 10C5.5 15.8 12 21 12 21Z" {...common} />
          <circle cx="12" cy="10" r="2.2" {...common} />
        </>
      )}
      {name === "education" && (
        <>
          <path d="m3.5 8.5 8.5-4 8.5 4-8.5 4-8.5-4Z" {...common} />
          <path d="M6.5 10.2v4.2c2.8 2.1 8.2 2.1 11 0v-4.2" {...common} />
          <path d="M20.5 8.5v5" {...common} />
        </>
      )}
      {name === "globe" && (
        <>
          <circle cx="12" cy="12" r="8.5" {...common} />
          <path d="M3.8 12h16.4M12 3.5c2.2 2.3 3.2 5.1 3.2 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.2-5.1-3.2-8.5S9.8 5.8 12 3.5Z" {...common} />
        </>
      )}
      {name === "work" && (
        <>
          <rect x="4" y="7" width="16" height="12" rx="2" {...common} />
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 12h16" {...common} />
        </>
      )}
      {name === "layers" && (
        <>
          <path d="m12 3.5 8 4-8 4-8-4 8-4Z" {...common} />
          <path d="m4 12 8 4 8-4M4 16.5l8 4 8-4" {...common} />
        </>
      )}
      {name === "chart" && (
        <>
          <path d="M4 20V5M4 20h16" {...common} />
          <path d="M7 15.5 10.5 12l3 2.4L18.5 8" {...common} />
          <path d="M18.5 8v4.2M14.3 8h4.2" {...common} />
        </>
      )}
      {name === "folder" && (
        <>
          <path d="M3.8 7.2h6l1.6 2h8.8v8.6a2 2 0 0 1-2 2H5.8a2 2 0 0 1-2-2V7.2Z" {...common} />
          <path d="M3.8 10h16.4" {...common} />
        </>
      )}
      {name === "verified" && (
        <>
          <path d="M12 3.4 19 6v5.5c0 4.1-2.8 7-7 8.7-4.2-1.7-7-4.6-7-8.7V6l7-2.6Z" {...common} />
          <path d="m9.2 12.2 1.8 1.8 3.9-4.2" {...common} />
        </>
      )}
    </svg>
  );
}

function CommunicationIcon({ name }: { name: CommunicationIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" className="talent-comm-icon" aria-hidden="true">
      {name === "need" && (
        <>
          <path d="M7 4.5h7.5L19 9v9.5A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5V6a1.5 1.5 0 0 1 2-1.5Z" {...common} />
          <path d="M14.5 4.7V9H19M8 12l2 2 4-4" {...common} />
          <circle cx="17.7" cy="17.2" r="2.4" {...common} />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="8.2" {...common} />
          <path d="M12 7.5V12l3.1 2" {...common} />
        </>
      )}
      {name === "calendar" && (
        <>
          <path d="M7 3.8v3M17 3.8v3M5 9h14" {...common} />
          <rect x="4" y="6" width="16" height="14" rx="2.2" {...common} />
        </>
      )}
      {name === "thinking" && (
        <>
          <path d="M5 6.5h14v9H9l-4 3v-12Z" {...common} />
          <path d="M8.5 10.8h.1M12 10.8h.1M15.5 10.8h.1" {...common} />
        </>
      )}
      {name === "shield" && (
        <>
          <path d="M12 3.8 18.5 6v5.2c0 4-2.6 6.8-6.5 8.7-3.9-1.9-6.5-4.7-6.5-8.7V6L12 3.8Z" {...common} />
          <path d="M12 8.5v4.2M12 15.4h.1" {...common} />
        </>
      )}
      {name === "check" && <path d="m5 12.5 4 4L19 6.8" {...common} />}
    </svg>
  );
}

function BrainIcon({ name }: { name: BrainIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 48 48" className="talent-brain-icon" aria-hidden="true">
      {name === "brain" && (
        <>
          <path d="M18.5 7.5c-4 0-7 3.1-7 7 0 .6.1 1.3.3 1.9A7.7 7.7 0 0 0 6 24c0 4.3 3.5 7.8 7.8 7.8h1.1v4.1c0 2.6 2.1 4.6 4.6 4.6 2.7 0 4.9-2.2 4.9-4.9V12.9c0-3-2.5-5.4-5.9-5.4Z" {...common} />
          <path d="M29.5 7.5c4 0 7 3.1 7 7 0 .6-.1 1.3-.3 1.9A7.7 7.7 0 0 1 42 24c0 4.3-3.5 7.8-7.8 7.8h-1.1v4.1c0 2.6-2.1 4.6-4.6 4.6-2.7 0-4.9-2.2-4.9-4.9V12.9c0-3 2.5-5.4 5.9-5.4Z" {...common} />
          <path d="M13 18.2h6M11.8 28.1h6.5M29.5 18.2H35M29.7 28.1h6.5M20 35.5h4M24 16.2h-4.5M24 25.5h-5.8M24 34h-4M28 35.5h-4M24 16.2h4.5M24 25.5h5.8M24 34h4" {...common} />
        </>
      )}
      {name === "database" && (
        <>
          <ellipse cx="20" cy="12" rx="10" ry="5" {...common} />
          <path d="M10 12v20c0 2.8 4.5 5 10 5s10-2.2 10-5V12" {...common} />
          <path d="M10 22c0 2.8 4.5 5 10 5s10-2.2 10-5M35 33V20M40 33V14M45 33V8" {...common} />
        </>
      )}
      {name === "skill" && (
        <>
          <rect x="8" y="12" width="32" height="26" rx="4" {...common} />
          <path d="M16 20h.2M24 20h.2M32 20h.2M16 27h.2M24 27h.2M32 27h.2M16 34h.2M24 34h.2M32 34h.2" {...common} />
          <path d="M37 20h4M37 27h4M37 34h4" {...common} />
        </>
      )}
      {name === "performance" && (
        <>
          <path d="M8 39V12M8 39h31" {...common} />
          <path d="m12 31 7-8 6 5 11-14" {...common} />
          <path d="M34 14h5v5M13 18h5M13 23h3M31 30h8M31 35h8" {...common} />
        </>
      )}
      {name === "match" && (
        <>
          <circle cx="18" cy="24" r="10" {...common} />
          <path d="M18 17v8l5 3M33 17h9M33 24h9M33 31h9" {...common} />
          <path d="M30 17h.2M30 24h.2M30 31h.2" {...common} />
        </>
      )}
      {name === "target" && (
        <>
          <circle cx="22" cy="26" r="13" {...common} />
          <circle cx="22" cy="26" r="7" {...common} />
          <circle cx="22" cy="26" r="2.2" {...common} />
          <path d="M31 17 41 7M34 7h7v7" {...common} />
        </>
      )}
      {name === "star" && (
        <path
          d="m24 6.5 5.2 10.6 11.8 1.7-8.5 8.3 2 11.7L24 33.3 13.5 38.8l2-11.7L7 18.8l11.8-1.7L24 6.5Z"
          {...common}
        />
      )}
      {name === "warning" && (
        <>
          <path d="m24 7 17 31H7L24 7Z" {...common} />
          <path d="M24 18v9M24 34h.2" {...common} />
        </>
      )}
      {name === "user" && (
        <>
          <circle cx="24" cy="16" r="6" {...common} />
          <path d="M12 39c1.8-7.1 6-10.5 12-10.5S34.2 31.9 36 39" {...common} />
        </>
      )}
    </svg>
  );
}

export function TalentIntelligenceSection() {
  function getLeftCardStyle(id: LeftCardId): CSSProperties {
    const layer = DEFAULT_LEFT_CARD_LAYOUT[id];
    return {
      left: `${layer.left}%`,
      top: `${layer.top}%`,
      width: `${layer.width}%`,
    };
  }

  function getBrainLayerStyle(id: BrainLayerId): CSSProperties {
    const layer = DEFAULT_BRAIN_LAYOUT[id];
    return {
      left: `${layer.left}%`,
      top: `${layer.top}%`,
      width: `${layer.width}%`,
    };
  }

  function getBrainResultCardStyle(id: Extract<BrainLayerId, "strengths" | "riskNote" | "recommendedRole">): CSSProperties {
    return {
      ...getBrainLayerStyle(id),
      ...brainResultCardScaleStyle,
    };
  }

  return (
    <section className="talent-intelligence-section" aria-label="Talent intelligence profile">
      <div className="talent-intelligence-background" aria-hidden="true" />

      <header className="talent-intelligence-header">
        <h2>
          <span>SEE THE TALENT,</span>
          <span>TRUST THE MATCH.</span>
        </h2>
      </header>

      <div className="talent-intelligence-comm-stack" aria-label="Talent communication context">
        <section
          className="talent-communication-card talent-communication-card-need"
          aria-label="Client need"
          style={getLeftCardStyle("clientNeed")}
        >
          <i className="talent-cloud-dot talent-cloud-dot-large" aria-hidden="true" />
          <i className="talent-cloud-dot talent-cloud-dot-small" aria-hidden="true" />
          <div className="talent-cloud-content">
            <div className="talent-cloud-heading">
              <CommunicationIcon name="need" />
              <span>CLIENT NEED</span>
            </div>
            <strong>Korean Localization QA</strong>
            <div className="talent-cloud-meta">
              <span>
                <CommunicationIcon name="clock" />
                5–6 hrs/day
              </span>
              <span>
                <CommunicationIcon name="calendar" />
                Start Monday
              </span>
            </div>
          </div>
        </section>

        <section
          className="talent-communication-card talent-communication-card-thinking"
          aria-label="Talent thinking"
          style={getLeftCardStyle("talentThinking")}
        >
          <div className="talent-card-heading">
            <CommunicationIcon name="thinking" />
            <span>TALENT THINKING</span>
          </div>
          <ul className="talent-check-list">
            <li>
              <span>Relevant experience</span>
              <CommunicationIcon name="check" />
            </li>
            <li>
              <span>Available next week</span>
              <CommunicationIcon name="check" />
            </li>
            <li>
              <span>Can support QA review</span>
              <CommunicationIcon name="check" />
            </li>
          </ul>
        </section>

        <section
          className="talent-communication-card talent-communication-card-platform"
          aria-label="Platform communication"
          style={getLeftCardStyle("platformCommunication")}
        >
          <div className="talent-card-heading">
            <CommunicationIcon name="shield" />
            <span>
              PLATFORM
              <br />
              COMMUNICATION
            </span>
          </div>
          <p>All communication happens inside BlackDog.</p>
          <p>No personal contact details are exposed.</p>
        </section>
      </div>

      <article className="talent-profile-card" aria-label="Verified talent profile">
        <div className="talent-profile-inner" style={talentProfileInnerScaleStyle}>
          <header className="talent-profile-header">
            <h3>Elena Kovács</h3>
            <p>
              <span>
                <ProfileIcon name="calendar" />
                28 years old
              </span>
              <i aria-hidden="true">·</i>
              <span>
                <ProfileIcon name="location" />
                Budapest, Hungary
              </span>
            </p>
          </header>

          <div className="talent-profile-body">
            <section className="talent-profile-section talent-profile-section-education">
              <div className="talent-profile-section-label">
                <ProfileIcon name="education" />
                <h4>EDUCATION</h4>
              </div>
              <div className="talent-profile-section-content">
                <strong>M.A. in Linguistics</strong>
                <p>Eötvös Loránd University, Hungary</p>
                <p>Graduated: 2017</p>
              </div>
            </section>

            <section className="talent-profile-section talent-profile-section-languages">
              <div className="talent-profile-section-label">
                <ProfileIcon name="globe" />
                <h4>LANGUAGES</h4>
              </div>
              <div className="talent-profile-language-grid">
                <span>
                  <strong>Hungarian</strong>
                  <em>Native</em>
                </span>
                <span>
                  <strong>English</strong>
                  <em>C1</em>
                </span>
                <span>
                  <strong>German</strong>
                  <em>B2</em>
                </span>
                <span>
                  <strong>Korean</strong>
                  <em>A2</em>
                </span>
              </div>
            </section>

            <section className="talent-profile-section talent-profile-section-work">
              <div className="talent-profile-section-label">
                <ProfileIcon name="work" />
                <h4>
                  WORK
                  <span>EXPERIENCE</span>
                </h4>
              </div>
              <div className="talent-profile-section-content">
                <strong>5+ years in multilingual evaluation</strong>
                <ul>
                  <li>3 years in AI model evaluation projects</li>
                  <li>EU market localization experience</li>
                </ul>
              </div>
            </section>

            <section className="talent-profile-section talent-profile-section-expertise">
              <div className="talent-profile-section-label">
                <ProfileIcon name="layers" />
                <h4>
                  VERTICAL
                  <span>EXPERTISE</span>
                </h4>
              </div>
              <div className="talent-profile-pill-grid">
                {expertiseTags.map((tag) => (
                  <span className="talent-profile-pill" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section className="talent-profile-section talent-profile-section-metrics">
              <div className="talent-profile-section-label">
                <ProfileIcon name="chart" />
                <h4>PERFORMANCE METRICS</h4>
              </div>
              <div className="talent-profile-metrics">
                {performanceMetrics.map((metric) => (
                  <span className="talent-profile-metric" key={metric.value}>
                    <strong>{metric.value}</strong>
                    <em>
                      {metric.label[0]}
                      <span>{metric.label[1]}</span>
                    </em>
                  </span>
                ))}
              </div>
            </section>

            <section className="talent-profile-section talent-profile-section-projects">
              <div className="talent-profile-section-label">
                <ProfileIcon name="folder" />
                <h4>PROJECT EXPERIENCE (RECENT)</h4>
              </div>
              <div className="talent-profile-projects">
                <ul className="talent-profile-project-list">
                  {projectExperience.map((project) => (
                    <li className="talent-profile-project-row" key={project.name}>
                      <span>{project.name}</span>
                      <em className="talent-profile-level-pill">{project.level}</em>
                    </li>
                  ))}
                </ul>
                <aside className="talent-profile-verified-card">
                  <ProfileIcon name="verified" />
                  <strong>VERIFIED</strong>
                  <span>Work History</span>
                </aside>
              </div>
            </section>
          </div>
        </div>
      </article>

      <div className="talent-brain-overlay" aria-label="BlackDog Brain analysis">
        <section
          className="talent-brain-layer talent-brain-heading-layer"
          style={getBrainLayerStyle("brainHeading")}
        >
          <BrainIcon name="brain" />
          <div>
            <span>BLACKDOG BRAIN</span>
            <strong>AI MATCH ANALYSIS</strong>
          </div>
        </section>

        <section
          className="talent-brain-layer talent-brain-signal-layer"
          style={getBrainLayerStyle("dataSignals")}
        >
          <h4>
            DATA
            <span>SIGNALS</span>
          </h4>
        </section>

        <section
          className="talent-brain-layer talent-brain-signal-layer"
          style={getBrainLayerStyle("skillMapping")}
        >
          <h4>
            SKILL
            <span>MAPPING</span>
          </h4>
        </section>

        <section
          className="talent-brain-layer talent-brain-signal-layer"
          style={getBrainLayerStyle("performanceModeling")}
        >
          <h4>
            PERFORMANCE
            <span>MODELING</span>
          </h4>
        </section>

        <section
          className="talent-brain-layer talent-brain-signal-layer"
          style={getBrainLayerStyle("matchCalculation")}
        >
          <h4>
            MATCH
            <span>CALCULATION</span>
          </h4>
        </section>

        <section
          className="talent-brain-layer talent-brain-score-layer"
          style={getBrainLayerStyle("matchScore")}
        >
          <strong>
            94<span>%</span>
          </strong>
          <em>MATCH SCORE</em>
        </section>

        <section
          className="talent-brain-layer talent-brain-bestfit-layer"
          style={getBrainLayerStyle("bestFit")}
        >
          <BrainIcon name="target" />
          <div>
            <h4>BEST FIT FOR</h4>
            <p>LLM Evaluation · Search Review · Localization QA</p>
          </div>
        </section>

        <section
          className="talent-brain-layer talent-brain-result-card"
          style={getBrainResultCardStyle("strengths")}
        >
          <BrainIcon name="star" />
          <h4>STRENGTHS</h4>
          <p>
            High consistency
            <span>Cultural judgment</span>
            <span>Structured reasoning</span>
          </p>
        </section>

        <section
          className="talent-brain-layer talent-brain-result-card"
          style={getBrainResultCardStyle("riskNote")}
        >
          <BrainIcon name="warning" />
          <h4>RISK NOTE</h4>
          <p>
            Limited overnight
            <span>availability for</span>
            <span>Asia time zones</span>
          </p>
        </section>

        <section
          className="talent-brain-layer talent-brain-result-card"
          style={getBrainResultCardStyle("recommendedRole")}
        >
          <BrainIcon name="user" />
          <h4>RECOMMENDED ROLE</h4>
          <p>
            Senior Reviewer
            <span>QA Lead Candidate</span>
          </p>
        </section>
      </div>

      <div className="talent-intelligence-brand-bar">
        <div className="talent-intelligence-brand-left">
          <span className="talent-intelligence-brand-lock" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="6.5" y="10" width="11" height="9" rx="1.8" />
              <path d="M9 10V7.8a3 3 0 0 1 6 0V10" />
              <path d="M12 13.4v2.4" />
            </svg>
          </span>
          <strong>SEE THE TALENT · TRUST THE MATCH · WORK INSIDE BLACKDOG</strong>
        </div>
        <div className="talent-intelligence-brand-right">
          <BlackDogLogo size="md" tone="white" />
        </div>
      </div>
    </section>
  );
}
