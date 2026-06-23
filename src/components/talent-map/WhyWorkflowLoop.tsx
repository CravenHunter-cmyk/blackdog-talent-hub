import type { CSSProperties } from "react";

type NodeId = "need" | "match" | "review" | "qa" | "deliver";
type LineId = "needMatch" | "matchReview" | "reviewQa" | "qaDeliver" | "deliverNeed";

type NodeLayout = {
  x: number;
  y: number;
  width: number;
};

type LineLayout = {
  x: number;
  y: number;
  width: number;
  angle: number;
  bend: number;
};

type WorkflowLayout = {
  nodes: Record<NodeId, NodeLayout>;
  lines: Record<LineId, LineLayout>;
};

const WORKFLOW_LAYOUT: WorkflowLayout = {
  nodes: {
    need: { x: 8.3, y: 44.9, width: 27 },
    match: { x: 50.6, y: -29, width: 28 },
    review: { x: 86.5, y: 37.7, width: 28 },
    deliver: { x: 21.5, y: 131.9, width: 30 },
    qa: { x: 75.7, y: 139.7, width: 23 },
  },
  lines: {
    needMatch: { x: 24.2, y: 66.1, width: 31.5, angle: -32.2, bend: -48.9 },
    matchReview: { x: 27.5, y: 132.8, width: 13.4, angle: -116.2, bend: -11.3 },
    reviewQa: { x: 107.1, y: 78.4, width: 21.6, angle: 111.9, bend: -37.1 },
    qaDeliver: { x: 75.5, y: 174.9, width: 26.6, angle: -176.2, bend: -37.5 },
    deliverNeed: { x: 78.1, y: -2, width: 25, angle: 19.1, bend: -33.4 },
  },
};

const WORKFLOW_NODES: Array<{ id: NodeId; label: string; icon: "document" | "people" | "review" | "shield" | "package" }> = [
  { id: "need", label: "Need", icon: "document" },
  { id: "match", label: "Match", icon: "people" },
  { id: "review", label: "Review", icon: "review" },
  { id: "deliver", label: "Deliver", icon: "package" },
  { id: "qa", label: "QA", icon: "shield" },
];

const WORKFLOW_LINES: Array<{ id: LineId }> = [
  { id: "needMatch" },
  { id: "matchReview" },
  { id: "reviewQa" },
  { id: "qaDeliver" },
  { id: "deliverNeed" },
];

function nodeStyle(layout: NodeLayout): CSSProperties {
  return {
    "--workflow-node-x": `${layout.x}%`,
    "--workflow-node-y": `${layout.y}%`,
    "--workflow-node-width": `${layout.width}%`,
  } as CSSProperties;
}

function lineStyle(layout: LineLayout): CSSProperties {
  return {
    "--workflow-line-x": `${layout.x}%`,
    "--workflow-line-y": `${layout.y}%`,
    "--workflow-line-width": `${layout.width}%`,
    "--workflow-line-angle": `${layout.angle}deg`,
  } as CSSProperties;
}

function linePath(layout: LineLayout) {
  return `M 0 50 Q 50 ${50 + layout.bend} 100 50`;
}

function WorkflowIcon({ icon }: { icon: (typeof WORKFLOW_NODES)[number]["icon"] }) {
  if (icon === "document") {
    return (
      <svg viewBox="0 0 16 16">
        <path d="M4.25 2.5h5.25l2.25 2.35v8.65h-7.5z" />
        <path d="M9.5 2.75V5h2.1" />
        <path d="M5.8 7.3h4.4M5.8 9.7h3.5" />
      </svg>
    );
  }

  if (icon === "people") {
    return (
      <svg viewBox="0 0 16 16">
        <circle cx="5.7" cy="5.4" r="2" />
        <circle cx="10.5" cy="5.8" r="1.65" />
        <path d="M2.6 12.4c.5-2 1.55-3 3.1-3s2.6 1 3.1 3" />
        <path d="M8.6 9.8c1.7.2 2.9 1 3.6 2.6" />
      </svg>
    );
  }

  if (icon === "review") {
    return (
      <svg viewBox="0 0 16 16">
        <circle cx="6.4" cy="5.5" r="2.2" />
        <path d="M2.9 12.2c.6-2.1 1.8-3.1 3.5-3.1 1.1 0 2 .42 2.65 1.25" />
        <path d="m10.4 10.4 2.4 2.4" />
        <circle cx="9.8" cy="9.8" r="1.9" />
      </svg>
    );
  }

  if (icon === "package") {
    return (
      <svg viewBox="0 0 16 16">
        <path d="M2.9 5.4 8 2.8l5.1 2.6v5.2L8 13.2l-5.1-2.6z" />
        <path d="M2.9 5.4 8 8l5.1-2.6M8 8v5.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16">
      <path d="M8 2.5 12.6 4v3.6c0 2.65-1.75 4.6-4.6 5.9-2.85-1.3-4.6-3.25-4.6-5.9V4z" />
      <path d="m5.85 7.9 1.45 1.45 2.95-3.2" />
    </svg>
  );
}

export function WhyWorkflowLoop() {
  return (
    <div className="why-proof-workflow" aria-label="Need to Match to Review to QA to Deliver">
      <span className="why-proof-workflow-loop">
        {WORKFLOW_LINES.map((line) => {
          const currentLine = WORKFLOW_LAYOUT.lines[line.id];
          const markerId = `workflow-arrow-${line.id}`;

          return (
            <span
              className={`why-proof-workflow-line why-proof-workflow-line-${line.id}`}
              key={line.id}
              style={lineStyle(currentLine)}
            >
              <svg
                aria-hidden="true"
                className="why-proof-workflow-line-svg"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <defs>
                  <marker
                    id={markerId}
                    markerHeight="8"
                    markerUnits="strokeWidth"
                    markerWidth="8"
                    orient="auto"
                    refX="7"
                    refY="4"
                    viewBox="0 0 8 8"
                  >
                    <path className="why-proof-workflow-line-marker" d="M0 0 8 4 0 8 2 4z" />
                  </marker>
                </defs>
                <path
                  className="why-proof-workflow-line-path"
                  d={linePath(currentLine)}
                  markerEnd={`url(#${markerId})`}
                />
              </svg>
            </span>
          );
        })}

        {WORKFLOW_NODES.map((node) => (
          <span
            className={`why-proof-workflow-node why-proof-workflow-node-${node.id}`}
            key={node.id}
            style={nodeStyle(WORKFLOW_LAYOUT.nodes[node.id])}
          >
            <span className="why-proof-workflow-icon">
              <WorkflowIcon icon={node.icon} />
            </span>
            {node.label}
          </span>
        ))}
      </span>
    </div>
  );
}
