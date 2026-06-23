import type { LanguageResource, Readiness } from "@/types/talent";
import { getLanguageMarkerColor } from "@/components/talent-map/talentMapColors";

type LanguageDetailCardProps = {
  selected: LanguageResource;
};

type LanguageResourceWithCountryCode = LanguageResource & {
  countryCode?: string | null;
};

function readinessBadgeClass(readiness: Readiness) {
  const styles = {
    Core: "detail-readiness-badge--core",
    Stable: "detail-readiness-badge--stable",
    Developing: "detail-readiness-badge--developing",
    Backup: "detail-readiness-badge--backup",
    Gap: "detail-readiness-badge--gap",
  };

  return styles[readiness];
}

function normalizeRegion(region?: string) {
  return String(region || "").trim().toLowerCase();
}

const regionDisplayNameMap: Record<string, string> = {
  row: "Global / RoW",
  "global / row": "Global / RoW",
  "north american accent": "North America",
};

const regionCountryCodeMap: Record<string, string> = {
  uk: "GB",
  "united kingdom": "GB",
  gb: "GB",
  us: "US",
  usa: "US",
  "united states": "US",
  "north american accent": "US",
  canada: "CA",
  "south korea": "KR",
  korea: "KR",
  korean: "KR",
  "south africa": "ZA",
  "saudi arabia": "SA",
  ksa: "SA",
  uae: "AE",
  "united arab emirates": "AE",
  egypt: "EG",
  qatar: "QA",
  kuwait: "KW",
  oman: "OM",
  bahrain: "BH",
  jordan: "JO",
  iraq: "IQ",
  lebanon: "LB",
  israel: "IL",
  morocco: "MA",
  algeria: "DZ",
  tunisia: "TN",
  libya: "LY",
  sudan: "SD",
  kenya: "KE",
  ethiopia: "ET",
  nigeria: "NG",
  somalia: "SO",
  zimbabwe: "ZW",
  madagascar: "MG",
  senegal: "SN",
  "dr congo": "CD",
  ghana: "GH",
  rwanda: "RW",
  burundi: "BI",
  japan: "JP",
  indonesia: "ID",
  thailand: "TH",
  vietnam: "VN",
  india: "IN",
  pakistan: "PK",
  bangladesh: "BD",
  nepal: "NP",
  myanmar: "MM",
  cambodia: "KH",
  laos: "LA",
  "sri lanka": "LK",
  china: "CN",
  "mainland china": "CN",
  taiwan: "TW",
  "hong kong": "HK",
  singapore: "SG",
  malaysia: "MY",
  philippines: "PH",
  spain: "ES",
  mexico: "MX",
  colombia: "CO",
  argentina: "AR",
  chile: "CL",
  peru: "PE",
  ecuador: "EC",
  bolivia: "BO",
  paraguay: "PY",
  uruguay: "UY",
  venezuela: "VE",
  guatemala: "GT",
  "costa rica": "CR",
  panama: "PA",
  "dominican republic": "DO",
  "puerto rico": "PR",
  brazil: "BR",
  portugal: "PT",
  france: "FR",
  belgium: "BE",
  switzerland: "CH",
  germany: "DE",
  austria: "AT",
  italy: "IT",
  netherlands: "NL",
  sweden: "SE",
  norway: "NO",
  finland: "FI",
  denmark: "DK",
  russia: "RU",
  turkey: "TR",
  ukraine: "UA",
  azerbaijan: "AZ",
  bulgaria: "BG",
  "czech republic": "CZ",
  greece: "GR",
  hungary: "HU",
  poland: "PL",
  romania: "RO",
  serbia: "RS",
  slovakia: "SK",
};

function getRegionCountryCode(region?: string) {
  return regionCountryCodeMap[normalizeRegion(region)] ?? null;
}

function getRegionFallbackIcon(region?: string) {
  const normalized = normalizeRegion(region);

  if (normalized.includes("global") || normalized.includes("row")) return "🌐";
  if (normalized === "eu" || normalized.includes("europe")) return "🇪🇺";
  if (normalized.includes("mena") || normalized.includes("middle east") || normalized.includes("sahel")) return "🌍";
  if (normalized.includes("north america")) return "🌎";
  if (normalized.includes("asia")) return "🌏";

  return "🌐";
}

function getRegionDisplay(region: string) {
  const normalized = normalizeRegion(region);

  return regionDisplayNameMap[normalized] ?? region;
}

function getSelectedCountryCode(selected: LanguageResource) {
  const explicitCountryCode = (selected as LanguageResourceWithCountryCode).countryCode?.trim();

  return explicitCountryCode ? explicitCountryCode.toUpperCase() : getRegionCountryCode(selected.region);
}

