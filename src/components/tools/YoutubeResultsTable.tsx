"use client";

import { getSearchTargetsLabel, statusOptions, type YoutubeResultStatus, type YoutubeSpeechResult } from "@/lib/tools/youtubeTypes";

export function YoutubeResultsTable({
  rows,
  selectedIds,
  onToggleSelected,
  onSelectAll,
  onDelete,
  onStatusChange,
  onNotesChange,
}: {
  rows: YoutubeSpeechResult[];
  selectedIds: string[];
  onToggleSelected: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: YoutubeResultStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
}) {
  const visibleIds = rows.map((row) => row.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#d0c3b3] bg-[#fbfaf6] shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
      <table className="data-table min-w-[1800px]">
        <thead>
          <tr>
            <th className="th-center"><input type="checkbox" checked={allSelected} onChange={() => onSelectAll(allSelected ? [] : visibleIds)} className="accent-[#1f5c43]" aria-label="Select all visible rows" /></th>
            <th className="th-left">Language</th>
            <th className="th-left">Domain</th>
            <th className="th-left">Search Target</th>
            <th className="th-left">Search Keyword</th>
            <th className="th-left">Source</th>
            <th className="th-left">Title</th>
            <th className="th-left">Video URL</th>
            <th className="th-left">Channel</th>
            <th className="th-left">Duration</th>
            <th className="th-left">Type</th>
            <th className="th-left">Views</th>
            <th className="th-left">Published</th>
            <th className="th-left">Status</th>
            <th className="th-left">Notes</th>
            <th className="th-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="td-center"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => onToggleSelected(row.id)} className="accent-[#1f5c43]" aria-label={`Select ${row.title}`} /></td>
              <td className="td-left">{row.language}</td>
              <td className="td-left">{row.domain}</td>
              <td className="td-left">{getSearchTargetsLabel(row)}</td>
              <td className="td-left font-semibold text-[#40372f]">{row.searchKeyword}</td>
              <td className="td-left">{row.keywordSource}</td>
              <td className="td-left max-w-[280px] font-bold text-[#111827]">{row.title || "Untitled"}</td>
              <td className="td-left max-w-[240px] truncate"><a href={row.videoUrl} target="_blank" rel="noreferrer" className="font-bold text-[#1f5c43] underline">{row.videoUrl}</a></td>
              <td className="td-left"><a href={row.channelUrl || "#"} target="_blank" rel="noreferrer" className="font-semibold text-[#40372f]">{row.channelName || "Unknown"}</a></td>
              <td className="td-left">{row.duration}</td>
              <td className="td-left">{row.videoType}</td>
              <td className="td-left">{row.viewCount}</td>
              <td className="td-left">{row.publishedDate}</td>
              <td className="td-left">
                <select value={row.status} onChange={(event) => onStatusChange(row.id, event.target.value as YoutubeResultStatus)} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f]">
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </td>
              <td className="td-left">
                <input value={row.notes} onChange={(event) => onNotesChange(row.id, event.target.value)} className="w-[220px] rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-semibold text-[#40372f] outline-none" placeholder="Notes" />
              </td>
              <td className="td-actions">
                <div className="flex flex-wrap gap-2">
                  <a href={row.videoUrl} target="_blank" rel="noreferrer" className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f]">Open</a>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(row.videoUrl)} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f]">Copy</button>
                  <button type="button" onClick={() => onDelete(row.id)} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-2 py-1 text-xs font-bold text-[#b42318]">Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={16} className="td-center py-10 text-sm font-bold text-[#6f6256]">No results to show.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
