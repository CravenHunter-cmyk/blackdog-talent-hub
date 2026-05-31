"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";

type OwnerTone = "poc" | "pm" | "resource";
type WorkflowNodeId =
  | "client-request"
  | "requirement-alignment"
  | "pilot-clarification"
  | "workflow-finalization"
  | "team-formation"
  | "project-execution"
  | "delivery-review";

type WorkflowStep = {
  id: WorkflowNodeId;
  step: string;
  name: string;
  lead: string;
  people: string;
  description: string;
  output: string;
  tone: OwnerTone;
};

type DiagramNode = {
  x: number;
  y: number;
};

type DragState = {
  index: number;
  offsetX: number;
  offsetY: number;
};

type WorkflowConnectionRoute = "default" | "formation-arc";

type WorkflowConnection = {
  sourceId: WorkflowNodeId;
  targetId: WorkflowNodeId;
  route?: WorkflowConnectionRoute;
};

const DESIGN_CANVAS_WIDTH = 1320;
const DESIGN_CANVAS_HEIGHT = 680;
const VIEWBOX_WIDTH = DESIGN_CANVAS_WIDTH;
const VIEWBOX_HEIGHT = DESIGN_CANVAS_HEIGHT;
const NODE_WIDTH = 202;
const NODE_HEIGHT = 78;
const EDGE_GAP = 14;
const WORKFLOW_LAYOUT_STORAGE_KEY = "blackdog.workflowDiagram.layout.v1";

const workflowSteps: WorkflowStep[] = [
  {
    id: "client-request",
    step: "01",
    name: "Client Request",
    lead: "POC Manager",
    people: "Client + POC Manager",
    description: "Client shares project requirements, rules, samples, timeline, quality expectations, and delivery format.",
    output: "Requirement Brief",
    tone: "poc",
  },
  {
    id: "requirement-alignment",
    step: "02",
    name: "Requirement Alignment",
    lead: "POC Manager",
    people: "POC Manager + Project Manager",
    description: "POC confirms task scope, rule documents, sample cases, timeline, communication rhythm, and open questions.",
    output: "Requirement Summary / Question List",
    tone: "poc",
  },
  {
    id: "pilot-clarification",
    step: "03",
    name: "Pilot & Clarification",
    lead: "Project Manager",
    people: "POC Manager + Project Manager + Client",
    description: "PM and POC run pilot cases, validate rules, identify edge cases, clean unclear points, and confirm standards with the client.",
    output: "Pilot Result / Confirmed Rules",
    tone: "pm",
  },
  {
    id: "workflow-finalization",
    step: "04",
    name: "Workflow Finalization",
    lead: "Project Manager",
    people: "Project Manager + POC Manager + Resource Manager",
    description: "PM finalizes workflow, QA checkpoints, delivery timeline, task template, and required talent profile.",
    output: "Workflow / QA Process / Talent Profile",
    tone: "pm",
  },
  {
    id: "team-formation",
    step: "05",
    name: "Team Formation",
    lead: "Resource Manager",
    people: "Resource Manager + Project Manager",
    description: "Resource Manager builds the delivery team based on language, domain, availability, capacity, and backup needs.",
    output: "Team Roster / Backup Pool",
    tone: "resource",
  },
  {
    id: "project-execution",
    step: "06",
    name: "Project Execution",
    lead: "Project Manager",
    people: "Project Manager + POC Manager + Resource Manager",
    description: "PM leads delivery progress and quality, POC manages client feedback, and Resource Manager adjusts staffing by workload.",
    output: "Progress / QA Feedback / Resource Adjustment",
    tone: "pm",
  },
  {
    id: "delivery-review",
    step: "07",
    name: "Delivery & Review",
    lead: "POC Manager",
    people: "POC Manager + Project Manager + Resource Manager + Client",
    description: "POC delivers results, collects client feedback, leads project review, closes the project, and triggers internal talent performance records.",
    output: "Delivery Package / Client Feedback / Review Notes / Talent Record",
    tone: "poc",
  },
];

