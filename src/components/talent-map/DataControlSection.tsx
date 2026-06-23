import { BlackDogLogo } from "@/components/brand/BlackDogLogo";

type IconName =
  | "database"
  | "cloud"
  | "server"
  | "shield"
  | "lock"
  | "monitor"
  | "qa"
  | "file"
  | "settlement"
  | "search"
  | "task"
  | "delivery"
  | "shieldOutline"
  | "role"
  | "isolation"
  | "logs"
  | "protection";

type SystemItem = {
  icon: IconName;
  title: string;
  description: string;
};

type ProofItem = {
  index: string;
  titleLines: [string, string];
  description: string;
  image: string;
  imageAlt: string;
};

const clientEnvironment: SystemItem[] = [
  {
    icon: "database",
    title: "Databases",
    description: "Stay in your environment.",
  },
  {
    icon: "cloud",
    title: "Cloud Storage",
    description: "Your cloud or private cloud.",
  },
  {
    icon: "server",
    title: "Internal Systems",
    description: "Connect your systems.",
  },
];

const clientSystems: SystemItem[] = [
  {
    icon: "monitor",
    title: "Progress Dashboard",
    description: "Real-time progress and status",
  },
  {
    icon: "qa",
    title: "QA Results",
    description: "Quality results and reports",
  },
  {
    icon: "file",
    title: "Talent & Task Data",
    description: "Talent status and task records",
  },
  {
    icon: "settlement",
    title: "Settlement Records",
    description: "Work hours, invoices, and settlement data",
  },
];

const flowNodes: Array<{ icon: IconName; label: string }> = [
  { icon: "search", label: "Talent Matching" },
  { icon: "task", label: "Task Execution" },
  { icon: "qa", label: "QA Review" },
  { icon: "delivery", label: "Delivery Tracking" },
];

const securityCapabilities: Array<{ icon: IconName; label: string }> = [
  { icon: "role", label: "Role-based Access" },
  { icon: "isolation", label: "Project-level Isolation" },
  { icon: "logs", label: "Activity Logs" },
  { icon: "protection", label: "Data Protection" },
];

const connectorNotes = ["Encrypted Connection", "Permission Controlled", "Audit Tracked"];

const proofItems: ProofItem[] = [
  {
    index: "01",
    titleLines: ["Client-owned", "Data"],
    description:
      "Project data can remain in the client's own database, cloud storage, private cloud, or approved environment.",
    image: "/images/data-control-client-owned.png?v=20260605-1815",
    imageAlt: "Database cylinder with a shield",
  },
  {
    index: "02",
    titleLines: ["Flexible", "Deployment"],
    description:
      "Support for SaaS, private deployment, or hybrid integration based on the client's security and workflow requirements.",
    image: "/images/data-control-deployment.png?v=20260605-1815",
    imageAlt: "Cloud server deployment with a shield",
  },
  {
    index: "03",
    titleLines: ["Integrated Delivery", "Records"],
    description:
      "Tasks, progress, QA results, talent status, work hours, and settlement records can sync with client systems through APIs.",
    image: "/images/data-control-api-records.png?v=20260605-1815",
    imageAlt: "Data dashboard laptop with API block",
  },
];

