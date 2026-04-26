import type { LanguageResource, Readiness } from "@/types/talent";

type LanguageDetailCardProps = {
  selected: LanguageResource;
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

export function LanguageDetailCard({ selected }: LanguageDetailCardProps) {
  return (
    <aside className="rounded-xl border border-[#e2d8c8] bg-[#ffffff] p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <DetailLabel>Code</DetailLabel>
          <div className="mt-1 inline-flex rounded-lg border border-[#1f5c43] bg-[#fff9ef] px-3 py-1 font-mono text-4xl font-black text-[#c9852b]">
            {selected.code}
          </div>

          <div className="mt-4">
            <DetailLabel>Language</DetailLabel>
            <div className="mt-1 text-xl font-semibold text-[#111827]">{selected.language}</div>
          </div>

          <div className="mt-4">
            <DetailLabel>Region</DetailLabel>
            <div className="mt-1 text-lg font-semibold text-[#111827]">{selected.region}</div>
          </div>
        </div>

        <div className="text-right">
          <DetailLabel>Readiness</DetailLabel>
          <span className={`mt-2 inline-flex rounded-md border px-2 py-1 text-xs font-medium ${readinessBadgeClass(selected.readiness)}`}>
            {selected.readiness}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <SmallStat label="Total Resources" value={selected.totalResources.toString()} />
        <SmallStat label="Active Talents" value={selected.activeTalents.toString()} />
        <SmallStat label="Online Now" value={selected.onlineNow.toString()} status />
      </div>

      <DetailBlock title="Main Skill Coverage">
        <div className="flex flex-wrap gap-2">
          {selected.skills.map((skill) => (
            <span key={skill} className="rounded-md border border-[#d7dde2] bg-[#fbfbfc] px-2 py-1 text-xs text-[#64748b]">
              {skill}
            </span>
          ))}
        </div>
      </DetailBlock>

      <DetailBlock title="Quality Distribution">
        <QualityRow label="Level 1" value={selected.quality.A} />
        <QualityRow label="Level 2" value={selected.quality.B} />
        <QualityRow label="Level 3" value={selected.quality.C} />
        <QualityRow label="Pending" value={selected.quality.Pending} />
      </DetailBlock>

    </aside>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase text-[#64748b]">{children}</div>;
}

function SmallStat({ label, value, status = false }: { label: string; value: string; status?: boolean }) {
  return (
    <div className="rounded-lg border border-[#e2d8c8] bg-[#f3f7f4] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="flex items-center gap-2 font-mono text-xl font-black tabular-nums text-[#1f5c43]">
        {status ? <span className="h-2 w-2 rounded-full bg-[#1f5c43]" /> : null}
        {value}
      </div>
      <div className="mt-1 text-xs text-[#6f6256]">{label}</div>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-[#e2d8c8] bg-[#fbfaf6] p-4 shadow-[inset_3px_0_0_#d49a3a]">
      <div className="mb-3 text-xs font-semibold uppercase text-[#6f6256]">{title}</div>
      {children}
    </div>
  );
}

function QualityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-[#e1e4dd] py-2 last:border-b-0">
      <span className="text-sm text-[#6f6256]">{label}</span>
      <span className="font-mono text-sm font-semibold text-[#111827]">{value}</span>
    </div>
  );
}
