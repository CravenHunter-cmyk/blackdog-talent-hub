import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BlackDogLogo } from "@/components/brand/BlackDogLogo";
import { VideoStorySection } from "./VideoStorySection";

const heroTags = [
  {
    label: ["Private", "Customization"],
    icon: (
      <path d="M12 6.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm0 10.25c-4.5 0-8.25 2.25-8.25 5.25V23h16.5v-1.25c0-3-3.75-5.25-8.25-5.25Z" />
    ),
  },
  {
    label: ["Built for Your", "Scenario"],
    icon: (
      <path d="M6 7.5h12M6 12h7.5M6 16.5h10.5M19 7.5l2 2 3-4M19 12l2 2 3-4M19 16.5l2 2 3-4" />
    ),
  },
  {
    label: ["Learns You,", "Grows With You"],
    icon: (
      <path d="M12 4.5v4m0 7v4m7.5-7.5h-4m-7 0h-4m2.2-5.3 2.8 2.8m5 5 2.8 2.8m0-10.6-2.8 2.8m-5 5-2.8 2.8" />
    ),
  },
  {
    label: ["Tools You Can", "Actually Use"],
    icon: (
      <path d="M7.5 7.5h9v9h-9v-9Zm-2.5 13h14M12 4.5v3M4.5 12h3M12 19.5v3M19.5 12h-3" />
    ),
  },
];

function HeroTag({ label, icon }: { label: string[]; icon: ReactNode }) {
  return (
    <div className="flex w-[120px] flex-col items-start gap-2">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4efff] text-[#7c5cff] shadow-[0_8px_18px_rgba(124,92,255,0.12)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
          {icon}
        </svg>
      </div>
      <div className="whitespace-pre-line text-[12px] font-bold leading-[1.15] tracking-[-0.01em] text-[#101828]">
        {label.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroLogoMark() {
  return (
    <BlackDogLogo size="lg" tone="default" />
  );
}

function NeedStoryIcon({
  variant,
  className = "",
}: {
  variant: "refresh" | "user" | "sparkles";
  className?: string;
}) {
  const iconClass = `h-6 w-6 ${className}`;

  if (variant === "refresh") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 11a8 8 0 0 0-13.657-5.657L4 5.686" />
        <path d="M4 4v4h4" />
        <path d="M4 13a8 8 0 0 0 13.657 5.657L20 18.314" />
        <path d="M20 20v-4h-4" />
      </svg>
    );
  }

  if (variant === "user") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.4-3.2 4-5 7-5s5.6 1.8 7 5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 13.9 8l4.9.5-3.7 3.1 1.2 4.8L12 14.8 7.7 16.4l1.2-4.8L5.2 8.5 10.1 8 12 3.5Z" />
      <path d="M18.5 3.5v2.5M19.75 4.75h-2.5" />
    </svg>
  );
}

function NeedCardIcon({
  variant,
  className = "",
}: {
  variant: "clipboard" | "message" | "user" | "briefcase" | "calendar" | "map";
  className?: string;
}) {
  const iconClass = `h-5 w-5 ${className}`;

  switch (variant) {
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6" y="5" width="12" height="15" rx="2.5" />
          <path d="M9 5V4.2A1.2 1.2 0 0 1 10.2 3h3.6A1.2 1.2 0 0 1 15 4.2V5" />
          <path d="M9 10h6M9 14h4" />
        </svg>
      );
    case "message":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7.5 18.5 4 20l1.1-3.6A8 8 0 1 1 7.5 18.5Z" />
          <path d="M8 10h8M8 13h5" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.5 20c1.3-3 3.8-4.8 6.5-4.8s5.2 1.8 6.5 4.8" />
        </svg>
      );
    case "briefcase":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="8" width="16" height="11" rx="2.5" />
          <path d="M9 8V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
          <path d="M4 12h16" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="5" width="16" height="15" rx="2.5" />
          <path d="M8 3.8V7M16 3.8V7M4 9h16" />
          <path d="M8.5 13.5h.01M11.9 13.5h.01M15.3 13.5h.01" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21c4.4-3.5 7-7.2 7-10.8A7 7 0 0 0 5 10.2C5 13.8 7.6 17.5 12 21Z" />
          <circle cx="12" cy="10.5" r="2.2" />
        </svg>
    );
  }
}

