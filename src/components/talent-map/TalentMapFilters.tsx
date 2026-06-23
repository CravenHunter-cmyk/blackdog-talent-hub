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
    <div
      className="language-resource-matrix-filters"
      data-matrix-movable="matrix-filters"
      data-matrix-label="Filters"
    >
      <select
        value={languageFilter}
        onChange={(event) => onLanguageFilterChange(event.target.value)}
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
        aria-label="Filter by online status"
      >
        {onlineStatusOptions.map((status) => (
          <option key={status} value={status}>
            {status === "All" ? "Online Status: All" : status}
          </option>
        ))}
      </select>

      <div className="language-resource-search-field">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m20 20-4.5-4.5m2-4.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search code, language, or region..."
        />
      </div>
    </div>
  );
}
