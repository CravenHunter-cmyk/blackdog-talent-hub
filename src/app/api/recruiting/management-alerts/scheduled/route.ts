import { NextResponse } from "next/server";
import { runAIGatewayTask } from "@/lib/ai/aiGateway";

export const runtime = "nodejs";

type ScheduledRisk = {
  id: string;
  focusItem: string;
  focusType: "Project" | "Language" | "HR";
  riskLevel: "Critical" | "High" | "Medium" | "Low" | "Healthy";
  riskScore: number;
  required?: number;
  inPool?: number;
  approved?: number;
  needed?: number;
  coveragePercent?: number;
  daysLeft?: number | null;
  dailyGap?: number;
  taskStatus?: string;
  applicants?: number;
  owner?: string;
  hrName?: string;
  assignedTasks?: number;
  pendingReviews?: number;
  acceptanceRate?: number;
  today?: number;
  riskFactors: string[];
};

function scheduledTopRisks(): ScheduledRisk[] {
  return [
    {
      id: "project-korean-llm-evaluation",
      focusItem: "Korean LLM Evaluation",
      focusType: "Project",
      riskLevel: "Critical",
      riskScore: 19,
      required: 30,
      approved: 8,
      needed: 22,
      coveragePercent: 27,
      daysLeft: 4,
      dailyGap: 5.5,
      taskStatus: "Open",
      applicants: 9,
      owner: "Julie Zhu",
      riskFactors: ["large_project_gap", "low_approved_coverage", "urgent_deadline", "high_daily_recruiting_pressure", "low_approval_conversion"],
    },
    {
      id: "language-japanese",
      focusItem: "Japanese Evaluator Pool",
      focusType: "Language",
      riskLevel: "High",
      riskScore: 10,
      required: 100,
      inPool: 80,
      needed: 20,
      coveragePercent: 80,
      daysLeft: 20,
      dailyGap: 1,
      owner: "Maya Chen",
      riskFactors: ["large_absolute_gap", "high_daily_recruiting_pressure"],
    },
    {
      id: "hr-julie-zhu",
      focusItem: "Julie Zhu",
      focusType: "HR",
      riskLevel: "Medium",
      riskScore: 9,
      hrName: "Julie Zhu",
      assignedTasks: 4,
      pendingReviews: 6,
      acceptanceRate: 67,
      today: 4,
      riskFactors: ["many_assigned_tasks", "review_backlog", "low_acceptance_rate", "hr_overloaded"],
    },
  ];
}

export async function POST() {
  const generatedAt = new Date().toISOString();
  const topRisks = scheduledTopRisks();
  const topFocus = {
    language: topRisks.find((risk) => risk.focusType === "Language") ?? null,
    project: topRisks.find((risk) => risk.focusType === "Project") ?? null,
    hr: topRisks.find((risk) => risk.focusType === "HR") ?? null,
  };
  const rankings = {
    languageTop3: topRisks.filter((risk) => risk.focusType === "Language"),
    projectTop3: topRisks.filter((risk) => risk.focusType === "Project"),
    hrTop3: topRisks.filter((risk) => risk.focusType === "HR"),
  };
  const result = await runAIGatewayTask({
    task: "analyze_management_focus",
    input: {
      generatedAt,
      trigger: "scheduled",
      topFocus,
      rankings,
    },
  });

  const alerts =
    result.ok && "task" in result && result.task === "analyze_management_focus" ? result.result.focusAlerts : topFocus;

  return NextResponse.json({
    ok: true,
    trigger: "scheduled",
    generatedAt,
    alerts,
    rankings,
    aiOk: result.ok,
    error: result.ok ? undefined : result.error,
    persistence: "not_configured",
    note: "Database persistence will be connected later.",
  });
}

export async function GET() {
  return POST();
}
