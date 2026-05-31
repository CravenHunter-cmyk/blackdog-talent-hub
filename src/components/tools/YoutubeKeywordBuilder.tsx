"use client";

import { useMemo, useState } from "react";
import { buildUnitLabel, type YoutubeCollectionUnit, type YoutubeKeyword } from "@/lib/tools/youtubeTypes";

export function YoutubeKeywordBuilder({
  ruleKeywords,
  aiKeywords,
  finalKeywords,
  units,
  manualKeyword,
  warning,
  onManualKeywordChange,
  onAddManualKeyword,
  onToggleKeyword,
  onUpdateKeyword,
  onDeleteKeyword,
  readOnly = false,
  readOnlyMessage = "Reopen this task to continue editing or running units.",
}: {
  ruleKeywords: YoutubeKeyword[];
  aiKeywords: YoutubeKeyword[];
  finalKeywords: YoutubeKeyword[];
  units: YoutubeCollectionUnit[];
  manualKeyword: string;
  warning: string;
  onManualKeywordChange: (value: string) => void;
  onAddManualKeyword: (unitId: string) => void;
  onToggleKeyword: (id: string) => void;
  onUpdateKeyword: (id: string, value: string) => void;
  onDeleteKeyword: (id: string) => void;
  readOnly?: boolean;
  readOnlyMessage?: string;
}) {
  const [domainFilter, setDomainFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [manualUnitId, setManualUnitId] = useState("");
  const [finalExpanded, setFinalExpanded] = useState(false);
  const unitOptions = useMemo(() => units.map((unit, index) => ({
    value: unit.id,
    label: `Unit ${index + 1} · ${buildUnitLabel(unit)}`,
  })), [units]);
  const labelByUnitId = useMemo(() => new Map(unitOptions.map((unit) => [unit.value, unit.label])), [unitOptions]);
  const domains = Array.from(new Set(finalKeywords.map((item) => item.domain).filter(Boolean))) as string[];
  const targets = Array.from(new Set(finalKeywords.map((item) => item.searchTarget).filter(Boolean))) as string[];
  const sources = Array.from(new Set(finalKeywords.map((item) => item.source).filter(Boolean)));
  const selectedCount = finalKeywords.filter((item) => item.selected).length;
  const sourceCounts = {
    Rule: finalKeywords.filter((item) => item.source === "Rule").length,
    AI: finalKeywords.filter((item) => item.source === "AI").length,
    Manual: finalKeywords.filter((item) => item.source === "Manual").length,
  };

  const manualUnitExists = unitOptions.some((unit) => unit.value === manualUnitId);
  const effectiveManualUnitId = unitFilter || (manualUnitExists ? manualUnitId : "");
  const filterByUnit = (items: YoutubeKeyword[]) => unitFilter ? items.filter((item) => item.unitId === unitFilter) : items;
  const visibleFinalKeywords = finalKeywords.filter((item) => {
    if (unitFilter && item.unitId !== unitFilter) return false;
    if (domainFilter && item.domain !== domainFilter) return false;
    if (targetFilter && item.searchTarget !== targetFilter) return false;
    if (sourceFilter && item.source !== sourceFilter) return false;
    return true;
  });

  return (
    <section className="rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)] sm:p-6">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Keyword Builder</div>
        {warning ? <p className="mt-2 text-sm font-bold text-[#9a6a35]">{warning}</p> : null}
        {readOnly ? <p className="mt-2 text-sm font-bold text-[#9a6a35]">{readOnlyMessage}</p> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <KeywordGroup title="Rule-based Keywords" keywords={filterByUnit(ruleKeywords)} labelByUnitId={labelByUnitId} />
        <KeywordGroup title="AI Expanded Keywords" keywords={filterByUnit(aiKeywords)} labelByUnitId={labelByUnitId} emptyText="No AI keywords yet." />
        <div className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-4">
          <div className="text-sm font-black text-[#111827]">Manual Keywords</div>
          <div className="mt-3 grid gap-2">
            <select value={effectiveManualUnitId} onChange={(event) => setManualUnitId(event.target.value)} disabled={Boolean(unitFilter) || readOnly} className="h-9 rounded-md border border-[#d7cec0] bg-white px-3 text-xs font-bold text-[#40372f] disabled:opacity-70">
              <option value="">Select unit</option>
              {unitOptions.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
            </select>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={manualKeyword}
              onChange={(event) => onManualKeywordChange(event.target.value)}
              disabled={readOnly}
              className="min-w-0 flex-1 rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-semibold text-[#111827] outline-none"
              placeholder="Add keyword"
            />
            <button type="button" onClick={() => onAddManualKeyword(effectiveManualUnitId)} disabled={!effectiveManualUnitId || readOnly} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-4">
        <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-black text-[#111827]">Final Keywords</div>
            <div className="mt-1 text-xs font-bold text-[#6f6256]">
              Rule {sourceCounts.Rule} · AI {sourceCounts.AI} · Manual {sourceCounts.Manual}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-black text-[#1f5c43]">{selectedCount} selected / {finalKeywords.length} total</div>
            <button type="button" onClick={() => setFinalExpanded((value) => !value)} disabled={!finalKeywords.length} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#40372f] disabled:opacity-50">{finalExpanded ? "Hide" : "Show"}</button>
          </div>
        </div>
        {finalExpanded ? <><div className="mb-3 flex flex-wrap gap-2">
            <KeywordUnitFilter value={unitFilter} onChange={setUnitFilter} options={unitOptions} />
            <KeywordFilter value={domainFilter} onChange={setDomainFilter} options={domains} label="All Domains" />
            <KeywordFilter value={targetFilter} onChange={setTargetFilter} options={targets} label="All Search Targets" />
            <KeywordFilter value={sourceFilter} onChange={setSourceFilter} options={sources} label="All Sources" />
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#e2d8c8] bg-white">
          <table className="data-table min-w-[1100px]">
            <thead>
              <tr>
                <th className="th-center">Select</th>
                <th className="th-left">Language</th>
                <th className="th-left">Unit</th>
                <th className="th-left">Domain</th>
                <th className="th-left">Search Target</th>
                <th className="th-left">Keyword</th>
                <th className="th-left">Source</th>
                <th className="th-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleFinalKeywords.map((item) => (
                <tr key={item.id}>
                  <td className="td-center"><input type="checkbox" checked={Boolean(item.selected)} disabled={readOnly} onChange={() => item.id && onToggleKeyword(item.id)} className="h-4 w-4 accent-[#1f5c43] disabled:opacity-50" aria-label={`Select ${item.keyword}`} /></td>
                  <td className="td-left">{item.language || "-"}</td>
                  <td className="td-left max-w-[280px]" title={item.unitLabel || labelByUnitId.get(item.unitId || "") || item.groupKey || ""}>{item.unitLabel || labelByUnitId.get(item.unitId || "") || item.groupKey || "-"}</td>
                  <td className="td-left">{item.domain || "-"}</td>
                  <td className="td-left">{item.searchTarget || "-"}</td>
                  <td className="td-left"><input value={item.keyword} disabled={readOnly} onChange={(event) => item.id && onUpdateKeyword(item.id, event.target.value)} className="w-full min-w-[320px] rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-semibold text-[#111827] outline-none disabled:opacity-60" /></td>
                  <td className="td-left">{item.source}</td>
                  <td className="td-actions"><button type="button" onClick={() => item.id && onDeleteKeyword(item.id)} disabled={readOnly} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-3 py-2 text-xs font-black text-[#b42318] disabled:opacity-50">Delete</button></td>
                </tr>
              ))}
              {finalKeywords.length === 0 ? <tr><td colSpan={8} className="td-center py-8 text-sm font-bold text-[#6f6256]">No keywords yet.</td></tr> : null}
              {finalKeywords.length > 0 && visibleFinalKeywords.length === 0 ? <tr><td colSpan={8} className="td-center py-8 text-sm font-bold text-[#6f6256]">No keywords match the filters.</td></tr> : null}
            </tbody>
          </table>
        </div></> : finalKeywords.length ? (
          <div className="rounded-lg border border-[#e2d8c8] bg-white px-3 py-3 text-xs font-bold text-[#6f6256]">Keyword details are hidden.</div>
        ) : (
          <div className="rounded-lg border border-[#e2d8c8] bg-white px-3 py-3 text-xs font-bold text-[#6f6256]">No keywords yet.</div>
        )}
      </div>
    </section>
  );
}

function KeywordUnitFilter({ value, options, onChange }: { value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 max-w-[340px] rounded-md border border-[#d7cec0] bg-white px-3 text-xs font-bold text-[#40372f]">
      <option value="">All Units</option>
      {options.map((option, index) => <option key={option.value} value={option.value}>Unit {index + 1}: {option.label}</option>)}
    </select>
  );
}

function KeywordFilter({ value, options, label, onChange }: { value: string; options: string[]; label: string; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-md border border-[#d7cec0] bg-white px-3 text-xs font-bold text-[#40372f]">
      <option value="">{label}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function KeywordGroup({ title, keywords, labelByUnitId, emptyText = "Generate keywords to view results." }: { title: string; keywords: YoutubeKeyword[]; labelByUnitId: Map<string, string>; emptyText?: string }) {
  return (
    <div className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-4">
      <div className="text-sm font-black text-[#111827]">{title}</div>
      <div className="mt-3 max-h-44 space-y-2 overflow-auto">
        {keywords.length ? keywords.map((item) => (
          <div key={item.id || `${item.source}-${item.groupKey || item.language}-${item.domain}-${item.searchTarget}-${item.keyword}`} className="rounded-lg border border-[#d7cec0] bg-white px-3 py-2">
            <div className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#9a6a35]" title={item.unitLabel || labelByUnitId.get(item.unitId || "") || ""}>{item.unitLabel || labelByUnitId.get(item.unitId || "") || "Unassigned unit"}</div>
            <div className="mt-1 text-xs font-bold text-[#6f6256]">{item.keyword}</div>
          </div>
        )) : <span className="text-xs font-bold text-[#9a6a35]">{emptyText}</span>}
      </div>
    </div>
  );
}