function ToolStoryIcon({
  variant,
  className = "",
}: {
  variant: "sliders" | "user" | "cube";
  className?: string;
}) {
  const iconClass = `h-8 w-8 ${className}`;

  if (variant === "sliders") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6h16" />
        <path d="M4 12h10" />
        <path d="M4 18h13" />
        <circle cx="15" cy="6" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="9" cy="12" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="12" cy="18" r="1.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (variant === "user") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="3.6" />
        <path d="M5.5 20c1.3-3.1 4-5 6.5-5s5.2 1.9 6.5 5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.5 7.5 12 5l4.5 2.5v5L12 15l-4.5-2.5v-5Z" />
      <path d="M12 15v4" />
      <path d="M7.5 7.5 12 10l4.5-2.5" />
    </svg>
  );
}

function HeroCanvas() {
  return (
    <div className="relative h-[clamp(680px,42vw,740px)] min-h-[700px] overflow-hidden rounded-[40px] border border-[rgba(255,255,255,0.45)] bg-[linear-gradient(180deg,#fff8f1_0%,#fff6ee_40%,#f8f3ff_100%)] shadow-[0_24px_70px_rgba(18,24,38,0.10)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,248,241,0.98)_0%,rgba(255,248,241,0.94)_26%,rgba(255,248,241,0.78)_38%,rgba(255,248,241,0.36)_52%,rgba(255,248,241,0.08)_68%,rgba(255,248,241,0)_100%)]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/BlackdogBrain_01.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "62% center",
          backgroundSize: "cover",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,255,255,0.30),transparent_24%),radial-gradient(circle_at_28%_74%,rgba(255,255,255,0.12),transparent_24%)]" />
      <div className="relative z-10 flex h-full items-start">
        <div className="w-full max-w-[760px] px-6 pt-[clamp(46px,4.8vw,72px)] pb-[56px] sm:px-8 lg:px-[clamp(48px,5.5vw,92px)]">
          <div className="mb-14">
            <HeroLogoMark />
          </div>
          <h1 className="mt-5 max-w-[760px] text-[clamp(52px,4.3vw,68px)] font-black leading-[1.04] tracking-[-0.045em] text-[#111827]">
            <span className="block">Every need</span>
            <span className="block">deserves its own</span>
            <span className="block">
              <span className="not-italic text-[#ff6a1a]">dedicated</span> AI tool.
            </span>
          </h1>
          <p className="mt-5 max-w-[460px] text-[17px] leading-[1.55] text-[#667085]">
            BlackDog Brain turns AI into practical tools built around your real needs.
          </p>

          <div className="mt-[30px] max-w-[620px]">
            <HeroFeatureList />
          </div>

          <div className="mt-[28px] flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-full bg-[#ff6a1a] px-7 text-sm font-bold text-white shadow-[0_16px_30px_rgba(255,106,26,0.24)] transition hover:-translate-y-[1px] hover:shadow-[0_20px_34px_rgba(255,106,26,0.3)]"
            >
              Get Started
            </Link>
            <Link
              href="/blackdog-brain/evaluation-platform"
              className="inline-flex h-12 items-center rounded-full border border-[rgba(17,24,39,0.12)] bg-white/76 px-7 text-sm font-bold text-[#101828] shadow-[0_10px_24px_rgba(18,24,38,0.06)] transition hover:-translate-y-[1px] hover:bg-white"
            >
              See Examples
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function NeedStoryItem({
  variant,
  title,
  text,
}: {
  variant: "refresh" | "user" | "sparkles";
  title: string;
  text?: string;
}) {
  const accent = variant === "refresh" ? "#ff6a1a" : "#7c5cff";

  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.74)] text-[color:var(--accent)] shadow-[0_10px_24px_rgba(18,24,38,0.08)]" style={{ ["--accent" as never]: accent }}>
        <NeedStoryIcon variant={variant} className="h-6 w-6" />
      </div>
      <div className="max-w-[500px]">
        <p className="text-[16px] font-extrabold leading-6 text-[#111827]">{title}</p>
        {text ? <p className="mt-1 text-[15px] leading-6 text-[#667085]">{text}</p> : null}
      </div>
    </div>
  );
}

