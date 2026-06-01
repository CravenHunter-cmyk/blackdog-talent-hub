"use client";

import { useMemo, useState } from "react";

type BrainTask = {
  id: string;
  name: string;
  category: string;
  description: string;
  inputs: string[];
  outputs: string[];
};

const brainTasks: BrainTask[] = [
  {
    id: "prompt-rewriting",
    name: "Prompt Rewriting",
    category: "Instruction quality",
    description: "Rewrite rough task instructions into precise, model-ready prompts with clearer constraints, examples, and evaluation intent.",
    inputs: ["Original requirement", "Target model behavior", "Quality standard"],
    outputs: ["Rewritten prompt", "Constraint checklist", "Review notes"],
  },
  {
    id: "caption-expansion",
    name: "Caption Expansion",
    category: "Multimodal data",
    description: "Expand short captions into richer descriptions while preserving visual facts, language style, and annotation boundaries.",
    inputs: ["Source caption", "Image or video context", "Expansion style"],
    outputs: ["Expanded caption", "Fact preservation notes", "Risk flags"],
  },
  {
    id: "video-description",
    name: "Video Description",
    category: "Multimodal data",
    description: "Convert video observations into structured descriptions for training, search, review, and semantic alignment workflows.",
    inputs: ["Video brief", "Scene notes", "Required schema"],
    outputs: ["Structured description", "Timeline notes", "Metadata suggestions"],
  },
  {
    id: "semantic-alignment",
    name: "Image/Video Semantic Alignment",
    category: "Multimodal data",
    description: "Check whether text, image, and video signals describe the same intent, object, action, and context.",
    inputs: ["Visual asset", "Candidate text", "Alignment rules"],
    outputs: ["Alignment decision", "Mismatch reasons", "Reviewer guidance"],
  },
  {
    id: "multilingual-translation-corpus",
    name: "Multilingual Translation Corpus",
    category: "Language data",
    description: "Prepare multilingual translation data with language, region, domain, tone, and quality-control requirements.",
    inputs: ["Source language", "Target language", "Domain requirements"],
    outputs: ["Corpus plan", "Translation guidelines", "QC checklist"],
  },
  {
    id: "parallel-corpus-construction",
    name: "Parallel Corpus Construction",
    category: "Language data",
    description: "Build aligned source-target text pairs for translation, evaluation, and multilingual model training pipelines.",
    inputs: ["Source texts", "Target texts", "Alignment criteria"],
    outputs: ["Parallel pairs", "Alignment status", "Issue log"],
  },
  {
    id: "text-classification",
    name: "Text Classification",
    category: "Annotation",
    description: "Turn classification requirements into label definitions, edge cases, examples, and reviewer workflows.",
    inputs: ["Text samples", "Label taxonomy", "Business rule"],
    outputs: ["Label guide", "Decision examples", "QA sampling plan"],
  },
  {
    id: "entity-annotation",
    name: "Entity Annotation",
    category: "Annotation",
    description: "Define entity labels, boundaries, examples, and validation rules for structured annotation projects.",
    inputs: ["Text samples", "Entity schema", "Boundary rules"],
    outputs: ["Entity guideline", "Annotation examples", "Validation checklist"],
  },
  {
    id: "intent-recognition",
    name: "Intent Recognition",
    category: "Annotation",
    description: "Design intent labels and conversation examples for support, search, agent, and assistant workflows.",
    inputs: ["User utterances", "Intent taxonomy", "Domain context"],
    outputs: ["Intent map", "Example library", "Confusion pairs"],
  },
  {
    id: "sentiment-annotation",
    name: "Sentiment Annotation",
    category: "Annotation",
    description: "Create sentiment guidelines that separate polarity, emotion, tone, sarcasm, and cultural context.",
    inputs: ["Text samples", "Sentiment scale", "Locale context"],
    outputs: ["Sentiment guide", "Tone notes", "Reviewer calibration set"],
  },
  {
    id: "sft-text-data",
    name: "SFT Text Data",
    category: "Model training",
    description: "Structure supervised fine-tuning examples with prompts, ideal responses, constraints, and quality checks.",
    inputs: ["Task scenario", "Response standard", "Safety boundaries"],
    outputs: ["SFT examples", "Rubric", "Failure mode list"],
  },
  {
    id: "rlhf-preference-data",
    name: "RLHF Preference Data",
    category: "Model training",
    description: "Build preference comparison tasks with clear ranking criteria, reviewer instructions, and audit trails.",
    inputs: ["Prompt", "Candidate responses", "Preference criteria"],
    outputs: ["Preference task", "Ranking rubric", "Reason capture fields"],
  },
  {
    id: "cot-reasoning-data",
    name: "CoT Reasoning Data",
    category: "Model training",
    description: "Plan reasoning-data workflows with answer validation, step quality, and privacy-safe explanation handling.",
    inputs: ["Problem set", "Answer key", "Reasoning standard"],
    outputs: ["Reasoning workflow", "Validation checks", "Reviewer notes"],
  },
];

