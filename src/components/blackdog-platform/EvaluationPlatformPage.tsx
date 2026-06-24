import { MetricGrid, PlatformCard, PlatformHero, PlatformList, PlatformSection } from "./BlackDogPlatformShell";

const taskCenterItems = ["Model evaluation", "Search relevance", "Caption evaluation", "COT evaluation"];
const reviewWorkspaceItems = ["Prompt / source content", "Candidate response", "Scoring rubric", "Comment box"];
const traceabilityItems = ["Who reviewed", "Why accepted", "Why returned", "What changed"];
const reviewFlow = ["First round", "Second round", "QA calibration", "Final acceptance"];

const metrics = [
  { label: "Completed evaluations", value: "3,842" },
  { label: "Return rate", value: "4.8%" },
  { label: "Agreement rate", value: "89%" },
  { label: "Average score", value: "4.6" },
  { label: "Delivery progress", value: "76%" },
];

export function EvaluationPlatformPage() {
  return (
    <>
      <PlatformHero
        eyebrow="BlackDog Platform"
        title="Evaluation Platform"
        subtitle="Evaluate AI outputs, model behavior, task quality, and reviewer decisions with traceable workflows."
        signal="Evaluation control loop"
      >
        {reviewFlow.map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-2xl border border-[#dce7d8] bg-white/78 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf6e8] text-xs font-black text-[#1f5c43]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-black text-[#111827]">{step}</span>
          </div>
        ))}
      </PlatformHero>

      <PlatformSection
        eyebrow="Evaluation modules"
        title="A review platform for model and task quality"
        description="This is a display page for BlackDog Platform evaluation workflows, separate from BlackDog Brain's Evaluation Platform."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <PlatformCard title="Evaluation Task Center">
            <PlatformList items={taskCenterItems} />
          </PlatformCard>
          <PlatformCard title="Review Workspace">
            <PlatformList items={reviewWorkspaceItems} />
          </PlatformCard>
          <PlatformCard title="Traceability">
            <PlatformList items={traceabilityItems} />
          </PlatformCard>
        </div>
      </PlatformSection>

      <PlatformSection eyebrow="Multi-stage review" title="Every decision keeps context">
        <div className="grid gap-3 md:grid-cols-4">
          {reviewFlow.map((step, index) => (
            <div key={step} className="rounded-[20px] border border-[#dce7d8] bg-[#f7fbf4] p-5">
              <div className="font-mono text-xs font-black text-[#1f5c43]">{String(index + 1).padStart(2, "0")}</div>
              <div className="mt-4 text-lg font-black text-[#111827]">{step}</div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#66725f]">
                {index === 0
                  ? "Capture the first reviewer judgment and score."
                  : index === 1
                    ? "Compare decisions and identify disagreement."
                    : index === 2
                      ? "Calibrate rubric use before final acceptance."
                      : "Lock the accepted result with reviewer context."}
              </p>
            </div>
          ))}
        </div>
      </PlatformSection>

      <PlatformSection eyebrow="Metrics" title="Evaluation delivery signals">
        <MetricGrid metrics={metrics} />
      </PlatformSection>
    </>
  );
}
