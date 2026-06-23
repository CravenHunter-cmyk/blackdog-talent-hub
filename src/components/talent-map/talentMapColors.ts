const LANGUAGE_COLOR_PALETTE = [
  "#176B4D",
  "#0E8A83",
  "#1D7FA3",
  "#2F6DB3",
  "#6A5ACD",
  "#8B5FBF",
  "#C0568A",
  "#D97706",
  "#B7791F",
  "#9A6A2F",
  "#4F7D3A",
  "#2E9F6E",
  "#0891B2",
  "#64748B",
  "#7C6F64",
  "#B45309",
  "#0F766E",
  "#2563EB",
  "#9333EA",
  "#BE123C",
];

const LANGUAGE_COLOR_MAP: Record<string, string> = {
  EN: "#176B4D",
  ES: "#D97706",
  AR: "#8B5FBF",
  FR: "#1D7FA3",
  PT: "#2E9F6E",
  JA: "#BE123C",
  KO: "#0E8A83",
  RU: "#2F6DB3",
  DE: "#64748B",
  IT: "#B7791F",
  TR: "#C0568A",
  ID: "#0891B2",
  MS: "#4F7D3A",
  TH: "#9333EA",
  VI: "#9A6A2F",
  HI: "#2563EB",
  UR: "#7C6F64",
  BN: "#B45309",
  NE: "#0F766E",
  SW: "#2E9F6E",
  NO: "#1D7FA3",
  SV: "#6A5ACD",
  FI: "#0891B2",
  DA: "#B7791F",
  NL: "#0E8A83",
  PL: "#8B5FBF",
  UK: "#2563EB",
  AZ: "#9A6A2F",
  AM: "#64748B",
  KM: "#C0568A",
  YUE: "#D97706",
  CEB: "#4F7D3A",
  ZU: "#7C6F64",
  AF: "#B45309",
  FIL: "#0E8A83",
  BG: "#6A5ACD",
  CA: "#2F6DB3",
  CS: "#1D7FA3",
  EL: "#0F766E",
  HE: "#8B5FBF",
  HU: "#C0568A",
  RO: "#B7791F",
  SR: "#4F7D3A",
  SK: "#0891B2",
  TA: "#2E9F6E",
  TE: "#2563EB",
  MR: "#64748B",
  MY: "#9A6A2F",
  LO: "#D97706",
  SI: "#176B4D",
};

function hashString(value: string) {
  return value
    .split("")
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0);
}

export function getLanguageMarkerColor(code: string) {
  const normalized = code.toUpperCase();

  if (LANGUAGE_COLOR_MAP[normalized]) {
    return LANGUAGE_COLOR_MAP[normalized];
  }

  return LANGUAGE_COLOR_PALETTE[hashString(normalized) % LANGUAGE_COLOR_PALETTE.length];
}