function DataControlIcon({ name }: { name: IconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" className="data-control-icon-svg" aria-hidden="true">
      {name === "database" && (
        <>
          <ellipse cx="12" cy="5.5" rx="6.5" ry="2.7" {...common} />
          <path d="M5.5 5.5v9.2c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8V5.5" {...common} />
          <path d="M5.5 10.1c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8" {...common} />
        </>
      )}
      {name === "cloud" && (
        <path d="M7.3 18h9.9a4 4 0 0 0 .5-8 6.2 6.2 0 0 0-11.8-1.4A4.8 4.8 0 0 0 7.3 18Z" {...common} />
      )}
      {name === "server" && (
        <>
          <rect x="5" y="4" width="14" height="5" rx="1.4" {...common} />
          <rect x="5" y="15" width="14" height="5" rx="1.4" {...common} />
          <path d="M8 6.5h.1M8 17.5h.1M12 9v6" {...common} />
        </>
      )}
      {name === "shield" && (
        <>
          <path d="M12 3.5 19 6v5.6c0 4.2-2.8 7.1-7 8.9-4.2-1.8-7-4.7-7-8.9V6l7-2.5Z" {...common} />
          <path d="m9.2 12.2 1.9 1.9 3.9-4.2" {...common} />
        </>
      )}
      {name === "shieldOutline" && (
        <path d="M12 2.8 20.4 6v6.7c0 5-3.4 8.6-8.4 10.6-5-2-8.4-5.6-8.4-10.6V6L12 2.8Z" {...common} />
      )}
      {name === "lock" && (
        <>
          <rect x="6.7" y="10" width="10.6" height="8.5" rx="1.7" {...common} />
          <path d="M9 10V7.8a3 3 0 0 1 6 0V10" {...common} />
          <path d="M12 13.3v2" {...common} />
        </>
      )}
      {name === "monitor" && (
        <>
          <rect x="4" y="5" width="16" height="11" rx="1.8" {...common} />
          <path d="M8 20h8M12 16v4M8 12l2.3-2.2 2 1.8 3.7-4" {...common} />
        </>
      )}
      {name === "qa" && (
        <>
          <path d="M12 3.5 19 6v5.7c0 4.1-2.8 7-7 8.8-4.2-1.8-7-4.7-7-8.8V6l7-2.5Z" {...common} />
          <path d="M9 12h.1M12 12h.1M15 12h.1" {...common} />
        </>
      )}
      {name === "file" && (
        <>
          <path d="M7 3.8h6.2L17 7.6v12.6H7V3.8Z" {...common} />
          <path d="M13 3.8v4h4M9.5 12h5M9.5 15.5h5" {...common} />
        </>
      )}
      {name === "settlement" && (
        <>
          <circle cx="12" cy="12" r="7.5" {...common} />
          <path d="M12 7.8v8.4M15 9.5c-.7-.7-1.7-1-3-1-1.5 0-2.5.7-2.5 1.8 0 2.8 5.2 1.2 5.2 4 0 1.2-1.1 2-2.7 2-1.4 0-2.6-.4-3.4-1.2" {...common} />
        </>
      )}
      {name === "search" && (
        <>
          <circle cx="10.8" cy="10.8" r="4.8" {...common} />
          <path d="m14.4 14.4 4.1 4.1" {...common} />
          <circle cx="10.8" cy="10.8" r="1.5" {...common} />
        </>
      )}
      {name === "task" && (
        <>
          <rect x="6" y="5" width="12" height="15" rx="1.8" {...common} />
          <path d="M9.5 4h5v3h-5zM9.5 11h5M9.5 15h4" {...common} />
        </>
      )}
      {name === "delivery" && (
        <>
          <path d="M5 8.5h10.5v8H5zM15.5 11h2.8l1.7 2.3v3.2h-4.5" {...common} />
          <circle cx="8.2" cy="17.5" r="1.4" {...common} />
          <circle cx="17.6" cy="17.5" r="1.4" {...common} />
          <path d="m9.2 12.5 1.6 1.6 3-3.1" {...common} />
        </>
      )}
      {name === "role" && (
        <>
          <circle cx="10" cy="8.3" r="2.5" {...common} />
          <path d="M5.5 18.5c.6-3.1 2.4-5 4.5-5s3.9 1.9 4.5 5" {...common} />
          <path d="M17 11.5v6M14 14.5h6" {...common} />
        </>
      )}
      {name === "isolation" && (
        <>
          <path d="M12 3.5 19 6v5.6c0 4.2-2.8 7.1-7 8.9-4.2-1.8-7-4.7-7-8.9V6l7-2.5Z" {...common} />
          <path d="M12 7v10M8.5 11h7" {...common} />
        </>
      )}
      {name === "logs" && (
        <>
          <rect x="6" y="4.5" width="12" height="15" rx="1.8" {...common} />
          <path d="M9 8.8h6M9 12h6M9 15.2h3.5" {...common} />
        </>
      )}
      {name === "protection" && (
        <>
          <rect x="6.5" y="10" width="11" height="8.2" rx="1.6" {...common} />
          <path d="M9 10V7.7a3 3 0 0 1 6 0V10M12 13v2" {...common} />
        </>
      )}
    </svg>
  );
}

