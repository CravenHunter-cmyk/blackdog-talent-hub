import type { LanguageResource, Readiness } from "@/types/talent";

type LanguageResourceTableProps = {
  resources: LanguageResource[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function readinessBadgeClass(readiness: Readiness) {
  const styles = {
    Core: "border-gray-950 bg-gray-950 text-white",
    Stable: "border-gray-700 bg-gray-700 text-white",
    Developing: "border-gray-400 bg-white text-gray-950",
    Backup: "border-gray-300 bg-gray-100 text-gray-700",
    Gap: "border-gray-200 bg-white text-gray-500",
  };

  return styles[readiness];
}

export function LanguageResourceTable({
  resources,
  selectedId,
  onSelect,
}: LanguageResourceTableProps) {
  return (
    <div className="max-h-[460px] overflow-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[900px] border-collapse text-center text-sm">
        <thead className="sticky top-0 z-10 bg-gray-100 text-xs uppercase text-gray-600">
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
              className={`cursor-pointer border-t border-gray-100 hover:bg-gray-50 ${
                selectedId === item.id ? "bg-gray-100" : "bg-white"
              }`}
            >
              <td className="px-3 py-2 font-semibold text-gray-950">{item.code}</td>
              <td className="px-3 py-2 font-medium text-gray-950">{item.language}</td>
              <td className="px-3 py-2 text-gray-700">{item.region}</td>
              <td className="px-3 py-2 font-medium text-gray-950">
                {item.totalResources}
              </td>
              <td className="px-3 py-2 font-medium text-gray-950">
                {item.activeTalents}
              </td>
              <td className="px-3 py-2 font-medium text-gray-950">{item.onlineNow}</td>
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
