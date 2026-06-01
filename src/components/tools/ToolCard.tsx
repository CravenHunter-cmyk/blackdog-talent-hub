import Link from "next/link";
import type { BlackDogTool } from "@/lib/tools/toolRegistry";

export function ToolCard({ tool }: { tool: BlackDogTool }) {
  const isActive = tool.status === "Active";

  return (
    <div className="flex min-h-[230px] flex-col rounded-2xl border border-[#d0c3b3] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black leading-6 text-[#111827]">{tool.name}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${isActive ? "border-[#c9dfd0] bg-[#edf8f1] text-[#1f5c43]" : "border-[#e2d8c8] bg-white text-[#9a6a35]"}`}>
          {tool.status}
        </span>
      </div>
      <p className="mt-4 text-sm font-medium leading-6 text-[#6f6256]">{tool.description}</p>
      <div className="mt-auto pt-5">
        {isActive ? (
          <Link href={tool.href} prefetch={false} className="inline-flex rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(31,92,67,0.18)]">
            Open Tool
          </Link>
        ) : (
          <span className="inline-flex rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-bold text-[#6f6256]">
            Coming Soon
          </span>
        )}
      </div>
    </div>
  );
}