function SystemCard({ title, items }: { title: string; items: SystemItem[] }) {
  return (
    <article className="data-control-card">
      <h3>{title}</h3>
      <div className="data-control-card-rule" />
      <div className="data-control-card-list">
        {items.map((item) => (
          <div key={item.title} className="data-control-system-row">
            <span className="data-control-system-icon">
              <DataControlIcon name={item.icon} />
            </span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function Connector() {
  return (
    <div className="data-control-connector" aria-hidden="true">
      <span className="data-control-connector-line" />
      <span className="data-control-connector-lock">
        <DataControlIcon name="lock" />
      </span>
      <div className="data-control-connector-notes">
        {connectorNotes.map((note) => (
          <span key={note}>
            <DataControlIcon name="shield" />
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DataControlSection() {
  return (
    <section className="data-control-section" aria-labelledby="data-control-title">
      <div className="data-control-security-watermark" aria-hidden="true">
        <DataControlIcon name="shieldOutline" />
        <span>
          <DataControlIcon name="lock" />
        </span>
      </div>

      <div className="data-control-header">
        <p>DATA CONTROL & SECURE DELIVERY</p>
        <h2 id="data-control-title">Your data stays where you need it.</h2>
        <span>
          BlackDog connects talent, workflow, progress, and delivery records through a secure
          operating layer.
        </span>
      </div>

      <div className="data-control-architecture" aria-label="Data control and secure delivery architecture">
        <SystemCard title="CLIENT ENVIRONMENT" items={clientEnvironment} />
        <Connector />

        <article className="data-control-layer">
          <div className="data-control-layer-title">
            <span>
              <DataControlIcon name="shield" />
            </span>
            <h3>BLACKDOG SECURE OPERATING LAYER</h3>
          </div>

          <div className="data-control-flow" aria-label="Secure operating workflow">
            {flowNodes.map((node, index) => (
              <div key={node.label} className="data-control-flow-item">
                <span className="data-control-flow-icon">
                  <DataControlIcon name={node.icon} />
                </span>
                <strong>
                  {node.label.split(" ").map((word) => (
                    <span key={`${node.label}-${word}`}>{word}</span>
                  ))}
                </strong>
                {index < flowNodes.length - 1 && <span className="data-control-flow-arrow" aria-hidden="true" />}
              </div>
            ))}
          </div>

          <div className="data-control-layer-rule" />

          <div className="data-control-security-grid">
            {securityCapabilities.map((item) => (
              <div key={item.label} className="data-control-security-item">
                <span>
                  <DataControlIcon name={item.icon} />
                </span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </article>

        <Connector />
        <SystemCard title="CLIENT SYSTEMS" items={clientSystems} />
      </div>

      <div className="data-control-proof-grid">
        {proofItems.map((item) => (
          <article key={item.index} className="data-control-proof-card">
            <div className="data-control-proof-copy">
              <div className="data-control-proof-heading">
                <span>{item.index}</span>
                <h3>
                  {item.titleLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h3>
              </div>
              <p>{item.description}</p>
            </div>
            <div className="data-control-proof-asset">
              <span
                className="data-control-proof-asset-visual"
                role="img"
                aria-label={item.imageAlt}
                style={{ backgroundImage: `url("${item.image}")` }}
              />
            </div>
          </article>
        ))}
      </div>

      <div className="data-control-brand-bar">
        <div className="data-control-brand-left">
          <span className="data-control-brand-shield">
            <DataControlIcon name="lock" />
          </span>
          <strong>SECURE BY DESIGN. CONTROLLED BY YOU. POWERED BY BLACKDOG.</strong>
        </div>
        <div className="data-control-brand-right">
          <BlackDogLogo size="md" tone="white" />
        </div>
      </div>
    </section>
  );
}
