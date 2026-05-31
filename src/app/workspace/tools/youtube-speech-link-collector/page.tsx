import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopNav } from "@/components/layout/TopNav";
import { YoutubeSpeechLinkCollector } from "@/components/tools/YoutubeSpeechLinkCollector";

export const metadata: Metadata = {
  title: "YouTube Speech Link Collector | BlackDog Tools",
  description: "Create YouTube speech collection tasks, generate keywords, run batches, deduplicate results, and export task-level CSV.",
};

export default function Page() {
  return (
    <>
      <TopNav />
      <AccessGate route="/workspace/tools/youtube-speech-link-collector">
        <YoutubeSpeechLinkCollector />
      </AccessGate>
    </>
  );
}
