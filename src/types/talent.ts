export type Readiness = "Core" | "Stable" | "Developing" | "Backup" | "Gap";

export type ReadinessFilter = "All" | Readiness;

export type OnlineStatusFilter = "All" | "Online Now" | "Offline";

export type ContinentGroup =
  | "Americas"
  | "Europe"
  | "Middle East & Africa"
  | "Asia-Pacific"
  | "Global / RoW";

export type LanguageResource = {
  id: string;
  code: string;
  language: string;
  region: string;
  totalResources: number;
  activeTalents: number;
  onlineNow: number;
  readiness: Readiness;
  averageRate: string;
  skills: string[];
  quality: {
    A: number;
    B: number;
    C: number;
    Pending: number;
  };
  resourceNotes: string;
  recommendedAction: string;
  position: {
    x: number;
    y: number;
  };
  lat: number;
  lng: number;
  continentGroup: ContinentGroup;
};

export type LanguageTeamOption = {
  optionName: string;
  coverage: string;
  projectManager: string;
  resourceManager: string;
  pocManager: string;
  recommendedFor: string;
  status: "Recommended" | "Available" | "Backup";
};

export type LanguageManagementTeam = {
  language: string;
  region?: string;
  options: LanguageTeamOption[];
};
