import { languageResources } from "@/data/languageResources";
import type { LanguageManagementTeam, LanguageResource, LanguageTeamOption } from "@/types/talent";

const managerSets = [
  ["Maya Chen", "Noah Patel", "Leah Brooks"],
  ["Elena Rossi", "Samir Haddad", "Iris Wong"],
  ["Daniel Kim", "Aisha Khan", "Marco Silva"],
  ["Nina Bauer", "Omar Farouk", "Clara Nguyen"],
  ["Jonas Meyer", "Priya Nair", "Hana Sato"],
  ["Ava Morgan", "Luis Ortega", "Mei Tan"],
];

const optionProfiles = [
  { optionName: "Team A", recommendedFor: "LLM Evaluation / Search Evaluation", status: "Recommended" },
  { optionName: "Team B", recommendedFor: "Localization / Ads", status: "Available" },
  { optionName: "Team C", recommendedFor: "Speech QA / Overflow", status: "Backup" },
] satisfies Array<Pick<LanguageTeamOption, "optionName" | "recommendedFor" | "status">>;

function buildOptions(resource: LanguageResource, offset: number): LanguageTeamOption[] {
  return optionProfiles.map((profile, index) => {
    const managers = managerSets[(offset + index) % managerSets.length];

    return {
      ...profile,
      coverage: `${resource.language} - ${resource.region}`,
      projectManager: managers[0],
      resourceManager: managers[1],
      pocManager: managers[2],
    };
  });
}

export const languageManagementTeams: LanguageManagementTeam[] = [
  ...languageResources.map((resource, index) => ({
    language: resource.language,
    region: resource.region,
    options: buildOptions(resource, index),
  })),
  {
    language: "Global Backup",
    options: [
      {
        optionName: "Global Team A",
        coverage: "Global Backup",
        projectManager: "Maya Chen",
        resourceManager: "Samir Haddad",
        pocManager: "Hana Sato",
        recommendedFor: "Cross-language overflow",
        status: "Available",
      },
      {
        optionName: "Global Team B",
        coverage: "Global Backup",
        projectManager: "Daniel Kim",
        resourceManager: "Priya Nair",
        pocManager: "Iris Wong",
        recommendedFor: "Pilot projects / urgent setup",
        status: "Backup",
      },
    ],
  },
];
