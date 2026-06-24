import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { AudioAnnotationPlatformPage } from "@/components/blackdog-platform/AudioAnnotationPlatformPage";
import { BlackDogPlatformShell } from "@/components/blackdog-platform/BlackDogPlatformShell";

export const metadata: Metadata = {
  title: "Audio Annotation Platform | BlackDog Platform",
  description: "Record, segment, annotate, review, and deliver speech data inside one controlled BlackDog workspace.",
};

export default function Page() {
  return (
    <AccessGate route="/blackdog-platform">
      <BlackDogPlatformShell>
        <AudioAnnotationPlatformPage />
      </BlackDogPlatformShell>
    </AccessGate>
  );
}
