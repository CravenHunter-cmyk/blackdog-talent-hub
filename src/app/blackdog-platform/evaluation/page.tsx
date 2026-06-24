import type { Metadata } from "next";
import { AccessGate } from "@/components/auth/AccessGate";
import { BlackDogPlatformShell } from "@/components/blackdog-platform/BlackDogPlatformShell";
import { EvaluationPlatformPage } from "@/components/blackdog-platform/EvaluationPlatformPage";

export const metadata: Metadata = {
  title: "Evaluation Platform | BlackDog Platform",
  description: "Evaluate AI outputs, model behavior, task quality, and reviewer decisions with traceable workflows.",
};

export default function Page() {
  return (
    <AccessGate route="/blackdog-platform/evaluation">
      <BlackDogPlatformShell>
        <EvaluationPlatformPage />
      </BlackDogPlatformShell>
    </AccessGate>
  );
}
