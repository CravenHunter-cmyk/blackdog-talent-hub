"use client";

import { useState } from "react";
import { blackDogTools } from "@/lib/tools/toolRegistry";
import { ToolCard } from "./ToolCard";
import { ToolList } from "./ToolList";

type ViewMode = "card" | "list";

export function BlackDogToolsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  return (
    <main className="min-h-screen bg-[#f8f5ec] pb-24 pt-6 text-[#111827]">
      <div className="page-shell space-y-6">
        <section className="rounded-2xl border border-[#d0c3b3] bg-[#fbfaf6] p-5 shadow-[0_18px_46px_rgba(31,41,51,0.10)] sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex rounded-full border border-[#d7cec0] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#9a6a35]">
                Internal tool library
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-[#111827]">BlackDog Tools</h1>
            </div>
            <div className="inline-flex w-fit rounded-lg border border-[#d7cec0] bg-white p-1">
              {(["card", "list"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-md px-4 py-2 text-sm font-black ${viewMode === mode ? "bg-[#1f5c43] text-white" : "text-[#6f6256] hover:bg-[#f4efe2]"}`}
                >
                  {mode === "card" ? "Card View" : "List View"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {viewMode === "card" ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {blackDogTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </section>
        ) : (
          <ToolList tools={blackDogTools} />
        )}
      </div>
    </main>
  );
}