function getRegionTimezone(region?: string) {
  const map: Record<string, string> = {
    uk: "UTC+0",
    "united kingdom": "UTC+0",
    "south korea": "UTC+9",
    korea: "UTC+9",
    japan: "UTC+9",
    china: "UTC+8",
    "mainland china": "UTC+8",
    "hong kong": "UTC+8",
    taiwan: "UTC+8",
    singapore: "UTC+8",
    malaysia: "UTC+8",
    philippines: "UTC+8",
    indonesia: "UTC+7",
    thailand: "UTC+7",
    vietnam: "UTC+7",
    cambodia: "UTC+7",
    laos: "UTC+7",
    india: "UTC+5:30",
    pakistan: "UTC+5",
    bangladesh: "UTC+6",
    nepal: "UTC+5:45",
    "sri lanka": "UTC+5:30",
    "south africa": "UTC+2",
    kenya: "UTC+3",
    ethiopia: "UTC+3",
    nigeria: "UTC+1",
    ghana: "UTC+0",
    "saudi arabia": "UTC+3",
    ksa: "UTC+3",
    uae: "UTC+4",
    egypt: "UTC+2",
    qatar: "UTC+3",
    kuwait: "UTC+3",
    oman: "UTC+4",
    bahrain: "UTC+3",
    jordan: "UTC+3",
    iraq: "UTC+3",
    lebanon: "UTC+2",
    israel: "UTC+2",
    france: "UTC+1",
    germany: "UTC+1",
    spain: "UTC+1",
    italy: "UTC+1",
    portugal: "UTC+0",
    netherlands: "UTC+1",
    sweden: "UTC+1",
    norway: "UTC+1",
    finland: "UTC+2",
    denmark: "UTC+1",
    brazil: "UTC-3",
    mexico: "UTC-6",
    "united states": "UTC-5/-8",
    us: "UTC-5/-8",
    canada: "UTC-5/-8",
    russia: "UTC+3",
    turkey: "UTC+3",
  };

  return map[normalizeRegion(region)] ?? "Regional";
}

function getRecommendedUseCase(node: LanguageResource) {
  const readiness = node.readiness.toLowerCase();
  const language = node.language.toLowerCase();

  if (readiness.includes("core")) return "LLM Eval / Search QA";
  if (readiness.includes("stable")) return "Ads QA / Localization";
  if (readiness.includes("gap")) return "Backup Pool / Speech QA";
  if (language.includes("english")) return "LLM Eval / Search QA";
  if (language.includes("korean") || language.includes("japanese")) return "Ads QA / Localization";
  if (language.includes("arabic")) return "Speech QA / Localization";

  return "Evaluation / Localization";
}

function getDeliverySignal(readiness: Readiness) {
  const value = readiness.toLowerCase();

  if (value.includes("core")) return "Core Ready";
  if (value.includes("stable")) return "Stable Capacity";
  if (value.includes("gap")) return "Gap Coverage";
  if (value.includes("developing")) return "Developing";

  return "Active Pool";
}

export function LanguageDetailCard({ selected }: LanguageDetailCardProps) {
  const accentColor = getLanguageMarkerColor(selected.code);
  const regionDisplay = getRegionDisplay(selected.region);
  const countryCode = getSelectedCountryCode(selected);

  return (
    <aside className="language-detail-card detail-panel relative flex h-full min-h-[650px] flex-col overflow-hidden rounded-[28px] border border-[rgba(95,170,230,0.18)] bg-[rgba(3,15,32,0.78)] p-6 shadow-[0_28px_90px_rgba(0,8,24,0.42),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[22px] saturate-[118%] lg:min-h-[700px]">
      <div className="detail-panel-content relative z-10 flex h-full flex-col gap-5">
        <section className="detail-language-card language-detail-section">
          <DetailLabel>Language &amp; Region</DetailLabel>
          <div className="mt-4 grid grid-cols-[84px_minmax(0,1fr)] items-center gap-5">
            <div
              className="detail-code-box language-detail-code-block inline-flex items-center justify-center border font-mono font-black leading-none tracking-[-0.08em] text-[#f8fbff]"
              style={{
                boxShadow: `0 0 34px ${accentColor}44, inset 0 1px 0 rgba(255,255,255,0.12)`,
                fontSize: selected.code.length > 2 ? "33px" : undefined,
              }}
            >
              {selected.code}
            </div>
            <div className="detail-language-meta min-w-0">
              <div className="detail-language-name">{selected.language}</div>
              <div className="detail-region-label">Region</div>
              <div className="detail-region-value">
                <RegionFlag countryCode={countryCode} region={regionDisplay} />
                <span>{regionDisplay}</span>
              </div>
            </div>
          </div>
          <span className="detail-paw-watermark" aria-hidden="true" />
        </section>

        <section className="detail-readiness-row language-detail-section">
          <DetailLabel>Readiness</DetailLabel>
          <span className={`detail-readiness-badge ${readinessBadgeClass(selected.readiness)}`}>
            {selected.readiness}
          </span>
        </section>

        <div className="detail-metrics-grid grid grid-cols-3 gap-3">
          <SmallStat label="Total" value={selected.totalResources.toString()} />
          <SmallStat label="Active" value={selected.activeTalents.toString()} />
          <SmallStat label="Online" value={selected.onlineNow.toString()} status />
        </div>

        <OperationSnapshot />
        <RegionIntelligence selected={selected} />
      </div>

    </aside>
  );
}

