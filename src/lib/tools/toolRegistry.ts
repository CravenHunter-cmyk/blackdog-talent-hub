export type BlackDogToolStatus = "Active" | "Coming Soon";

export type BlackDogTool = {
  id: string;
  name: string;
  status: BlackDogToolStatus;
  description: string;
  href: string;
};

export const YOUTUBE_SPEECH_LINK_COLLECTOR_TOOL_ID = "youtube_speech_link_collector";

export const blackDogTools: BlackDogTool[] = [
  {
    id: YOUTUBE_SPEECH_LINK_COLLECTOR_TOOL_ID,
    name: "YouTube Speech Link Collector",
    status: "Active",
    description: "Search public YouTube video links by language, domain, and search targets.",
    href: "/workspace/tools/youtube-speech-link-collector",
  },
  {
    id: "talent-lead-parser",
    name: "Talent Lead Parser",
    status: "Coming Soon",
    description: "Parse raw candidate information into structured talent profiles.",
    href: "/workspace/tools?tool=talent-lead-parser",
  },
  {
    id: "lark-table-helper",
    name: "Lark Table Helper",
    status: "Coming Soon",
    description: "Prepare and transform data for Lark Sheets or Bitable.",
    href: "/workspace/tools?tool=lark-table-helper",
  },
  {
    id: "resource-matcher",
    name: "Resource Matcher",
    status: "Coming Soon",
    description: "Match project language needs with available talent resources.",
    href: "/workspace/tools?tool=resource-matcher",
  },
];

export function getBlackDogTool(toolId: string) {
  return blackDogTools.find((tool) => tool.id === toolId) || null;
}
