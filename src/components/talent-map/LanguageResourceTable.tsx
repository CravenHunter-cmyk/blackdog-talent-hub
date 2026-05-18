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
      <div className="scroll-panel max-h-[460px]">
        <table className="data-table w-full table-fixed [&_td]:py-3 [&_th]:py-2.5 [&_th]:tracking-[0.1em]">
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>
          <thead className="sticky top-0 z-10">
          <tr>
            <th className="th-left">
              <span style={{ display: "inline-block", transform: "translateX(64px)" }}>Code</span>
            </th>
            <th className="th-left">
              <span style={{ display: "inline-block", transform: "translateX(104px)" }}>Language</span>
            </th>
            <th className="th-left">
              <span style={{ display: "inline-block", transform: "translateX(112px)" }}>Region</span>
            </th>
            <th className="th-left">
              <span style={{ display: "inline-block", transform: "translateX(0px)" }}>Total Resources</span>
            </th>
            <th className="th-left">
              <span style={{ display: "inline-block", transform: "translateX(0px)" }}>Active Talents</span>
            </th>
            <th className="th-left">
              <span style={{ display: "inline-block", transform: "translateX(0px)" }}>Online Now</span>
            </th>
            <th className="th-left">
              <span style={{ display: "inline-block", transform: "translateX(0px)" }}>Readiness</span>
            </th>
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
              <td className="td-left">
                <div style={{ display: "inline-block", transform: "translateX(64px)" }}>
                  <span className="rounded-full border border-[#1f5c43] bg-[#f3f7f0] px-2.5 py-1 font-mono text-xs font-black text-[#1f5c43]">
                    {item.code}
                  </span>
                </div>
              </td>
              <td className="td-left font-semibold text-[#111827]">
                <span style={{ display: "inline-block", transform: "translateX(104px)" }}>{item.language}</span>
              </td>
              <td className="td-left text-[#64748b]">
                <span style={{ display: "inline-block", transform: "translateX(112px)" }}>{item.region}</span>
              </td>
              <td className="td-left font-mono font-bold tabular-nums text-[#111827]">
                <span style={{ display: "inline-block", transform: "translateX(0px)" }}>{item.totalResources}</span>
              </td>
              <td className="td-left font-mono font-bold tabular-nums text-[#111827]">
                <span style={{ display: "inline-block", transform: "translateX(0px)" }}>{item.activeTalents}</span>
              </td>
              <td className="td-left font-mono font-bold tabular-nums text-[#111827]">
                <span style={{ display: "inline-block", transform: "translateX(0px)" }}>{item.onlineNow}</span>
              </td>
              <td className="td-left">
                <div style={{ display: "inline-block", transform: "translateX(0px)" }}>
                  <span className={`rounded-md border px-2 py-1 text-xs font-medium ${readinessBadgeClass(item.readiness)}`}>
                    {item.readiness}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