function NeedNeedGraph() {
  const cards = [
    {
      title: "Evaluation Standards",
      icon: "clipboard" as const,
      style: { left: "11%", top: "8%" },
    },
    {
      title: "Important Conversations",
      icon: "message" as const,
      style: { right: "6%", top: "8%" },
    },
    {
      title: "Daily Decisions",
      icon: "user" as const,
      style: { left: "0%", top: "34%" },
    },
    {
      title: "Project Information",
      icon: "briefcase" as const,
      style: { left: "2%", top: "58%" },
    },
    {
      title: "Personal Habits",
      icon: "calendar" as const,
      style: { right: "5%", top: "34%" },
    },
    {
      title: "Your Context",
      icon: "map" as const,
      style: { right: "8%", top: "58%" },
    },
  ];

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-[30px] translate-x-[-24px] translate-y-[-8px] scale-[0.98] transform-origin-center">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 600" fill="none" aria-hidden="true">
        <defs>
          <filter id="needGlow">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line x1="480" y1="205" x2="175" y2="58" stroke="rgba(255,106,26,0.45)" strokeWidth="1.5" strokeDasharray="5 5" />
        <line x1="480" y1="205" x2="790" y2="60" stroke="rgba(255,106,26,0.45)" strokeWidth="1.5" strokeDasharray="5 5" />
        <line x1="480" y1="205" x2="125" y2="220" stroke="rgba(255,106,26,0.45)" strokeWidth="1.5" strokeDasharray="5 5" />
        <line x1="480" y1="205" x2="150" y2="380" stroke="rgba(255,106,26,0.45)" strokeWidth="1.5" strokeDasharray="5 5" />
        <line x1="480" y1="205" x2="805" y2="220" stroke="rgba(255,106,26,0.45)" strokeWidth="1.5" strokeDasharray="5 5" />
        <line x1="480" y1="205" x2="745" y2="380" stroke="rgba(255,106,26,0.45)" strokeWidth="1.5" strokeDasharray="5 5" />
        <circle cx="480" cy="205" r="152" stroke="rgba(255,106,26,0.12)" strokeWidth="2" strokeDasharray="6 8" filter="url(#needGlow)" />
        <circle cx="480" cy="205" r="214" stroke="rgba(124,92,255,0.08)" strokeWidth="2" strokeDasharray="4 10" />
        <circle cx="480" cy="205" r="276" stroke="rgba(255,106,26,0.06)" strokeWidth="2" />
      </svg>

      <div
        className="absolute left-[48%] top-[38%] z-20 flex h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[8px] border-[rgba(255,255,255,0.65)] bg-[radial-gradient(circle_at_30%_30%,#ff8a2a_0%,#ff6a1a_70%,#f4570b_100%)] text-center text-white shadow-[0_18px_45px_rgba(255,106,26,0.35)]"
      >
        <div className="text-[24px] font-black leading-[1.04]">
          Your
          <br />
          Real
          <br />
          Need
        </div>
      </div>

      {cards.map((card) => (
        <div
          key={card.title}
          className="absolute z-20 flex h-[64px] w-[200px] min-w-[200px] items-center gap-3 rounded-[18px] border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.88)] px-[18px] py-0 text-[#111827] shadow-[0_14px_34px_rgba(18,24,38,0.10)] backdrop-blur-[10px]"
          style={card.style}
        >
          <NeedCardIcon variant={card.icon} className="h-7 w-7 text-[#7c5cff]" />
          <span className="text-[15px] font-extrabold leading-[1.18]">{card.title}</span>
        </div>
      ))}
    </div>
  );
}

