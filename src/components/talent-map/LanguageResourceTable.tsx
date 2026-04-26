import type { LanguageResource, Readiness } from "@/types/talent";

type LanguageResourceTableProps = {
  resources: LanguageResource[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function readinessBadgeClass(readiness: Readiness) {
  const styles = {
    Core: "border-[#214d3a] bg-[#214d3a] text-white",
    Stable: "border-[#6b7d3a] bg-[#6b7d3a] text-white",
    Developing: "border-[#c9852b] bg-[#fff8ed] text-[#1e1712]",
    Backup: "border-[#8a8175] bg-[#f3eee7] text-[#1e1712]",
    Gap: "border-[#d2c8ba] bg-[#f7f6f0] text-[#6b6258]",
  };

  return styles[readiness];
}

export function LanguageResourceTable({
  resources,
  selectedId,
  onSelect,
}: LanguageResourceTableProps) {
  return (
    <div className="max-h-[460px] overflow-auto rounded-lg border border-[#d2c8ba] bg-white shadow-[0_12px_28px_rgba(31,41,51,0.07)]">
      <table className="w-full min-w-[900px] border-collapse text-center text-sm">
        <thead className="sticky top-0 z-10 bg-[#e7ebe1] text-xs uppercase text-[#1f2933]">
          <tr>
            <th className="px-3 py-2">Code</th>
            <th className="px-3 py-2">Language</th>
            <th className="px-3 py-2">Region</th>
            <th className="px-3 py-2">Total Resources</th>
            <th className="px-3 py-2">Active Talents</th>
            <th className="px-3 py-2">Online Now</th>
            <th className="px-3 py-2">Readiness</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((item) => (
            <tr
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`cursor-pointer border-t border-[#d7cdbf] transition hover:bg-[#eef3e7] ${
                selectedId === item.id ? "bg-[#e3eadc] shadow-[inset_3px_0_0_#214d3a]" : "bg-white"
              }`}
            >
              <td className="px-3 py-2">
                <span className="rounded-full border border-[#9caf88] bg-[#eef3e7] px-2.5 py-1 font-mono text-xs font-black text-[#214d3a]">
                  {item.code}
                </span>
              </td>
              <td className="px-3 py-2 font-medium text-[#1e1712]">{item.language}</td>
              <td className="px-3 py-2 text-[#6b6258]">{item.region}</td>
              <td className="px-3 py-2 font-mono font-semibold tabular-nums text-[#1f2933]">
                {item.totalResources}
              </td>
              <td className="px-3 py-2 font-mono font-semibold tabular-nums text-[#1f2933]">
                {item.activeTalents}
              </td>
              <td className="px-3 py-2 font-mono font-semibold tabular-nums text-[#1f2933]">
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
  );
}
