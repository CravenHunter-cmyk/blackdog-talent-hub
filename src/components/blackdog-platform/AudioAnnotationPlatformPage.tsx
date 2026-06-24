import { MetricGrid, PlatformCard, PlatformHero, PlatformList, PlatformSection } from "./BlackDogPlatformShell";

const taskCenterItems = ["Audio tasks", "Assigned batches", "Progress tracking"];
const workspaceItems = ["Waveform placeholder", "Speaker turns", "Transcript editor", "Segment timeline"];
const governanceItems = ["Rules uploaded by PM", "Versioned guidelines", "Reviewer accountability", "Operation logs"];
const qaFlow = ["Annotator", "QA review", "QC review", "Final delivery"];

const metrics = [
  { label: "Submitted items", value: "1,284" },
  { label: "Returned items", value: "36" },
  { label: "QA passed", value: "94%" },
  { label: "QC passed", value: "91%" },
  { label: "Effective duration", value: "420h" },
];

export function AudioAnnotationPlatformPage() {
  return (
    <>
      <PlatformHero
        eyebrow="BlackDog Platform"
        title="Audio Annotation Platform"
        subtitle="Record, segment, annotate, review, and deliver speech data inside one controlled BlackDog workspace."
        signal="Audio production flow"
      >
        {qaFlow.map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-2xl border border-[#dce7d8] bg-white/78 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf6e8] text-xs font-black text-[#1f5c43]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-black text-[#111827]">{step}</span>
          </div>
        ))}
      </PlatformHero>

      <PlatformSection
        eyebrow="Workspace modules"
        title="A controlled audio data production surface"
        description="The page is a product preview for operating audio annotation work without connecting live data or production databases."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <PlatformCard title="Task Center">
            <PlatformList items={taskCenterItems} />
          </PlatformCard>
          <PlatformCard title="Annotation Workspace">
            <PlatformList items={workspaceItems} />
          </PlatformCard>
          <PlatformCard title="Platform Governance">
            <PlatformList items={governanceItems} />
          </PlatformCard>
        </div>
      </PlatformSection>

      <PlatformSection eyebrow="QA / QC flow" title="Human review stages stay traceable">
        <div className="grid gap-3 md:grid-cols-4">
          {qaFlow.map((step, index) => (
            <div key={step} className="rounded-[20px] border border-[#dce7d8] bg-[#f7fbf4] p-5">
              <div className="font-mono text-xs font-black text-[#1f5c43]">{String(index + 1).padStart(2, "0")}</div>
              <div className="mt-4 text-lg font-black text-[#111827]">{step}</div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#66725f]">
                {index === 0
                  ? "Create transcript segments and speaker labels."
                  : index === 1
                    ? "Check annotation completeness and guideline fit."
                    : index === 2
                      ? "Verify quality standards before delivery."
                      : "Package accepted work for downstream delivery."}
              </p>
            </div>
          ))}
        </div>
      </PlatformSection>

      <PlatformSection eyebrow="Metrics" title="Operational signals">
        <MetricGrid metrics={metrics} />
      </PlatformSection>
    </>
  );
}
