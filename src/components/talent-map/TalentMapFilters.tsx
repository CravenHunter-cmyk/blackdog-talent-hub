import type { OnlineStatusFilter, ReadinessFilter } from "@/types/talent";

type TalentMapFiltersProps = {
  search: string;
  languageFilter: string;
  readinessFilter: ReadinessFilter;
  onlineStatus: OnlineStatusFilter;
  languages: string[];
  onSearchChange: (value: string) => void;
  onLanguageFilterChange: (value: string) => void;
  onReadinessFilterChange: (value: ReadinessFilter) => void;
  onOnlineStatusChange: (value: OnlineStatusFilter) => void;
};

const readinessOptions: ReadinessFilter[] = ["All", "Core", "Stable", "Developing", "Backup", "Gap"];
const onlineStatusOptions: OnlineStatusFilter[] = ["All", "Online Now", "Offline"];

export function TalentMapFilters({
  search,
  languageFilter,
  readinessFilter,
  onlineStatus,
  languages,
  onSearchChange,
  onLanguageFilterChange,
  onReadinessFilterChange,
  onOnlineStatusChange,
}: TalentMapFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1.4fr]">
      <select
        value={languageFilter}
        onChange={(event) => onLanguageFilterChange(event.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-gray-900"
        aria-label="Filter by language"
      >
        {languages.map((language) => (
          <option key={language} value={language}>
            {language === "All" ? "Language: All" : language}
          </option>
        ))}
      </select>

      <select
        value={readinessFilter}
        onChange={(event) => onReadinessFilterChange(event.target.value as ReadinessFilter)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-gray-900"
        aria-label="Filter by readiness"
      >
        {readinessOptions.map((readiness) => (
          <option key={readiness} value={readiness}>
            {readiness === "All" ? "Readiness: All" : readiness}
          </option>
        ))}
      </select>

      <select
        value={onlineStatus}
        onChange={(event) => onOnlineStatusChange(event.target.value as OnlineStatusFilter)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-gray-900"
        aria-label="Filter by online status"
      >
        {onlineStatusOptions.map((status) => (
          <option key={status} value={status}>
            {status === "All" ? "Online Status: All" : status}
          </option>
        ))}
      </select>

      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search code, language, or region..."
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none placeholder:text-gray-400 focus:border-gray-900"
      />
    </div>
  );
}
