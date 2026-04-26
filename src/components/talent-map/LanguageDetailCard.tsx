import type { LanguageResource, Readiness } from "@/types/talent";

type LanguageDetailCardProps = {
  selected: LanguageResource;
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

export function LanguageDetailCard({ selected }: LanguageDetailCardProps) {
  return (
    <aside className="rounded-xl border border-[#d2c8ba] bg-white p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <DetailLabel>Code</DetailLabel>
          <div className="mt-1 inline-flex rounded-lg border border-[#214d3a] bg-[#eef3e7] px-3 py-1 font-mono text-4xl font-black text-[#214d3a]">
            {selected.code}
          </div>

          <div className="mt-4">
            <DetailLabel>Language</DetailLabel>
            <div className="mt-1 text-xl font-semibold text-[#1e1712]">{selected.language}</div>
          </div>

          <div className="mt-4">
            <DetailLabel>Region</DetailLabel>
            <div className="mt-1 text-sm text-[#6b6258]">{selected.region}</div>
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
            <span key={skill} className="rounded-md border border-[#d2c8ba] bg-[#f7f6f0] px-2 py-1 text-xs text-[#6b6258]">
              {skill}
            </span>
          ))}
        </div>
      </DetailBlock>

      <DetailBlock title="Quality Distribution">
        <QualityRow label="A Level" value={selected.quality.A} />
        <QualityRow label="B Level" value={selected.quality.B} />
        <QualityRow label="C Level" value={selected.quality.C} />
        <QualityRow label="Pending" value={selected.quality.Pending} />
      </DetailBlock>

    </aside>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase text-[#8b6f47]">{children}</div>;
}

function SmallStat({ label, value, status = false }: { label: string; value: string; status?: boolean }) {
  return (
    <div className="rounded-lg border border-[#d2c8ba] bg-[#f7f6f0] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="flex items-center gap-2 font-mono text-xl font-black tabular-nums text-[#214d3a]">
        {status ? <span className="h-2 w-2 rounded-full bg-[#214d3a]" /> : null}
        {value}
      </div>
      <div className="mt-1 text-xs text-[#8b6f47]">{label}</div>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-[#d2c8ba] bg-white p-4 shadow-[inset_3px_0_0_#c9852b]">
      <div className="mb-3 text-xs font-semibold uppercase text-[#8b6f47]">{title}</div>
      {children}
    </div>
  );
}

function QualityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-[#d7cdbf] py-2 last:border-b-0">
      <span className="text-sm text-[#6b6258]">{label}</span>
      <span className="font-mono text-sm font-semibold text-[#1f2933]">{value}</span>
    </div>
  );
}