const DEFAULT_WORKFLOW_NODE_POSITIONS: Record<WorkflowNodeId, DiagramNode> = {
  "client-request": { x: 280, y: 68 },
  "requirement-alignment": { x: 130, y: 250 },
  "pilot-clarification": { x: 245, y: 480 },
  "workflow-finalization": { x: 560, y: 488 },
  "team-formation": { x: 560, y: 266 },
  "project-execution": { x: 930, y: 410 },
  "delivery-review": { x: 950, y: 112 },
};

const WORKFLOW_CONNECTIONS: WorkflowConnection[] = [
  { sourceId: "client-request", targetId: "requirement-alignment" },
  { sourceId: "requirement-alignment", targetId: "pilot-clarification" },
  { sourceId: "pilot-clarification", targetId: "workflow-finalization" },
  { sourceId: "workflow-finalization", targetId: "team-formation", route: "formation-arc" },
  { sourceId: "team-formation", targetId: "project-execution" },
  { sourceId: "project-execution", targetId: "delivery-review" },
];

function getDefaultDiagramNodes() {
  return workflowSteps.map((step) => ({ ...DEFAULT_WORKFLOW_NODE_POSITIONS[step.id] }));
}

const stepThemes = [
  {
    bg: "#eef7ef",
    border: "#7faa84",
    text: "#153d2b",
    accent: "#2f6b4f",
    mutedBg: "#f7fbf5",
  },
  {
    bg: "#fbf1df",
    border: "#d7b77c",
    text: "#5e4524",
    accent: "#a66f2e",
    mutedBg: "#fdf8ee",
  },
  {
    bg: "#fff4db",
    border: "#d7a84e",
    text: "#6a4a16",
    accent: "#b7791f",
    mutedBg: "#fffaf0",
  },
  {
    bg: "#edf8f1",
    border: "#6fa77c",
    text: "#174836",
    accent: "#1f5c43",
    mutedBg: "#f4fbf6",
  },
  {
    bg: "#edf7f7",
    border: "#77adb0",
    text: "#245a5f",
    accent: "#2f6f73",
    mutedBg: "#f5fbfb",
  },
  {
    bg: "#f2f6e8",
    border: "#9bad64",
    text: "#4d5c1f",
    accent: "#667a2f",
    mutedBg: "#fafcf4",
  },
  {
    bg: "#fff0e8",
    border: "#c48a68",
    text: "#6f3f25",
    accent: "#9a5a35",
    mutedBg: "#fff7f2",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLayout(value: unknown): DiagramNode[] | null {
  if (!value || typeof value !== "object") return null;

  const nodes = "nodes" in value ? (value as { nodes?: unknown }).nodes : value;
  if (!nodes || typeof nodes !== "object") return null;

  const nodeMap = nodes as Record<string, unknown>;
  const nextNodes = workflowSteps.map((step, index) => {
    const rawNode = nodeMap[step.id] ?? nodeMap[String(index + 1)] ?? nodeMap[`step-${index + 1}`];
    if (!rawNode || typeof rawNode !== "object") return null;
    const { x, y } = rawNode as { x?: unknown; y?: unknown };
    if (typeof x !== "number" || typeof y !== "number") return null;
    return {
      x: clamp(x, 0, VIEWBOX_WIDTH - NODE_WIDTH),
      y: clamp(y, 0, VIEWBOX_HEIGHT - NODE_HEIGHT),
    };
  });

  if (nextNodes.some((node) => node === null)) return null;
  return nextNodes as DiagramNode[];
}

function toLayoutExport(nodes: DiagramNode[]) {
  return {
    viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`,
    nodeSize: { width: NODE_WIDTH, height: NODE_HEIGHT },
    lineStrategy: "auto edge-to-edge cubic paths with a dashed 7-to-1 closure loop",
    nodes: nodes.reduce<Record<string, DiagramNode>>((acc, node, index) => {
      acc[workflowSteps[index].id] = { x: Math.round(node.x), y: Math.round(node.y) };
      return acc;
    }, {}),
  };
}

function saveDiagramLayout(nodes: DiagramNode[]) {
  try {
    localStorage.setItem(WORKFLOW_LAYOUT_STORAGE_KEY, JSON.stringify(toLayoutExport(nodes)));
    return true;
  } catch {
    return false;
  }
}

function getPointerPosition(event: PointerEvent, element: HTMLDivElement) {
  const rect = element.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT,
  };
}

function getNodeCenter(node: DiagramNode) {
  return {
    x: node.x + NODE_WIDTH / 2,
    y: node.y + NODE_HEIGHT / 2,
  };
}

function getEdgePoint(source: DiagramNode, target: DiagramNode, isSource: boolean) {
  const sourceCenter = getNodeCenter(source);
  const targetCenter = getNodeCenter(target);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (isSource) {
      return {
        x: source.x + (dx > 0 ? NODE_WIDTH + EDGE_GAP : -EDGE_GAP),
        y: sourceCenter.y,
      };
    }
    return {
      x: target.x + (dx > 0 ? -EDGE_GAP : NODE_WIDTH + EDGE_GAP),
      y: targetCenter.y,
    };
  }

  if (isSource) {
    return {
      x: sourceCenter.x,
      y: source.y + (dy > 0 ? NODE_HEIGHT + EDGE_GAP : -EDGE_GAP),
    };
  }

  return {
    x: targetCenter.x,
    y: target.y + (dy > 0 ? -EDGE_GAP : NODE_HEIGHT + EDGE_GAP),
  };
}

function buildConnectionPath(source: DiagramNode, target: DiagramNode, loop = false) {
  const start = getEdgePoint(source, target, true);
  const end = getEdgePoint(source, target, false);

  if (loop) {
    return `M${start.x} ${start.y} C${start.x - 110} ${start.y - 160} ${end.x + 120} ${end.y - 155} ${end.x} ${end.y}`;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const controlOne = {
    x: start.x + dx * 0.48,
    y: start.y + dy * 0.12,
  };
  const controlTwo = {
    x: start.x + dx * 0.52,
    y: start.y + dy * 0.88,
  };

  return `M${start.x} ${start.y} C${controlOne.x} ${controlOne.y} ${controlTwo.x} ${controlTwo.y} ${end.x} ${end.y}`;
}

function buildFormationArcPath(source: DiagramNode, target: DiagramNode) {
  const start = {
    x: source.x + NODE_WIDTH * 0.72,
    y: source.y - EDGE_GAP,
  };
  const end = {
    x: target.x + NODE_WIDTH * 0.3,
    y: target.y + NODE_HEIGHT + EDGE_GAP,
  };
  const bend = Math.max(140, Math.abs(start.y - end.y) * 0.82);

  return `M${start.x} ${start.y} C${start.x + bend} ${start.y - bend * 0.72} ${end.x + bend} ${end.y + bend * 0.5} ${end.x} ${end.y}`;
}

function buildWorkflowConnectionPath(source: DiagramNode, target: DiagramNode, route: WorkflowConnectionRoute = "default") {
  if (route === "formation-arc") {
    return buildFormationArcPath(source, target);
  }

  return buildConnectionPath(source, target);
}

function toneClasses(tone: OwnerTone) {
  if (tone === "pm") {
    return {
      card: "border-[#c9dfd0] bg-[#edf8f1]",
      badge: "border-[#1f5c43] bg-[#1f5c43] text-white",
      text: "text-[#1f5c43]",
      line: "bg-[#1f5c43]",
    };
  }
  if (tone === "resource") {
    return {
      card: "border-[#c8dcdd] bg-[#edf7f7]",
      badge: "border-[#2f6f73] bg-[#2f6f73] text-white",
      text: "text-[#2f6f73]",
      line: "bg-[#2f6f73]",
    };
  }
  return {
    card: "border-[#ead7ae] bg-[#fff7ea]",
    badge: "border-[#9a6a35] bg-[#9a6a35] text-white",
    text: "text-[#9a6a35]",
    line: "bg-[#9a6a35]",
  };
}

export function ProjectDeliverySwimlane() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [diagramNodes, setDiagramNodes] = useState<DiagramNode[]>(getDefaultDiagramNodes);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [layoutNotice, setLayoutNotice] = useState("");
  const diagramRef = useRef<HTMLDivElement | null>(null);
  const activeStep = workflowSteps[currentStep];
  const activeTone = toneClasses(activeStep.tone);
  const diagramLines = WORKFLOW_CONNECTIONS.map((connection) => {
    const sourceIndex = workflowSteps.findIndex((step) => step.id === connection.sourceId);
    const targetIndex = workflowSteps.findIndex((step) => step.id === connection.targetId);

    return {
      key: `${connection.sourceId}-${connection.targetId}`,
      d: buildWorkflowConnectionPath(diagramNodes[sourceIndex], diagramNodes[targetIndex], connection.route),
      target: targetIndex,
      loop: false,
    };
  });
  const loopLine = {
    key: "delivery-review-client-request-loop",
    d: buildConnectionPath(diagramNodes[workflowSteps.length - 1], diagramNodes[0], true),
    target: workflowSteps.length - 1,
    loop: true,
  };
  const allDiagramLines = [...diagramLines, loopLine];
  const visibleDiagramLines = allDiagramLines.map((line) => ({
    ...line,
    isActive: line.target <= currentStep,
  }));

  useEffect(() => {
    try {
      const rawLayout = localStorage.getItem(WORKFLOW_LAYOUT_STORAGE_KEY);
      if (!rawLayout) return;
      const savedLayout = normalizeLayout(JSON.parse(rawLayout));
      if (savedLayout) {
        queueMicrotask(() => setDiagramNodes(savedLayout));
      }
    } catch {
      queueMicrotask(() => setLayoutNotice("Saved layout could not be loaded."));
    }
  }, []);

  useEffect(() => {
    if (!isPlaying || isEditingLayout) return undefined;

    const timer = setInterval(() => {
      setCurrentStep((step) => (step + 1) % workflowSteps.length);
    }, 1500);

    return () => clearInterval(timer);
  }, [isPlaying, isEditingLayout]);

  const handleEnterEditMode = () => {
    setIsPlaying(false);
    setIsEditingLayout(true);
    setLayoutNotice("Drag nodes to tune the workflow layout.");
  };

  const handleBack = () => {
    setIsPlaying(false);
    setCurrentStep((step) => (step - 1 + workflowSteps.length) % workflowSteps.length);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStep((step) => (step + 1) % workflowSteps.length);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleTogglePlay = () => {
    if (!isPlaying) {
      setCurrentStep(0);
    }
    setIsPlaying((playing) => !playing);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (!isEditingLayout || !diagramRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const pointer = getPointerPosition(event, diagramRef.current);
    const node = diagramNodes[index];
    setIsPlaying(false);
    setCurrentStep(index);
    setDragState({
      index,
      offsetX: pointer.x - node.x,
      offsetY: pointer.y - node.y,
    });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState || !diagramRef.current) return;
    event.preventDefault();
    const pointer = getPointerPosition(event, diagramRef.current);
    const nextNode = {
      x: clamp(pointer.x - dragState.offsetX, 0, VIEWBOX_WIDTH - NODE_WIDTH),
      y: clamp(pointer.y - dragState.offsetY, 0, VIEWBOX_HEIGHT - NODE_HEIGHT),
    };
    setDiagramNodes((nodes) => nodes.map((node, index) => (index === dragState.index ? nextNode : node)));
  };

  const handlePointerUp = () => {
    if (dragState) {
      setDiagramNodes((nodes) => {
        const saved = saveDiagramLayout(nodes);
        setLayoutNotice(saved ? "Layout saved to localStorage." : "Layout could not be saved locally.");
        return nodes;
      });
    }
    setDragState(null);
  };

  const handleSaveLayout = () => {
    const saved = saveDiagramLayout(diagramNodes);
    setLayoutNotice(saved ? "Layout saved to localStorage." : "Layout could not be saved locally.");
  };

  const handleResetLayout = () => {
    let layoutCleared = true;
    try {
      localStorage.removeItem(WORKFLOW_LAYOUT_STORAGE_KEY);
    } catch {
      layoutCleared = false;
    }
    setDiagramNodes(getDefaultDiagramNodes());
    setLayoutNotice(layoutCleared ? "Layout reset to default." : "Default layout is shown for this session.");
  };

  const handleCopyLayout = async () => {
    const layoutJson = JSON.stringify(toLayoutExport(diagramNodes), null, 2);
    try {
      await navigator.clipboard.writeText(layoutJson);
      setLayoutNotice("Layout JSON copied.");
    } catch {
      setLayoutNotice(layoutJson);
    }
  };

  const handleExitEditMode = () => {
    setDragState(null);
    setIsEditingLayout(false);
    setIsPlaying(true);
    setLayoutNotice("");
  };

  const diagramBackground = {
    backgroundColor: "#fbf8f1",
    backgroundImage: [
      "radial-gradient(circle at 28% 18%, rgba(31, 92, 67, 0.09), transparent 28%)",
      "radial-gradient(circle at 82% 14%, rgba(154, 106, 53, 0.08), transparent 24%)",
      "radial-gradient(circle at 62% 92%, rgba(47, 111, 115, 0.06), transparent 30%)",
      `linear-gradient(rgba(31, 92, 67, ${isEditingLayout ? "0.1" : "0.045"}) 1px, transparent 1px)`,
      `linear-gradient(90deg, rgba(31, 92, 67, ${isEditingLayout ? "0.1" : "0.045"}) 1px, transparent 1px)`,
    ].join(", "),
    backgroundSize: "auto, auto, auto, 40px 40px, 40px 40px",
  };

  return (
    <div className="rounded-xl border border-[#eadfce] bg-[#fbfaf6] p-4">
      <style>{`
        .bd-live-dot {
          animation: bdLiveBlink 1.35s ease-in-out infinite;
        }
        .bd-current-node {
          animation: bdNodeGlow 1.5s ease-in-out infinite;
        }
        .bd-detail-panel {
          animation: bdDetailFade 220ms ease;
        }
        @keyframes bdLiveBlink {
          0%, 100% { opacity: 0.45; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes bdNodeGlow {
          0%, 100% { box-shadow: 0 12px 28px rgba(31, 41, 51, 0.08); transform: translateY(0); }
          50% { box-shadow: 0 16px 34px rgba(31, 92, 67, 0.2); transform: translateY(-2px); }
        }
        @keyframes bdDetailFade {
          from { opacity: 0.55; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[#e2d8c8] bg-white px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`bd-live-dot h-2.5 w-2.5 rounded-full ${isPlaying ? "bg-[#1f5c43]" : "bg-[#9a6a35]"}`} />
            <span className="rounded-full border border-[#e2d8c8] bg-[#fbfaf6] px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#6f6256]">
              Live Workflow
            </span>
            <span className="text-sm font-black text-[#111827]">
              Step {activeStep.step} · {activeStep.name}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748b]">
            <span><strong className="text-[#1f5c43]">Lead:</strong> {activeStep.lead}</span>
            <span><strong className="text-[#1f5c43]">People:</strong> {activeStep.people}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleBack} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-3 py-1.5 text-xs font-bold text-[#4b5563] hover:bg-[#f4efe2]">
            Back
          </button>
          <button type="button" onClick={handleTogglePlay} className="rounded-md bg-[#1f5c43] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#174836]">
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={handleNext} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-3 py-1.5 text-xs font-bold text-[#4b5563] hover:bg-[#f4efe2]">
            Next
          </button>
          <button type="button" onClick={handleReset} className="rounded-md border border-[#d7cec0] bg-white px-3 py-1.5 text-xs font-bold text-[#6f6256] hover:bg-[#fbfaf6]">
            Reset
          </button>
        </div>
      </div>

      <div className="min-w-0 rounded-xl border border-[#e2d8c8] bg-white p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[#6f6256]">Workflow Diagram</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isEditingLayout ? (
              <>
                <button type="button" onClick={handleSaveLayout} className="rounded-md bg-[#1f5c43] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#174836]">
                  Save Layout
                </button>
                <button type="button" onClick={handleResetLayout} className="rounded-md border border-[#d7cec0] bg-white px-3 py-1.5 text-xs font-bold text-[#6f6256] hover:bg-[#fbfaf6]">
                  Reset Layout
                </button>
                <button type="button" onClick={handleCopyLayout} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-3 py-1.5 text-xs font-bold text-[#4b5563] hover:bg-[#f4efe2]">
                  Copy Layout JSON
                </button>
                <button type="button" onClick={handleExitEditMode} className="rounded-md border border-[#d7cec0] bg-white px-3 py-1.5 text-xs font-bold text-[#6f6256] hover:bg-[#fbfaf6]">
                  Exit Edit
                </button>
              </>
            ) : (
              <button type="button" onClick={handleEnterEditMode} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-3 py-1.5 text-xs font-bold text-[#6f6256] hover:bg-[#f4efe2]">
                Edit Layout
              </button>
            )}
          </div>
        </div>
        {layoutNotice ? (
          <div className="mb-3 rounded-lg border border-[#e2d8c8] bg-[#fbfaf6] px-3 py-2 text-xs font-bold text-[#6f6256]">
            {layoutNotice}
          </div>
        ) : null}
        <div
          className="relative overflow-hidden rounded-xl border border-[#e2d8c8] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] xl:p-5"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={diagramBackground}
        >
          <div
            ref={diagramRef}
            className="relative mx-auto aspect-[1320/680] w-full max-w-[1320px]"
            data-workflow-diagram-canvas="true"
          >
          <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-2.5 rounded-xl border border-[#1f5c43]/15 bg-white/72 px-2.5 py-1.5 shadow-[0_12px_28px_rgba(31,41,51,0.09)] backdrop-blur xl:right-4 xl:top-4">
            <Image src="/blackdog-mascot.jpg" alt="BlackDog mascot" width={36} height={36} className="h-9 w-9 rounded-full border border-white object-cover shadow-sm" />
            <div>
              <div className="text-[11px] font-black text-[#111827]">BlackDog Delivery OS</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#1f5c43]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1f5c43] shadow-[0_0_10px_rgba(31,92,67,0.7)]" />
                Live project flow
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-[#d7cec0]/80 bg-white/55 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#6f6256] backdrop-blur xl:left-5 xl:top-5">
            BlackDog Workflow Engine
          </div>
          <svg viewBox={`0 0 ${DESIGN_CANVAS_WIDTH} ${DESIGN_CANVAS_HEIGHT}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              <filter id="activeWorkflowGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#1f5c43" floodOpacity="0.22" />
              </filter>
              <marker id="workflowArrow" markerWidth="13" markerHeight="13" refX="11" refY="6.5" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L13,6.5 L0,13 Z" fill="#d7cec0" />
              </marker>
              <marker id="workflowArrowActive" markerWidth="13" markerHeight="13" refX="11" refY="6.5" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L13,6.5 L0,13 Z" fill="#1f5c43" />
              </marker>
            </defs>
            {visibleDiagramLines.map((line) => (
              <path
                key={line.key}
                d={line.d}
                fill="none"
                stroke={line.isActive ? "#1f5c43" : "#d7cec0"}
                strokeWidth={line.loop ? (line.isActive ? 2.8 : 1.9) : line.isActive ? 3.5 : 2.2}
                strokeLinecap="round"
                markerEnd={line.isActive ? "url(#workflowArrowActive)" : "url(#workflowArrow)"}
                strokeDasharray={line.loop ? "14 12" : undefined}
                filter={line.isActive ? "url(#activeWorkflowGlow)" : undefined}
                opacity={line.loop ? (line.isActive ? 0.72 : 0.34) : line.isActive ? 0.9 : 0.58}
              />
            ))}
          </svg>

          {workflowSteps.map((step, index) => {
            const theme = stepThemes[index];
            const isCurrent = index === currentStep;
            const isDone = index < currentStep;
            const position = diagramNodes[index];
            const nodeBorder = isCurrent ? theme.accent : isDone ? theme.border : "#d7cec0";
            const nodeBackground = isCurrent ? theme.bg : theme.mutedBg;
            const nodeText = isCurrent || isDone ? theme.text : "#6f6256";

            return (
              <button
                key={step.id}
                type="button"
                data-workflow-node="true"
                data-workflow-node-id={step.id}
                onPointerDown={(event) => handlePointerDown(event, index)}
                onClick={() => {
                  if (isEditingLayout) return;
                  setIsPlaying(false);
                  setCurrentStep(index);
                }}
                className={`absolute z-10 flex min-w-0 flex-col justify-center rounded-xl border px-3 py-2 text-left shadow-sm transition xl:px-3.5 xl:py-2.5 ${
                  isCurrent
                    ? "bd-current-node"
                    : isDone
                      ? ""
                      : "opacity-[0.68]"
                }`}
                style={{
                  left: `${(position.x / VIEWBOX_WIDTH) * 100}%`,
                  top: `${(position.y / VIEWBOX_HEIGHT) * 100}%`,
                  width: `${(NODE_WIDTH / VIEWBOX_WIDTH) * 100}%`,
                  height: `${(NODE_HEIGHT / VIEWBOX_HEIGHT) * 100}%`,
                  borderColor: nodeBorder,
                  backgroundColor: nodeBackground,
                  cursor: isEditingLayout ? (dragState?.index === index ? "grabbing" : "grab") : "pointer",
                  touchAction: isEditingLayout ? "none" : "auto",
                  userSelect: isEditingLayout ? "none" : "auto",
                }}
              >
                <div className="flex w-full items-center gap-2">
                  <span
                    className="rounded-full border px-2 py-0.5 font-mono text-[10px] font-black"
                    style={{
                      borderColor: isCurrent ? theme.accent : theme.border,
                      backgroundColor: isCurrent ? theme.accent : "#ffffff",
                      color: isCurrent ? "#ffffff" : theme.text,
                    }}
                  >
                    {step.step}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.08em]" style={{ color: isCurrent ? theme.accent : theme.text }}>
                    Lead: {step.lead.replace(" Manager", "")}
                  </span>
                  {isDone ? <span className="text-sm font-black text-[#1f5c43]">✓</span> : null}
                </div>
                <div className="mt-1.5 whitespace-nowrap text-[14px] font-black leading-none" style={{ color: nodeText }}>
                  {step.name}
                </div>
                {isEditingLayout ? (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#d7cec0] bg-white px-2 py-0.5 font-mono text-[9px] font-bold text-[#6f6256] shadow-sm">
                    x:{Math.round(position.x)} y:{Math.round(position.y)}
                  </div>
                ) : null}
              </button>
            );
          })}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {workflowSteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(index);
              }}
              className={`h-3 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-[#1f5c43]"
                  : index < currentStep
                    ? "w-3 bg-[#9ac5aa]"
                    : "w-3 bg-[#d7cec0]"
              }`}
              aria-label={`Jump to step ${step.step} ${step.name}`}
            />
          ))}
        </div>
      </div>

      <div key={activeStep.step} className={`bd-detail-panel mt-3 min-h-[196px] rounded-xl border p-4 ${activeTone.card}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6f6256]">Current Step Detail</div>
            <div className="mt-1.5 font-mono text-xs font-black text-[#6f6256]">Step {activeStep.step}</div>
            <h3 className="mt-1 text-xl font-black leading-6 text-[#111827]">{activeStep.name}</h3>
          </div>
          <span className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-black ${activeTone.badge}`}>
            Lead: {activeStep.lead}
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_1.8fr_1.1fr]">
          <DetailItem label="People involved" value={activeStep.people} />
          <div className="h-[104px] overflow-hidden rounded-lg border border-white/70 bg-white/70 p-3">
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#6f6256]">What happens</div>
            <p className="mt-1.5 line-clamp-3 text-[13px] leading-5 text-[#374151]">{activeStep.description}</p>
          </div>
          <DetailItem label="Output" value={activeStep.output} />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[#e2d8c8] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#4b5563]">
        Every project ends with delivery confirmation and internal talent performance records.
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-[104px] overflow-hidden rounded-lg border border-white/70 bg-white/70 p-3">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#6f6256]">{label}</div>
      <div className="mt-1.5 line-clamp-3 text-[13px] font-bold leading-5 text-[#111827]">{value}</div>
    </div>
  );
}
