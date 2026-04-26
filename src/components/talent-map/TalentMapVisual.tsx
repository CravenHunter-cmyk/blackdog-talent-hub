import { LanguageManagementTeam } from "@/components/talent-map/LanguageManagementTeam";
import type { LanguageResource, Readiness } from "@/types/talent";

type TalentMapVisualProps = {
  resources: LanguageResource[];
  selectedId: string;
  onSelect: (id: string) => void;
  detail: React.ReactNode;
};

function nodeClass(readiness: Readiness, isSelected: boolean) {
  const readinessStyle = {
    Core: "border-gray-950 bg-gray-950 text-white",
    Stable: "border-gray-700 bg-gray-700 text-white",
    Developing: "border-gray-500 bg-white text-gray-950",
    Backup: "border-gray-300 bg-gray-100 text-gray-700",
    Gap: "border-gray-200 bg-white text-gray-500",
  }[readiness];

  return [
    "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs font-semibold transition hover:bg-gray-100 hover:text-gray-950",
    readinessStyle,
    isSelected ? "ring-2 ring-gray-950 ring-offset-2" : "",
  ].join(" ");
}

export function TalentMapVisual({ resources, selectedId, onSelect, detail }: TalentMapVisualProps) {
  const selected = resources.find((item) => item.id === selectedId) ?? resources[0];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-950">Global Talent Map</h2>
          <p className="mt-1 text-sm text-gray-600">
            Click a language node to update the detail panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="rounded-md border border-gray-950 px-2 py-1">Core</span>
          <span className="rounded-md border border-gray-700 px-2 py-1">Stable</span>
          <span className="rounded-md border border-gray-400 px-2 py-1">Developing</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative h-[520px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <WorldMapSvg />

          {resources.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={nodeClass(item.readiness, selectedId === item.id)}
              style={{
                left: `${item.position.x}%`,
                top: `${item.position.y}%`,
                width: item.readiness === "Core" ? 44 : item.readiness === "Stable" ? 38 : 34,
                height: item.readiness === "Core" ? 44 : item.readiness === "Stable" ? 38 : 34,
              }}
              aria-label={`Select ${item.language} ${item.region}`}
            >
              {item.code}
            </button>
          ))}
        </div>

        {detail}
      </div>

      <LanguageManagementTeam selected={selected} />
    </section>
  );
}

function WorldMapSvg() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1000 560"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="140" x2="1000" y2="140" stroke="#e5e7eb" />
      <line x1="0" y1="280" x2="1000" y2="280" stroke="#e5e7eb" />
      <line x1="0" y1="420" x2="1000" y2="420" stroke="#e5e7eb" />
      <line x1="250" y1="0" x2="250" y2="560" stroke="#e5e7eb" />
      <line x1="500" y1="0" x2="500" y2="560" stroke="#e5e7eb" />
      <line x1="750" y1="0" x2="750" y2="560" stroke="#e5e7eb" />

      <path
        d="M72,145 C105,92 187,70 250,91 C292,105 318,126 344,159 C326,174 315,188 302,210 C266,199 238,214 219,246 C186,237 155,244 132,274 C91,255 62,220 72,145 Z"
        fill="#f3f4f6"
        stroke="#9ca3af"
      />
      <path
        d="M318,316 C360,309 396,337 403,382 C410,421 386,441 379,477 C374,508 353,535 332,512 C315,493 329,461 308,438 C286,413 275,384 288,356 C295,340 303,325 318,316 Z"
        fill="#f3f4f6"
        stroke="#9ca3af"
      />
      <path
        d="M470,132 C502,111 558,119 582,147 C596,165 585,189 558,191 C530,193 505,184 484,201 C456,194 443,157 470,132 Z"
        fill="#f3f4f6"
        stroke="#9ca3af"
      />
      <path
        d="M507,240 C553,226 613,251 632,306 C651,362 629,419 591,474 C557,456 541,421 526,381 C512,344 480,309 491,270 C494,258 499,248 507,240 Z"
        fill="#f3f4f6"
        stroke="#9ca3af"
      />
      <path
        d="M610,125 C684,78 796,74 888,127 C936,155 954,199 916,236 C888,263 835,249 806,279 C769,318 702,305 677,265 C647,268 606,251 593,219 C577,178 584,142 610,125 Z"
        fill="#f3f4f6"
        stroke="#9ca3af"
      />
      <path
        d="M713,292 C755,281 804,302 821,337 C803,374 748,382 719,349 C704,332 697,303 713,292 Z"
        fill="#f3f4f6"
        stroke="#9ca3af"
      />
      <path
        d="M760,402 C812,382 886,395 920,438 C895,473 813,481 763,456 C739,444 733,418 760,402 Z"
        fill="#f3f4f6"
        stroke="#9ca3af"
      />
    </svg>
  );
}