function RegionFlag({ countryCode, region }: { countryCode: string | null; region: string }) {
  if (countryCode) {
    return (
      <span
        className={`fi fi-${countryCode.toLowerCase()} detail-region-flag`}
        role="img"
        aria-label={`${region} flag`}
      />
    );
  }

  return (
    <span className="detail-region-fallback-icon" role="img" aria-label={`${region} region`}>
      {getRegionFallbackIcon(region)}
    </span>
  );
}

function RegionIntelligence({ selected }: { selected: LanguageResource }) {
  const items = [
    {
      label: "Native Pool",
      value: `${selected.totalResources} reviewers`,
    },
    {
      label: "Timezone",
      value: getRegionTimezone(selected.region),
    },
    {
      label: "Best For",
      value: getRecommendedUseCase(selected),
    },
    {
      label: "Delivery Signal",
      value: getDeliverySignal(selected.readiness),
    },
  ];

  return (
    <section className="region-intelligence-card">
      <div className="region-intelligence-title">Selected Region Intelligence</div>
      <div className="region-intelligence-grid">
        {items.map((item) => (
          <div className="region-intelligence-item" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function SmallStat({ label, value, status = false }: { label: string; value: string; status?: boolean }) {
  return (
    <div className="detail-metric-card rounded-[18px] border border-[rgba(95,170,230,0.14)] bg-[rgba(10,28,52,0.72)] p-4 shadow-[0_14px_30px_rgba(0,8,24,0.26),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
      <div className="detail-metric-value flex items-center gap-2 font-mono font-black leading-none tabular-nums text-[#f8fbff]">
        {status ? <span className="online-dot h-2 w-2 rounded-full bg-[#19c8b4] shadow-[0_0_14px_rgba(25,200,180,0.62)]" /> : null}
        {value}
      </div>
      <div className="detail-metric-label mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[rgba(220,235,255,0.62)]">{label}</div>
    </div>
  );
}

function OperationSnapshot() {
  const ops = [
    {
      label: "Avg. Daily Hours",
      value: "6.5h",
      tone: "text-[#43d6ff]",
      chart: "line",
    },
    {
      label: "Historical Tasks",
      value: "128",
      tone: "text-[#1f7bff]",
      chart: "bars",
    },
    {
      label: "Recent Delivery",
      value: "42",
      tone: "text-[#f59e1b]",
      chart: "gold",
    },
  ];

  return (
    <section className="snapshot-card rounded-[22px] border border-[rgba(95,170,230,0.14)] bg-[rgba(7,25,50,0.64)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
      <div className="snapshot-title mb-3 flex items-center justify-between">
        <span>OPERATION SNAPSHOT</span>
      </div>

      <div className="snapshot-list grid gap-2.5">
        {ops.map((op) => (
          <div key={op.label} className="snapshot-row grid items-center rounded-[14px] border border-[rgba(95,170,230,0.10)] bg-[rgba(10,28,52,0.52)]">
            <strong className={`snapshot-value font-mono font-black leading-none tabular-nums ${op.tone}`}>{op.value}</strong>
            <span className="snapshot-label min-w-0 font-bold text-[rgba(235,245,255,0.88)]">{op.label}</span>
            <MiniChart type={op.chart} />
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniChart({ type }: { type: string }) {
  if (type === "bars") {
    const heights = [8, 13, 18, 12, 24, 30, 20, 34, 26];

    return (
      <svg className="mini-chart mini-chart-bars" viewBox="0 0 120 44" aria-hidden="true">
        {heights.map((height, index) => (
          <rect
            key={index}
            x={10 + index * 11}
            y={38 - height}
            width="4.5"
            height={height}
            rx="2.2"
          />
        ))}
      </svg>
    );
  }

  const isGold = type === "gold";
  const points = isGold
    ? "4,33 18,28 31,18 45,24 58,12 74,26 90,20 104,29 116,18"
    : "4,31 18,24 30,28 44,18 57,22 72,12 88,19 103,10 116,15";

  return (
    <svg className={`mini-chart mini-chart-line${isGold ? " mini-chart-line--gold" : ""}`} viewBox="0 0 120 44" aria-hidden="true">
      <polyline points={points} />
      {points.split(" ").map((point, index) => {
        const [cx, cy] = point.split(",");

        return <circle key={index} cx={cx} cy={cy} r="2.2" />;
      })}
    </svg>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <div className="detail-label text-[11px] font-black uppercase tracking-[0.18em] text-[rgba(220,235,255,0.62)]">{children}</div>;
}
