import type { LanguageResource, Readiness } from "@/types/talent";

type LanguageResourceTableProps = {
  resources: LanguageResource[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function readinessBadgeClass(readiness: Readiness) {
  const styles = {
    Core: "border-[#1f5c43] bg-[#1f5c43] text-white",
    Stable: "border-[#214d3a] bg-[#214d3a] text-white",
    Developing: "border-[#b7791f] bg-[#fff7ea] text-[#1e1712]",
    Backup: "border-[#e2d8c8] bg-[#fbfaf6] text-[#6f6256]",
    Gap: "border-[#e2d8c8] bg-[#fbfaf6] text-[#6f6256]",
  };

  return styles[readiness];
}

export function LanguageResourceTable({
  resources,
  selectedId,
  onSelect,
}: LanguageResourceTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e2d8c8] bg-white shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
      <div className="max-h-[460px] overflow-auto">
        <table className="w-full min-w-[900px] border-collapse text-center text-sm">
          <thead className="sticky top-0 z-10 bg-[#f1ece3] text-xs uppercase text-[#1e1712]">
          <tr>
            <th className="border-b border-[#e2d8c8] bg-[#f1ece3] px-3 py-2">Code</th>
            <th className="border-b border-[#e2d8c8] bg-[#f1ece3] px-3 py-2">Language</th>
            <th className="border-b border-[#e2d8c8] bg-[#f1ece3] px-3 py-2">Region</th>
            <th className="border-b border-[#e2d8c8] bg-[#f1ece3] px-3 py-2">Total Resources</th>
            <th className="border-b border-[#e2d8c8] bg-[#f1ece3] px-3 py-2">Active Talents</th>
            <th className="border-b border-[#e2d8c8] bg-[#f1ece3] px-3 py-2">Online Now</th>
            <th className="border-b border-[#e2d8c8] bg-[#f1ece3] px-3 py-2">Readiness</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((item) => (
            <tr
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`cursor-pointer border-t border-[#e1e4dd] transition hover:bg-[#f3f7f0] ${
                selectedId === item.id ? "bg-[#edf4ec] shadow-[inset_3px_0_0_#1f5c43]" : "bg-white"
              }`}
            >
              <td className="px-3 py-2">
                <span className="rounded-full border border-[#1f5c43] bg-[#f3f7f0] px-2.5 py-1 font-mono text-xs font-black text-[#1f5c43]">
                  {item.code}
                </span>
              </td>
              <td className="px-3 py-2 font-medium text-[#111827]">{item.language}</td>
              <td className="px-3 py-2 text-[#64748b]">{item.region}</td>
              <td className="px-3 py-2 font-mono font-semibold tabular-nums text-[#111827]">
                {item.totalResources}
              </td>
              <td className="px-3 py-2 font-mono font-semibold tabular-nums text-[#111827]">
                {item.activeTalents}
              </td>
              <td className="px-3 py-2 font-mono font-semibold tabular-nums text-[#111827]">
                {item.onlineNow}
              </td>
              <td className="px-3 py-2">
                <span className={`rounded-md border px-2 py-1 text-xs font-medium ${readinessBadgeClass(item.readiness)}`}>
                  {item.readiness}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