function HeroFeatureList() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-5 sm:gap-y-5 xl:grid-cols-4 xl:gap-x-7 xl:gap-y-0">
      {heroTags.map((tag) => (
        <HeroTag key={tag.label.join("-")} label={tag.label} icon={tag.icon} />
      ))}
    </div>
  );
}

export function BrainStoryScroll() {
  return (
    <div className="bg-[#fff8f1] text-[#111827]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_12%,rgba(255,106,26,0.10),transparent_28%),radial-gradient(circle_at_80%_16%,rgba(124,92,255,0.10),transparent_30%),linear-gradient(180deg,#fff8f1_0%,#fffdf8_55%,#fff8f3_100%)]" />

      <main className="mx-auto w-[min(calc(100vw-40px),1280px)] space-y-24 px-0 pt-9 pb-[72px] sm:w-[min(calc(100vw-48px),1280px)] sm:pt-9 sm:pb-[72px] lg:w-[min(calc(100vw-56px),1280px)] lg:pt-9 lg:pb-[72px]">
        <section id="overview" className="scroll-mt-28">
          <div className="relative left-1/2 w-[min(1520px,calc(100vw-64px))] -translate-x-1/2">
            <HeroCanvas />
          </div>
        </section>

        <VideoStorySection />

        <section id="solutions" className="scroll-mt-28">
          <div className="relative left-1/2 w-[min(1520px,calc(100vw-64px))] -translate-x-1/2 overflow-hidden rounded-[36px] bg-[#fff8f1] shadow-[0_24px_80px_rgba(18,24,38,0.08)]">
            <div
              className="absolute inset-0 bg-no-repeat"
              style={{
                backgroundImage: "url('/images/BlackdogBrain_02.png')",
                backgroundSize: "100% auto",
                backgroundPosition: "center bottom",
                backgroundColor: "#fff8f1",
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.94)_28%,rgba(255,255,255,0.68)_44%,rgba(255,255,255,0.22)_58%,rgba(255,255,255,0)_72%)]" />

            <div className="relative z-10 grid gap-7 px-6 py-16 sm:px-8 sm:py-18 lg:min-h-[680px] lg:grid-cols-[minmax(420px,0.44fr)_minmax(0,0.56fr)] lg:items-center lg:gap-8 lg:px-[56px] lg:py-[64px]">
              <div className="max-w-[560px] lg:pl-9">
                <div className="text-[clamp(40px,3.6vw,54px)] font-black leading-[1.06] tracking-[-0.035em] text-[#111827]">
                  It starts with
                  <span className="block">
                    your <span className="text-[#ff6a1a]">real need</span>
                  </span>
                </div>
                <div className="mt-5 h-[4px] w-[42px] rounded-full bg-[#ff6a1a]" />

                <div className="mt-8 space-y-8">
                  <NeedStoryItem
                    variant="refresh"
                    title="Some problems keep coming back."
                    text="They appear in your work, your communication, your decisions, and even your daily life."
                  />
                  <NeedStoryItem
                    variant="user"
                    title="Behind each problem, there is a real scenario that belongs to you."
                    text=""
                  />
                  <NeedStoryItem
                    variant="sparkles"
                    title="BlackDog Brain understands that scenario."
                    text="It breaks the problem into a clear process, and turns it into a tool that fits you."
                  />
                </div>
              </div>

              <div className="relative min-h-[540px] overflow-visible">
                <div className="origin-center translate-x-[-40px] translate-y-[12px] scale-[0.9]">
                  <NeedNeedGraph />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="tools" className="scroll-mt-28">
          <div className="relative left-1/2 w-[min(1520px,calc(100vw-64px))] -translate-x-1/2 overflow-hidden rounded-[36px] bg-[#fff4ea] shadow-[0_24px_80px_rgba(18,24,38,0.08)]">
            <div
              className="absolute inset-0 bg-no-repeat"
              style={{
                backgroundImage: "url('/images/BlackdogBrain_03.jpeg')",
                backgroundSize: "cover",
                backgroundPosition: "center center",
                backgroundColor: "#fff4ea",
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 z-[1] w-[48%] bg-[radial-gradient(circle_at_18%_18%,rgba(255,128,48,0.16),transparent_34%),linear-gradient(90deg,rgba(255,237,218,0.84),rgba(255,246,235,0.22),transparent)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,238,220,0.96)_0%,rgba(255,241,226,0.92)_24%,rgba(255,246,235,0.76)_40%,rgba(255,246,235,0.36)_56%,rgba(255,246,235,0.08)_70%,rgba(255,246,235,0)_82%)]" />

            <div className="relative z-10 flex min-h-[620px] items-center px-6 py-16 sm:px-8 sm:py-18 lg:px-[80px] lg:py-[64px]">
              <div className="w-full max-w-[620px] lg:w-[46%] lg:max-w-[800px] lg:pl-8">
                <div aria-hidden="true" className="h-[24px]" />
                <h2 className="mt-3 max-w-[800px] text-[clamp(38px,2.8vw,46px)] font-black leading-[1.08] tracking-[-0.03em] text-[#111827]">
                  <span className="block">
                    <em className="not-italic text-[#ff6a1a]">Dedicated</em> tools,
                  </span>
                  <span className="block">not one-size-fits-all templates</span>
                </h2>
                <div className="mt-6 h-1 w-11 rounded-full bg-[#ff6a1a]" />

                <div className="mt-8 space-y-8">
                  {[
                    {
                      title: "Same type, different needs",
                      text: "The same type of tool can look very different depending on your scenario, standards, workflow, and goals.",
                      icon: "sliders" as const,
                      accent: "#ff6a1a",
                    },
                    {
                      title: "Built around your way",
                      text: "BlackDog Brain learns the way you work, make decisions, communicate, and think. The tool becomes more and more suitable for you.",
                      icon: "user" as const,
                      accent: "#7c5cff",
                    },
                    {
                      title: "Yours to keep and grow",
                      text: "This is not a product you adapt to. This is a tool that grows around your needs, your scenario, and your habits.",
                      icon: "cube" as const,
                      accent: "#ff6a1a",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[rgba(255,255,255,0.82)] text-[color:var(--accent)] shadow-[0_12px_30px_rgba(18,24,38,0.08)]"
                        style={{ ["--accent" as never]: item.accent }}
                      >
                        <ToolStoryIcon variant={item.icon} className="h-8 w-8" />
                      </div>
                      <div className="max-w-[560px]">
                        <div className="text-[16px] font-extrabold leading-6 text-[#111827]">{item.title}</div>
                        <p className="mt-1 max-w-[560px] text-[15px] leading-[1.55] text-[#667085]">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="work-life" className="scroll-mt-28 mt-8">
          <div className="relative left-1/2 w-[min(1520px,calc(100vw-64px))] -translate-x-1/2">
            <div className="flex flex-col gap-6">
              <article
                className="relative overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.72)] bg-[#f7f1ff] shadow-[0_24px_80px_rgba(18,24,38,0.08)]"
            >
                <Image
                  src="/images/BlackdogBrain_04_work.png"
                  alt=""
                  width={1774}
                  height={887}
                  sizes="100vw"
                  className="block h-auto w-full"
                />
              <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(250,248,255,0.98)_0%,rgba(250,248,255,0.92)_28%,rgba(250,248,255,0.56)_42%,rgba(250,248,255,0.12)_58%,rgba(250,248,255,0)_74%)]" />
                <div className="absolute left-0 top-0 z-[2] h-full w-full px-6 py-10 text-left sm:px-8 sm:py-12 lg:w-[42%] lg:max-w-[540px] lg:px-[72px] lg:pt-[60px]">
                  <h3 className="max-w-[540px] text-[clamp(42px,3.5vw,58px)] font-black leading-[1.02] tracking-[-0.045em] text-[#101828]">
                    A Tool for <span className="text-[#7c5cff]">Work</span>
                  </h3>
                  <div className="mt-5 h-[5px] w-[46px] rounded-full bg-[#7c5cff]" />
                  <p className="mt-6 max-w-[440px] text-[15.5px] leading-[1.56] text-[#374151]">
                    BlackDog Brain turns real work needs into dedicated AI tools. For example, model evaluation can become a focused workspace for tracking performance, comparing results, and making better decisions.
                  </p>

                  <div className="mt-7 space-y-4">
                    {[
                      {
                        title: "Track performance in real time",
                        text: "See key metrics, pass rates, and trends update as your model runs.",
                      },
                      {
                        title: "Understand what matters",
                        text: "Drill into evaluations, compare results, and spot issues faster.",
                      },
                      {
                        title: "Make decisions with confidence",
                        text: "Clear insights help you ship better models and improve continuously.",
                      },
                    ].map((item) => (
                    <div key={item.title} className="grid grid-cols-[50px_minmax(0,1fr)] gap-4">
                        <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[16px] bg-[rgba(124,92,255,0.12)] text-[#7c5cff]">
                          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
                            <path d="M4 19.5h16" />
                            <path d="M6.5 16V9.5M11 16V6.5M15.5 16V12" />
                          </svg>
                        </div>
                        <div className="max-w-[420px]">
                          <div className="mb-1 text-[15px] font-extrabold leading-[1.25] text-[#111827]">{item.title}</div>
                          <p className="text-[14px] leading-[1.42] text-[#667085]">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <article
                className="relative overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.72)] bg-[#fff4ea] shadow-[0_24px_80px_rgba(18,24,38,0.08)]"
            >
                <Image
                  src="/images/BlackdogBrain_04_life.png"
                  alt=""
                  width={1774}
                  height={887}
                  sizes="100vw"
                  className="block h-auto w-full"
                />
              <div className="absolute inset-0 z-[1] bg-[linear-gradient(270deg,rgba(255,248,241,0.98)_0%,rgba(255,248,241,0.92)_28%,rgba(255,248,241,0.56)_42%,rgba(255,248,241,0.12)_58%,rgba(255,248,241,0)_74%)]" />
                <div className="absolute right-0 top-[92px] z-[2] h-full w-full px-6 py-10 text-left sm:px-8 sm:py-12 lg:w-[42%] lg:max-w-[520px] lg:px-[72px] lg:pt-0">
                  <h3 className="max-w-[520px] text-[clamp(42px,3.5vw,58px)] font-black leading-[1.02] tracking-[-0.045em] text-[#101828]">
                    A Tool for <span className="text-[#ff6a1a]">Life</span>
                  </h3>
                  <div className="mt-5 h-[5px] w-[46px] rounded-full bg-[#ff6a1a]" />
                  <p className="mt-6 max-w-[440px] text-[15.5px] leading-[1.56] text-[#374151]">
                    BlackDog Brain can also turn daily personal needs into dedicated AI tools. For example, styling can become a personal assistant that understands your wardrobe, occasion, taste, and comfort.
                  </p>

                  <div className="mt-7 space-y-4">
                    {[
                      {
                        title: "Smart outfit suggestions",
                        text: "AI understands your style and suggests looks you&apos;ll love.",
                      },
                      {
                        title: "Make the most of your wardrobe",
                        text: "See outfits from what you already own and plan with ease.",
                      },
                      {
                        title: "Dress for every moment",
                        text: "From daily looks to special plans, we&apos;ve got you covered.",
                      },
                    ].map((item) => (
                    <div key={item.title} className="grid grid-cols-[50px_minmax(0,1fr)] gap-4">
                        <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[16px] bg-[rgba(255,106,26,0.12)] text-[#ff6a1a]">
                          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
                            <path d="M7.5 7.5h9v9h-9v-9Z" />
                            <path d="M4.5 12h3M16.5 12h3M12 4.5v3M12 16.5v3" />
                          </svg>
                        </div>
                        <div className="max-w-[420px]">
                          <div className="mb-1 text-[15px] font-extrabold leading-[1.25] text-[#111827]">{item.title}</div>
                          <p className="text-[14px] leading-[1.42] text-[#667085]">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="scroll-mt-28 mt-10">
          <div className="relative left-1/2 w-[min(1520px,calc(100vw-64px))] -translate-x-1/2">
            <div className="processCard relative overflow-hidden rounded-[36px] border border-[rgba(255,255,255,0.72)] bg-[#fff3e8] shadow-[0_24px_80px_rgba(18,24,38,0.08)]">
              <div
                className="absolute inset-[-10px] z-0 bg-no-repeat"
                style={{
                  backgroundImage: "url('/images/BlackdogBrain_05.png')",
                  backgroundPosition: "center center",
                  backgroundSize: "cover",
                }}
                aria-hidden="true"
              />
              <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,243,232,0.96)_0%,rgba(255,243,232,0.90)_28%,rgba(255,247,241,0.64)_46%,rgba(255,247,241,0.20)_66%,rgba(255,247,241,0.06)_82%)]" />

              <div className="relative z-[2] px-6 py-16 sm:px-8 sm:py-18 lg:min-h-[640px] lg:px-[72px] lg:py-[72px]">
                <div className="max-w-[820px]">
                  <div aria-hidden="true" className="h-[18px]" />
                  <h2 className="mt-4 max-w-[820px] text-[clamp(42px,3.4vw,60px)] font-black leading-[1.06] tracking-[-0.05em] text-[#111827]">
                    <span className="block">How BlackDog Brain</span>
                    <span className="block">
                      builds your <span className="bg-[linear-gradient(90deg,#ff6a1a_0%,#c94f13_42%,#111827_100%)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">dedicated tool</span>
                    </span>
                  </h2>
                  <p className="mt-5 max-w-[620px] text-[18px] leading-[1.55] text-[#667085]">
                    From real need to real results — a clear process<br />
                    that creates tools built around you.
                  </p>
                </div>

                <div className="mt-12 grid gap-6 lg:grid-cols-4">
                  {[
                    {
                      n: "1",
                      title: "Understand your real need",
                      text: "We look at your scenario, repeated problems, key steps, decisions, and the result you want to achieve.",
                    },
                    {
                      n: "2",
                      title: "Understand how you work",
                      text: "We learn your habits, priorities, communication style, and the way you think and decide. This becomes your profile inside BlackDog Brain.",
                    },
                    {
                      n: "3",
                      title: "Design a clear process",
                      text: "We design the workflow, inputs, logic, outputs, and experience that fit your need and your way.",
                    },
                    {
                      n: "4",
                      title: "Build a tool you can use",
                      text: "We turn it into a tool you can open, operate, and use. It becomes more accurate, more useful, and more yours over time.",
                    },
                  ].map((step) => (
                    <div key={step.n} className="relative rounded-[28px] border border-[rgba(255,255,255,0.74)] bg-[rgba(255,255,255,0.66)] p-6 pt-10 shadow-[0_18px_54px_rgba(18,24,38,0.07)] backdrop-blur-[12px]">
                      <div
                        className={`absolute -top-[18px] left-6 flex h-11 w-11 items-center justify-center rounded-full text-[18px] font-black text-white shadow-[0_14px_34px_rgba(124,92,255,0.24)] ${
                          step.n === "4"
                            ? "bg-[linear-gradient(135deg,#ff8a3d_0%,#ff6a1a_100%)] shadow-[0_14px_34px_rgba(255,106,26,0.22)]"
                            : "bg-[linear-gradient(135deg,#8b5cf6_0%,#6d5dfc_100%)]"
                        }`}
                      >
                        {step.n}
                      </div>
                      <div className={`mx-auto mt-7 flex h-[76px] w-[76px] items-center justify-center rounded-full ${step.n === "4" ? "bg-[rgba(255,106,26,0.12)] text-[#ff6a1a]" : "bg-[rgba(124,92,255,0.11)] text-[#7c5cff]"}`}>
                        <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
                          {step.n === "1" ? (
                            <path d="M4 19.5h16M6.5 16V9.5M11 16V6.5M15.5 16V12" />
                          ) : step.n === "2" ? (
                            <>
                              <circle cx="12" cy="8" r="3.5" />
                              <path d="M5.5 20c1.3-3 3.8-4.8 6.5-4.8s5.2 1.8 6.5 4.8" />
                            </>
                          ) : step.n === "3" ? (
                            <>
                              <path d="M4 6h16" />
                              <path d="M4 12h10" />
                              <path d="M4 18h13" />
                              <circle cx="15" cy="6" r="1.8" fill="currentColor" stroke="none" />
                              <circle cx="9" cy="12" r="1.8" fill="currentColor" stroke="none" />
                              <circle cx="12" cy="18" r="1.8" fill="currentColor" stroke="none" />
                            </>
                          ) : (
                            <>
                              <path d="M7.5 7.5 12 5l4.5 2.5v5L12 15l-4.5-2.5v-5Z" />
                              <path d="M12 15v4" />
                              <path d="M7.5 7.5 12 10l4.5-2.5" />
                            </>
                          )}
                        </svg>
                      </div>
                      <div className="mt-6 text-center">
                        <div className="text-[21px] font-black leading-[1.18] tracking-[-0.025em] text-[#111827]">{step.title}</div>
                        <p className="mt-4 text-[15px] leading-[1.55] text-[#667085]">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about-us" className="scroll-mt-28">
          <div className="relative left-1/2 w-[min(1520px,calc(100vw-64px))] -translate-x-1/2">
            <div className="believeCard relative overflow-hidden rounded-[36px] border border-[rgba(255,255,255,0.72)] bg-[#fff3e8] shadow-[0_24px_80px_rgba(18,24,38,0.08)]">
              <div
                className="absolute inset-[-6px] z-0 bg-no-repeat"
                style={{
                  backgroundImage: "url('/images/BlackdogBrain_06.png')",
                  backgroundPosition: "center 48%",
                  backgroundSize: "cover",
                  opacity: 1,
                  filter: "none",
                }}
                aria-hidden="true"
              />
              <div className="relative z-[2] px-6 py-16 sm:px-8 sm:py-18 lg:min-h-[640px] lg:px-[72px] lg:py-[78px] lg:pb-[86px]">
                <div className="believeCopy relative max-w-[600px] translate-y-[60px]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-6 -top-6 -z-10 h-[calc(100%+3rem)] w-[calc(100%+2.5rem)] rounded-[28px] bg-[linear-gradient(90deg,rgba(255,250,245,0.72)_0%,rgba(255,250,245,0.38)_62%,rgba(255,250,245,0)_100%)]"
                  />
                  <h2 className="mb-[36px] text-[clamp(40px,3.2vw,56px)] font-black leading-[1.04] tracking-[-0.045em] text-[#111827]">What we believe</h2>
                  <ul className="believeList grid max-w-[620px] gap-[20px] p-0 list-none">
                    {[
                      <>Every need deserves its own dedicated AI tool.</>,
                      <>A model evaluation task deserves its own evaluation tool.</>,
                      <>An important conversation deserves its own analysis tool.</>,
                      <>
                        Your styling, communication, learning, and long-term goals
                        <br />
                        also deserve tools that truly fit you.
                      </>,
                    ].map((item, index) => (
                      <li key={index} className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-[14px] text-[17px] leading-[1.62] text-[#344054]">
                        <span className="mt-[7px] flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[#ff6a1a] text-[#ff6a1a]">
                          <span className="block h-1.5 w-1.5 rounded-full bg-[#ff6a1a]" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="believeSummary mt-9 max-w-[560px] text-[18px] font-extrabold leading-[1.45] text-[#111827]">
                    BlackDog Brain turns real needs into dedicated tools<br />
                    you can keep using.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

    </div>
  );
}
