"use client";

import { useMemo, useState } from "react";
import { brainTaskRegistry, getBrainTaskById } from "./brainTaskRegistry";

export function BlackDogBrainTaskWorkspace() {
  const [activeTaskId, setActiveTaskId] = useState(brainTaskRegistry[0].id);
  const activeTask = useMemo(() => getBrainTaskById(activeTaskId), [activeTaskId]);

  return (
    <section className="rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)] sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Task workspace</div>
          <h2 className="mt-2 text-2xl font-black text-[#111827]">Select an AI data task</h2>
        </div>
        <p className="max-w-2xl text-sm font-medium leading-6 text-[#6f6256]">
          Each task opens a focused workspace with workflow steps, template structure, and delivery goals.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-2">
          <div className="grid gap-1">
            {brainTaskRegistry.map((task) => {
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
                  <div className="text-sm font-black leading-5">{task.label}</div>
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
              <h3 className="mt-2 text-3xl font-black tracking-tight text-[#111827]">{activeTask.label}</h3>
            </div>
            <span className="rounded-full border border-[#c9dfd0] bg-[#edf8f1] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#1f5c43]">
              Workspace ready
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-[#40372f]">{activeTask.shortDescription}</p>

          <div className="mt-6 rounded-xl border border-[#e2d8c8] bg-white p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Workflow steps</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {activeTask.workflowSteps.map((step, index) => (
                <div key={step} className="rounded-lg border border-[#eadfcd] bg-[#fffdf8] px-3 py-2">
                  <div className="font-mono text-[11px] font-black text-[#9a6a35]">{String(index + 1).padStart(2, "0")}</div>
                  <div className="mt-1 text-sm font-bold text-[#111827]">{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {activeTask.templateSections.map((section) => (
              <div key={section.title} className="rounded-xl border border-[#e2d8c8] bg-white p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">{section.title}</div>
                <div className="mt-3 grid gap-2">
                  {section.items.map((item) => (
                    <div key={item} className="rounded-lg border border-[#eadfcd] bg-[#fffdf8] px-3 py-2 text-sm font-bold text-[#111827]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-[#c9dfd0] bg-[#edf8f1] p-4">
            <div className="text-sm font-black text-[#1f5c43]">Output goal</div>
            <p className="mt-2 text-sm font-medium leading-6 text-[#315f4a]">{activeTask.outputGoal}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
