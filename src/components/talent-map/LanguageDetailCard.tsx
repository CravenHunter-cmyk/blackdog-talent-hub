import type { LanguageResource, Readiness } from "@/types/talent";

type LanguageDetailCardProps = {
  selected: LanguageResource;
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

export function LanguageDetailCard({ selected }: LanguageDetailCardProps) {
  return (
    <aside className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <DetailLabel>Code</DetailLabel>
          <div className="mt-1 text-4xl font-semibold text-gray-950">{selected.code}</div>

          <div className="mt-4">
            <DetailLabel>Language</DetailLabel>
            <div className="mt-1 text-xl font-semibold text-gray-950">{selected.language}</div>
          </div>

          <div className="mt-4">
            <DetailLabel>Region</DetailLabel>
            <div className="mt-1 text-sm text-gray-800">{selected.region}</div>
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
        <SmallStat label="Online Now" value={selected.onlineNow.toString()} />
      </div>

      <DetailBlock title="Main Skill Coverage">
        <div className="flex flex-wrap gap-2">
          {selected.skills.map((skill) => (
            <span key={skill} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700">
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

      <DetailBlock title="Resource Notes">
        <p className="text-sm leading-6 text-gray-700">{selected.resourceNotes}</p>
      </DetailBlock>

      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <DetailLabel>Recommended Action</DetailLabel>
        <p className="mt-2 text-sm leading-6 text-gray-700">{selected.recommendedAction}</p>
      </div>
    </aside>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase text-gray-500">{children}</div>;
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="text-xl font-semibold text-gray-950">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-gray-200 p-4">
      <div className="mb-3 text-xs font-semibold uppercase text-gray-500">{title}</div>
      {children}
    </div>
  );
}

function QualityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-b-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-950">{value}</span>
    </div>
  );
}
