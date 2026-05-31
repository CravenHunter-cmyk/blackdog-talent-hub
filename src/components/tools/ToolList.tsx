import Link from "next/link";
import type { BlackDogTool } from "@/lib/tools/toolRegistry";

export function ToolList({ tools }: { tools: BlackDogTool[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#d0c3b3] bg-[#fbfaf6] shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
      <table className="data-table min-w-[880px]">
        <thead>
          <tr>
            <th className="th-left">Tool</th>
            <th className="th-left">Status</th>
            <th className="th-left">Description</th>
            <th className="th-center">Entry</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => (
            <tr key={tool.id}>
              <td className="td-left">
                <div className="font-black text-[#111827]">{tool.name}</div>
              </td>
              <td className="td-left">
                <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${tool.status === "Active" ? "border-[#c9dfd0] bg-[#edf8f1] text-[#1f5c43]" : "border-[#e2d8c8] bg-white text-[#9a6a35]"}`}>
                  {tool.status}
                </span>
              </td>
              <td className="td-left text-sm font-medium text-[#6f6256]">{tool.description}</td>
              <td className="td-actions">
                {tool.status === "Active" ? (
                  <Link href={tool.href} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-sm font-bold text-white">Open</Link>
                ) : (
                  <span className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-bold text-[#6f6256]">Soon</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
