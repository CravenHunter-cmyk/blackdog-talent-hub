"use client";

import { domainOptions, languageOptions, searchTargetOptions, statusOptions, type YoutubeResultStatus, type YoutubeSpeechResult } from "@/lib/tools/youtubeTypes";
import { YoutubeResultsTable } from "./YoutubeResultsTable";

export function SavedYoutubeResults({
  rows,
  selectedIds,
  filters,
  onFiltersChange,
  onToggleSelected,
  onSelectAll,
  onDelete,
  onStatusChange,
  onNotesChange,
}: {
  rows: YoutubeSpeechResult[];
  selectedIds: string[];
  filters: { language: string; domain: string; searchTarget: string; status: string; query: string };
  onFiltersChange: (filters: { language: string; domain: string; searchTarget: string; status: string; query: string }) => void;
  onToggleSelected: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: YoutubeResultStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)] sm:p-6">
        <div className="mb-5">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Saved Results</div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <FilterSelect label="Language" value={filters.language} options={languageOptions} onChange={(value) => onFiltersChange({ ...filters, language: value })} />
          <FilterSelect label="Domain" value={filters.domain} options={domainOptions} onChange={(value) => onFiltersChange({ ...filters, domain: value })} />
          <FilterSelect label="Search Target" value={filters.searchTarget} options={searchTargetOptions} onChange={(value) => onFiltersChange({ ...filters, searchTarget: value })} />
          <FilterSelect label="Status" value={filters.status} options={statusOptions} onChange={(value) => onFiltersChange({ ...filters, status: value })} />
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-[#6f6256]">Search</span>
            <input
              value={filters.query}
              onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
              className="mt-2 h-10 w-full rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-semibold text-[#111827] outline-none"
              placeholder="Search results"
            />
          </label>
        </div>
      </div>

      <YoutubeResultsTable
        rows={rows}
        selectedIds={selectedIds}
        onToggleSelected={onToggleSelected}
        onSelectAll={onSelectAll}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        onNotesChange={onNotesChange}
      />
    </section>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-[#6f6256]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-semibold text-[#111827] outline-none">
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