export function BlackDogBrainTaskWorkspace() {
  const [activeTaskId, setActiveTaskId] = useState(brainTasks[0].id);
  const activeTask = useMemo(
    () => brainTasks.find((task) => task.id === activeTaskId) ?? brainTasks[0],
    [activeTaskId],
  );

  return (
    <section className="rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)] sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Task workspace</div>
          <h2 className="mt-2 text-2xl font-black text-[#111827]">Select an AI data task</h2>
        </div>
        <p className="max-w-2xl text-sm font-medium leading-6 text-[#6f6256]">
          Each task opens a focused workspace with inputs, expected outputs, and review structure.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-2">
          <div className="grid gap-1">
            {brainTasks.map((task) => {
              const isActive = task.id === activeTask.id;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setActiveTaskId(task.id)}
                  className={`cursor-pointer rounded-lg px-3 py-2.5 text-left transition ${
                    isActive
                      ? "border border-[#1f5c43] bg-[#1f5c43] text-white shadow-[0_10px_22px_rgba(31,92,67,0.18)]"
                      : "border border-transparent bg-white text-[#40372f] hover:border-[#d7cec0] hover:bg-[#f4efe2]"
                  }`}
                >
                  <div className="text-sm font-black leading-5">{task.name}</div>
                  <div className={`mt-1 text-[11px] font-bold uppercase tracking-[0.12em] ${isActive ? "text-[#d9f3df]" : "text-[#9a6a35]"}`}>
                    {task.category}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-[520px] rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#1f5c43]">{activeTask.category}</div>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-[#111827]">{activeTask.name}</h3>
            </div>
            <span className="rounded-full border border-[#c9dfd0] bg-[#edf8f1] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#1f5c43]">
              Workspace ready
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-[#40372f]">{activeTask.description}</p>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-[#e2d8c8] bg-white p-4">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Input structure</div>
              <div className="mt-3 grid gap-2">
                {activeTask.inputs.map((item) => (
                  <div key={item} className="rounded-lg border border-[#eadfcd] bg-[#fffdf8] px-3 py-2 text-sm font-bold text-[#111827]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[#e2d8c8] bg-white p-4">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Output package</div>
              <div className="mt-3 grid gap-2">
                {activeTask.outputs.map((item) => (
                  <div key={item} className="rounded-lg border border-[#eadfcd] bg-[#fffdf8] px-3 py-2 text-sm font-bold text-[#111827]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#c9dfd0] bg-[#edf8f1] p-4">
            <div className="text-sm font-black text-[#1f5c43]">Workspace notes</div>
            <p className="mt-2 text-sm font-medium leading-6 text-[#315f4a]">
              Use this panel as the operational entry for task design, reviewer guidance, QA checks, and model-ready delivery outputs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
