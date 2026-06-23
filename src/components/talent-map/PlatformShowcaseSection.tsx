"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { BlackDogLogo } from "@/components/brand/BlackDogLogo";
import styles from "./PlatformShowcaseSection.module.css";

type IconName =
  | "bell"
  | "bulb"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "clipboard"
  | "copy"
  | "external"
  | "fullscreen"
  | "logout"
  | "pause"
  | "play"
  | "settings"
  | "volume";

type ScoreKey = "accuracy" | "relevance" | "fluency" | "completeness";
type SlideIndex = 0 | 1 | 2 | 3;

type PlatformStat = {
  label: string;
  value: string;
  progress?: boolean;
  progressPercent?: number;
};

type PlatformShellProps = {
  ariaLabel: string;
  breadcrumbLabel: string;
  taskId: string;
  stats: PlatformStat[];
  taskInformation: ReadonlyArray<readonly [string, string]>;
  guidelinesLabel: string;
  tips: readonly string[];
  onSkipTask: () => void;
  children: ReactNode;
};

const carouselSlides = [
  "Caption Evaluation",
  "GSB Evaluation",
  "COT Evaluation",
  "More Evaluation Workflows",
] as const;

const storyVideoSrc = process.env.NEXT_PUBLIC_BLACKDOG_BRAIN_STORY_VIDEO_URL || "";

const slideTitles: Record<SlideIndex, { title: string; subtitle: string }> = {
  0: {
    title: "Caption Evaluation",
    subtitle: "Evaluate video captions for accuracy, relevance, and fluency.",
  },
  1: {
    title: "GSB Evaluation",
    subtitle: "Compare two model responses and select the better one.",
  },
  2: {
    title: "COT Evaluation",
    subtitle: "Evaluate localized translation reasoning from video segments.",
  },
  3: {
    title: "More Evaluation Workflows",
    subtitle: "Preview additional evaluation workflows for multimodal AI projects.",
  },
};

const qualityOptions = [
  { value: "1", label: "Poor" },
  { value: "2", label: "Fair" },
  { value: "3", label: "Good" },
  { value: "4", label: "Very Good" },
  { value: "5", label: "Excellent" },
] as const;

const scoreRows = [
  {
    key: "accuracy",
    label: "Accuracy",
    description: "The caption correctly describes the main content.",
  },
  {
    key: "relevance",
    label: "Relevance",
    description: "The caption is relevant to the video.",
  },
  {
    key: "fluency",
    label: "Fluency",
    description: "The caption is well-written and natural.",
  },
  {
    key: "completeness",
    label: "Completeness",
    description: "The caption covers important details without being redundant.",
  },
] as const satisfies ReadonlyArray<{
  key: ScoreKey;
  label: string;
  description: string;
}>;

const captionTaskInformation = [
  ["Task ID", "CAP-240518-001"],
  ["Project", "Caption Evaluation v2"],
  ["Created", "May 18, 2024 14:30"],
  ["Due Date", "May 25, 2024 23:59"],
] as const;

const captionTips = [
  "Focus on the content that is visually describable.",
  "Do not include assumptions or things that are not in the video.",
  "Ensure the caption is concise and natural.",
] as const;

const gsbTaskInformation = [
  ["Task ID", "GSB-240518-002"],
  ["Project", "GSB Evaluation v2"],
  ["Created", "May 18, 2024 14:30"],
  ["Due Date", "May 25, 2024 23:59"],
] as const;

const gsbTips = [
  "Compare the two responses as a whole.",
  "Focus on helpfulness, accuracy, relevance, clarity, and depth.",
  "Do not favor longer responses if they are not better overall.",
  "Ensure your choice is based on the overall quality, not just style.",
] as const;

const gsbPrompt =
  "The Amazon rainforest is home to incredible biodiversity, not just plants and animals, but also complex ecosystems that play a vital role in our planet's health.";

const gsbResponses = [
  {
    key: "a",
    title: "Response A",
    body: "The Amazon rainforest is one of the most biodiverse regions on Earth. It contains millions of species of plants, animals, insects, and microorganisms. These species are part of complex ecosystems that help regulate the climate, produce oxygen, and support life on Earth.",
  },
  {
    key: "b",
    title: "Response B",
    body: "The Amazon rainforest hosts an extraordinary variety of life, including not only diverse plants and animals but also intricate ecosystems. These ecosystems are essential for maintaining the Earth's climate balance, generating oxygen, and supporting the survival of countless species.",
  },
] as const;

const gsbChoiceOptions = [
  { key: "a", icon: "A", label: "A is better" },
  { key: "b", icon: "B", label: "B is better" },
  { key: "similar", icon: "=", label: "Both are similar" },
  { key: "unsure", icon: "?", label: "Cannot decide" },
] as const;

const cotTaskInformation = [
  ["Task ID", "COT-240518-003"],
  ["Project", "COT Evaluation v2"],
  ["Created", "May 18, 2024 14:30"],
  ["Due Date", "May 25, 2024 23:59"],
] as const;

const cotTips = [
  "Identify the minimal complete semantic units for segmentation.",
  "Ensure the translation is accurate and naturally localized.",
  "Explain cultural, tonal, or semantic choices clearly.",
  "Avoid overly literal translation when local expression is needed.",
  "Evaluate both the final translation and the reasoning process.",
] as const;

const cotSegments = [
  {
    time: "00:00 - 00:03",
    seek: 0,
    segment: "A scenic view of a lake surrounded by mountains.",
    source: "The lake is surrounded by quiet mountain scenery.",
    translation: "A peaceful mountain lake opens the scene.",
    reasoning:
      '"Peaceful mountain lake" keeps the visual meaning while sounding natural for travel-style narration.',
  },
  {
    time: "00:04 - 00:07",
    seek: 4,
    segment: "A small village with houses and a church by the lake.",
    source: "A small village sits along the lakeside.",
    translation: "A lakeside village appears calm and welcoming.",
    reasoning:
      '"Calm and welcoming" localizes the tone instead of translating the village description literally.',
  },
  {
    time: "00:08 - 00:11",
    seek: 8,
    segment: "Boats are docked along the shore.",
    source: "Several boats are docked near the shore.",
    translation: "Small boats rest along the quiet shore.",
    reasoning:
      '"Rest along the quiet shore" preserves the visual state and creates a smoother English expression.',
  },
  {
    time: "00:12 - 00:15",
    seek: 12,
    segment: "Clouds move slowly over the mountains.",
    source: "Clouds move slowly above the mountains.",
    translation: "Clouds drift gently over the mountain peaks.",
    reasoning: '"Drift gently" reflects the slow movement and matches the calm mood of the video.',
  },
] as const;

const languages = ["English", "Spanish", "Japanese"] as const;
const captionMaxLength = 1200;
const commentsMaxLength = 500;
const initialCaption =
  "The video introduces BlackDog Brain as an intelligent evaluation and workflow platform through a polished animated product story. A friendly BlackDog mascot appears in a modern digital workspace surrounded by interface panels, charts, task cards, and AI workflow symbols. The scene highlights how the platform can organize project requirements, support data and model evaluation work, surface progress metrics, and guide users through structured review tasks. The visual style is clean and technology focused, with warm lighting, soft motion, and product UI elements that suggest reliability, automation, and professional collaboration. Overall, the video presents BlackDog Brain as a practical AI operations assistant for teams that need to manage evaluation workflows, track quality, and turn complex project needs into clear platform actions.";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function Icon({ name }: { name: IconName }) {
  const strokeProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === "bell" && (
        <>
          <path {...strokeProps} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
          <path {...strokeProps} d="M13.73 21a2 2 0 0 1-3.46 0" />
        </>
      )}
      {name === "bulb" && (
        <>
          <path {...strokeProps} d="M9 18h6" />
          <path {...strokeProps} d="M10 22h4" />
          <path {...strokeProps} d="M8.5 14.5A6 6 0 1 1 15.5 14c-.9.7-1.5 1.7-1.5 3h-4c0-1.2-.5-1.9-1.5-2.5z" />
        </>
      )}
      {name === "chevronDown" && <path {...strokeProps} d="m6 9 6 6 6-6" />}
      {name === "chevronLeft" && <path {...strokeProps} d="m15 18-6-6 6-6" />}
      {name === "chevronRight" && <path {...strokeProps} d="m9 18 6-6-6-6" />}
      {name === "clipboard" && (
        <>
          <rect {...strokeProps} x="8" y="3" width="8" height="4" rx="1" />
          <path {...strokeProps} d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <path {...strokeProps} d="M9 13h6" />
          <path {...strokeProps} d="M9 17h4" />
        </>
      )}
      {name === "copy" && (
        <>
          <rect {...strokeProps} x="9" y="9" width="10" height="10" rx="2" />
          <path {...strokeProps} d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
        </>
      )}
      {name === "external" && (
        <>
          <path {...strokeProps} d="M14 3h7v7" />
          <path {...strokeProps} d="M10 14 21 3" />
          <path {...strokeProps} d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
        </>
      )}
      {name === "fullscreen" && (
        <>
          <path {...strokeProps} d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path {...strokeProps} d="M16 3h3a2 2 0 0 1 2 2v3" />
          <path {...strokeProps} d="M8 21H5a2 2 0 0 1-2-2v-3" />
          <path {...strokeProps} d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </>
      )}
      {name === "logout" && (
        <>
          <path {...strokeProps} d="M10 17 15 12l-5-5" />
          <path {...strokeProps} d="M15 12H3" />
          <path {...strokeProps} d="M21 4v16" />
        </>
      )}
      {name === "pause" && (
        <>
          <rect x="7" y="5" width="4" height="14" rx="1" fill="currentColor" />
          <rect x="13" y="5" width="4" height="14" rx="1" fill="currentColor" />
        </>
      )}
      {name === "play" && <path d="M8 5v14l11-7z" fill="currentColor" />}
      {name === "settings" && (
        <>
          <path
            {...strokeProps}
            d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5z"
          />
          <path
            {...strokeProps}
            d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.1 4.65a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"
          />
        </>
      )}
      {name === "volume" && (
        <>
          <path {...strokeProps} d="M11 5 6 9H2v6h4l5 4z" />
          <path {...strokeProps} d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path {...strokeProps} d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}

function BlackDogIpLogo({ placement }: { placement: "section" | "product" }) {
  return <BlackDogLogo size={placement === "section" ? "md" : "sm"} tone="default" />;
}

function StatusItem({
  label,
  value,
  progress,
  progressPercent = 0,
}: {
  label: string;
  value: string;
  progress?: boolean;
  progressPercent?: number;
}) {
  return (
    <div className={styles.statusItem}>
      <span className={styles.statusLabel}>{label}</span>
      <strong>{value}</strong>
      {progress ? (
        <span className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressValue} style={{ width: `${progressPercent}%` }} />
        </span>
      ) : null}
    </div>
  );
}

function RatingButton({
  value,
  label,
  selected,
  onSelect,
  ariaLabel,
}: {
  value: string;
  label?: string;
  selected?: boolean;
  onSelect?: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      className={`${styles.ratingButton} ${selected ? styles.ratingButtonSelected : ""}`}
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
    >
      <span>{value}</span>
      {label ? <span>{label}</span> : null}
    </button>
  );
}

function ScoreRow({
  label,
  description,
  selected,
  onSelect,
}: {
  label: string;
  description: string;
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className={styles.scoreRow}>
      <div className={styles.scoreText}>
        <h4>{label}</h4>
        <p>{description}</p>
      </div>
      <div className={styles.compactRatings} aria-label={`${label} score`}>
        {["1", "2", "3", "4", "5"].map((value) => (
          <RatingButton
            key={value}
            value={value}
            selected={value === selected}
            ariaLabel={`Set ${label} to ${value}`}
            onSelect={() => onSelect(value)}
          />
        ))}
      </div>
    </div>
  );
}

function VideoFallbackScene() {
  return (
    <div className={styles.videoScene} aria-hidden="true">
      <span className={styles.sunsetGlow} />
      <span className={styles.skyline} />
      <span className={styles.waterline} />
      <span className={styles.walkway} />
    </div>
  );
}

function PlatformShell({
  ariaLabel,
  breadcrumbLabel,
  taskId,
  stats,
  taskInformation,
  guidelinesLabel,
  tips,
  onSkipTask,
  children,
}: PlatformShellProps) {
  const [languageIndex, setLanguageIndex] = useState(0);
  const [notifications, setNotifications] = useState(2);
  const [copied, setCopied] = useState(false);

  async function copyTaskId() {
    setCopied(true);

    try {
      await navigator.clipboard?.writeText(taskId);
    } catch {
      // Demo feedback still changes even if clipboard access is unavailable.
    }
  }

  return (
    <article className={styles.mockupCard} aria-label={ariaLabel}>
      <header className={styles.productBar}>
        <div className={styles.brandSlot}>
          <BlackDogIpLogo placement="product" />
        </div>

        <nav className={styles.breadcrumb} aria-label="Platform breadcrumb">
          <span>Projects</span>
          <Icon name="chevronRight" />
          <span>{breadcrumbLabel}</span>
          <Icon name="chevronRight" />
          <strong>Task {taskId}</strong>
          <button
            className={styles.copyButton}
            type="button"
            aria-label={copied ? "Task ID copied" : "Copy task ID"}
            onClick={copyTaskId}
          >
            <Icon name="copy" />
          </button>
          {copied ? <span className={styles.microStatus}>Copied</span> : null}
        </nav>

        <div className={styles.topActions}>
          <button
            className={styles.languageButton}
            type="button"
            onClick={() => setLanguageIndex((current) => (current + 1) % languages.length)}
          >
            {languages[languageIndex]}
            <Icon name="chevronDown" />
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Notifications"
            onClick={() => setNotifications(0)}
          >
            <Icon name="bell" />
            {notifications > 0 ? (
              <span className={styles.notificationBadge}>{notifications}</span>
            ) : null}
          </button>
          <button className={styles.iconButton} type="button" aria-label="Account">
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <div className={styles.statusBar}>
        {stats.map((item) => (
          <StatusItem key={item.label} {...item} />
        ))}
        <button className={styles.skipTaskTop} type="button" onClick={onSkipTask}>
          Skip Task
          <Icon name="chevronRight" />
        </button>
      </div>

      <div className={styles.bodyGrid}>
        {children}

        <aside className={styles.sideRail} aria-label="Task support information">
          <section className={styles.sidePanel}>
            <h3>Task Information</h3>
            <dl className={styles.infoList}>
              {taskInformation.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={styles.sidePanel}>
            <h3>
              <Icon name="clipboard" />
              Guidelines
            </h3>
            <a href="#platform-showcase" aria-label={guidelinesLabel}>
              {guidelinesLabel}
              <Icon name="external" />
            </a>
          </section>

          <section className={styles.sidePanel}>
            <h3>
              <Icon name="bulb" />
              Tips
            </h3>
            <ul className={styles.tipsList}>
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </article>
  );
}

function CaptionEvaluationSlide() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progressCount, setProgressCount] = useState(12);
  const [completed, setCompleted] = useState(12);
  const [skipped, setSkipped] = useState(1);
  const [overallQuality, setOverallQuality] = useState("4");
  const [scores, setScores] = useState<Record<ScoreKey, string>>({
    accuracy: "4",
    relevance: "4",
    fluency: "4",
    completeness: "4",
  });
  const [caption, setCaption] = useState(initialCaption);
  const [comments, setComments] = useState("");
  const [draftState, setDraftState] = useState("Draft not saved");
  const totalTasks = 25;
  const progressPercent = Math.min(100, (progressCount / totalTasks) * 100);

  async function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    video.pause();
  }

  function seekVideo(event: MouseEvent<HTMLButtonElement>) {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
    setCurrentTime(video.currentTime);
  }

  function toggleMute() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  }

  function cyclePlaybackRate() {
    const rates = [1, 1.25, 1.5, 0.75] as const;
    const nextRate = rates[(rates.indexOf(playbackRate as (typeof rates)[number]) + 1) % rates.length];
    setPlaybackRate(nextRate);

    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  }

  async function toggleFullscreen() {
    if (!playerRef.current || !document.fullscreenEnabled) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await playerRef.current.requestFullscreen();
  }

  function handleSkipTask() {
    setSkipped((current) => Math.min(totalTasks, current + 1));
    setProgressCount((current) => Math.min(totalTasks, current + 1));
    setDraftState("Task skipped in demo");
  }

  function handleSaveDraft() {
    setCompleted((current) => Math.min(totalTasks, Math.max(current, progressCount)));
    setDraftState("Draft saved locally");
  }

  const statusItems = [
    { label: "Progress", value: `${progressCount} / ${totalTasks}`, progress: true, progressPercent },
    { label: "Time Left", value: "2d 14h 30m" },
    { label: "Total Tasks", value: String(totalTasks) },
    { label: "Completed", value: String(completed) },
    { label: "Skipped", value: String(skipped) },
  ] as const;

  return (
    <PlatformShell
      ariaLabel="Caption Evaluation platform preview"
      breadcrumbLabel="Caption Evaluation v2"
      taskId="CAP-240518-001"
      stats={[...statusItems]}
      taskInformation={captionTaskInformation}
      guidelinesLabel="View Caption Evaluation Guidelines"
      tips={captionTips}
      onSkipTask={handleSkipTask}
    >
        <div className={styles.mainWorkspace}>
          <section className={styles.videoColumn} aria-labelledby="caption-video-title">
            <h3 id="caption-video-title">Video</h3>

            <div className={styles.videoPlayer}>
              <div ref={playerRef} className={styles.videoFrame}>
              {storyVideoSrc ? (
                <>
                  <video
                    ref={videoRef}
                    className={styles.videoMedia}
                    aria-label="Waterfront skyline video preview"
                    src={storyVideoSrc}
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    onClick={toggleVideo}
                    onLoadedMetadata={(event) => {
                      setDuration(event.currentTarget.duration || 15);
                      event.currentTarget.playbackRate = playbackRate;
                      event.currentTarget.muted = isMuted;
                    }}
                    onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <button
                    className={`${styles.playButton} ${isPlaying ? styles.playButtonPlaying : ""}`}
                    type="button"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                    onClick={toggleVideo}
                  >
                    <Icon name={isPlaying ? "pause" : "play"} />
                  </button>
                  <div className={styles.videoControls}>
                    <button type="button" className={styles.controlButton} onClick={toggleVideo}>
                      <Icon name={isPlaying ? "pause" : "play"} />
                    </button>
                    <button type="button" className={styles.controlButton} onClick={toggleMute}>
                      <Icon name="volume" />
                    </button>
                    <span className={styles.videoTime}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <button
                      className={styles.videoSeek}
                      type="button"
                      aria-label="Seek video"
                      onClick={seekVideo}
                    >
                      <span style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                    </button>
                    <button type="button" className={styles.controlButton} onClick={cyclePlaybackRate}>
                      <Icon name="settings" />
                      <span>{playbackRate}x</span>
                    </button>
                    <button type="button" className={styles.controlButton} onClick={toggleFullscreen}>
                      <Icon name="fullscreen" />
                    </button>
                  </div>
                </>
              ) : (
                <VideoFallbackScene />
              )}
              </div>
            </div>

            <div className={styles.taskBrief}>
              <h4>Task</h4>
              <p>Please watch the video and evaluate the quality of the candidate caption.</p>
            </div>

            <label className={styles.textAreaGroup}>
              <span>Candidate Caption</span>
              <textarea
                value={caption}
                maxLength={captionMaxLength}
                onChange={(event) => setCaption(event.target.value)}
              />
              <span className={styles.counter}>
                {caption.length} / {captionMaxLength}
              </span>
            </label>
          </section>

          <section className={styles.scoringColumn} aria-labelledby="overall-quality-title">
            <div className={styles.qualityBlock}>
              <h3 id="overall-quality-title">Overall Quality</h3>
              <div className={styles.qualityRatings} aria-label="Overall quality score">
                {qualityOptions.map((option) => (
                  <RatingButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selected={option.value === overallQuality}
                    ariaLabel={`Set Overall Quality to ${option.value} ${option.label}`}
                    onSelect={() => setOverallQuality(option.value)}
                  />
                ))}
              </div>
            </div>

            <div className={styles.scoreList}>
              {scoreRows.map((row) => (
                <ScoreRow
                  key={row.label}
                  label={row.label}
                  description={row.description}
                  selected={scores[row.key]}
                  onSelect={(value) =>
                    setScores((current) => ({
                      ...current,
                      [row.key]: value,
                    }))
                  }
                />
              ))}
            </div>

            <label className={styles.commentsGroup}>
              <span>Comments (optional)</span>
              <textarea
                value={comments}
                maxLength={commentsMaxLength}
                placeholder="Share your feedback..."
                onChange={(event) => setComments(event.target.value)}
              />
              <span className={styles.counter}>
                {comments.length} / {commentsMaxLength}
              </span>
            </label>

            <div className={styles.formActions}>
              <span className={styles.draftNotice}>{draftState}</span>
              <button className={styles.secondaryButton} type="button" onClick={handleSkipTask}>
                Skip Task
              </button>
              <button className={styles.primaryButton} type="button" onClick={handleSaveDraft}>
                Save Draft
              </button>
            </div>
          </section>
        </div>
    </PlatformShell>
  );
}

function GsbEvaluationSlide() {
  const [choice, setChoice] = useState("a");
  const [confidence, setConfidence] = useState("4");
  const [comments, setComments] = useState("");
  const [progressCount, setProgressCount] = useState(8);
  const [completed, setCompleted] = useState(8);
  const [skipped, setSkipped] = useState(0);
  const [draftState, setDraftState] = useState("Draft not saved");
  const totalTasks = 20;
  const progressPercent = Math.min(100, (progressCount / totalTasks) * 100);

  function handleSkipTask() {
    setSkipped((current) => Math.min(totalTasks, current + 1));
    setProgressCount((current) => Math.min(totalTasks, current + 1));
    setDraftState("Task skipped in demo");
  }

  function handleSaveDraft() {
    setCompleted((current) => Math.min(totalTasks, Math.max(current, progressCount)));
    setDraftState("Draft saved locally");
  }

  const statusItems: PlatformStat[] = [
    { label: "Progress", value: `${progressCount} / ${totalTasks}`, progress: true, progressPercent },
    { label: "Time Left", value: "2d 16h 45m" },
    { label: "Total Tasks", value: String(totalTasks) },
    { label: "Completed", value: String(completed) },
    { label: "Skipped", value: String(skipped) },
  ];

  return (
    <PlatformShell
      ariaLabel="GSB Evaluation platform preview"
      breadcrumbLabel="GSB Evaluation v2"
      taskId="GSB-240518-002"
      stats={statusItems}
      taskInformation={gsbTaskInformation}
      guidelinesLabel="View GSB Evaluation Guidelines"
      tips={gsbTips}
      onSkipTask={handleSkipTask}
    >
      <div className={styles.gsbWorkspace}>
        <section className={styles.gsbTaskPanel} aria-labelledby="gsb-task-title">
          <div className={styles.gsbPromptBlock}>
            <h3 id="gsb-task-title">Task</h3>
            <p>{gsbPrompt}</p>
            <strong>Which response is better overall?</strong>
          </div>

          <div className={styles.gsbResponseGrid}>
            {gsbResponses.map((response) => (
              <article
                className={`${styles.gsbResponseCard} ${
                  choice === response.key ? styles.gsbResponseCardSelected : ""
                }`}
                key={response.key}
              >
                <h4>{response.title}</h4>
                <p>{response.body}</p>
              </article>
            ))}
            <span className={styles.gsbVsBadge} aria-hidden="true">
              VS
            </span>
          </div>

          <div className={styles.gsbChoiceBlock}>
            <h3>Select the better response</h3>
            <div className={styles.gsbChoiceGrid}>
              {gsbChoiceOptions.map((option) => (
                <button
                  className={`${styles.gsbChoiceButton} ${
                    choice === option.key ? styles.gsbChoiceButtonSelected : ""
                  }`}
                  type="button"
                  aria-pressed={choice === option.key}
                  key={option.key}
                  onClick={() => setChoice(option.key)}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.gsbEvaluationGrid}>
            <div className={styles.gsbConfidenceBlock}>
              <h3>Confidence</h3>
              <div className={styles.gsbConfidenceButtons} aria-label="Confidence score">
                {["1", "2", "3", "4", "5"].map((value) => (
                  <RatingButton
                    key={value}
                    value={value}
                    selected={value === confidence}
                    ariaLabel={`Set confidence to ${value}`}
                    onSelect={() => setConfidence(value)}
                  />
                ))}
              </div>
            </div>

            <label className={`${styles.commentsGroup} ${styles.gsbCommentsGroup}`}>
              <span>Comments (optional)</span>
              <textarea
                value={comments}
                maxLength={commentsMaxLength}
                placeholder="Share your feedback..."
                onChange={(event) => setComments(event.target.value)}
              />
              <span className={styles.counter}>
                {comments.length} / {commentsMaxLength}
              </span>
            </label>
          </div>

          <div className={styles.formActions}>
            <span className={styles.draftNotice}>{draftState}</span>
            <button className={styles.secondaryButton} type="button" onClick={handleSkipTask}>
              Skip Task
            </button>
            <button className={styles.primaryButton} type="button" onClick={handleSaveDraft}>
              Save Draft
            </button>
          </div>
        </section>
      </div>
    </PlatformShell>
  );
}

function CotEvaluationSlide() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeSegment, setActiveSegment] = useState(0);
  const [localizationQuality, setLocalizationQuality] = useState("4");
  const [comments, setComments] = useState("");
  const [progressCount, setProgressCount] = useState(15);
  const [completed, setCompleted] = useState(15);
  const [skipped, setSkipped] = useState(0);
  const [draftState, setDraftState] = useState("Draft not saved");
  const totalTasks = 30;
  const cotDuration = 15;
  const progressPercent = Math.min(100, (progressCount / totalTasks) * 100);

  async function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    video.pause();
  }

  function seekVideo(event: MouseEvent<HTMLButtonElement>) {
    const video = videoRef.current;
    if (!video) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const nextTime = ratio * cotDuration;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function toggleMute() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  }

  function cyclePlaybackRate() {
    const rates = [1, 1.25, 1.5, 0.75] as const;
    const nextRate = rates[(rates.indexOf(playbackRate as (typeof rates)[number]) + 1) % rates.length];
    setPlaybackRate(nextRate);

    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  }

  async function toggleFullscreen() {
    if (!playerRef.current || !document.fullscreenEnabled) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await playerRef.current.requestFullscreen();
  }

  function selectSegment(index: number) {
    const segment = cotSegments[index];
    setActiveSegment(index);
    setCurrentTime(segment.seek);

    if (videoRef.current) {
      videoRef.current.currentTime = segment.seek;
    }
  }

  function handleSkipTask() {
    setSkipped((current) => Math.min(totalTasks, current + 1));
    setProgressCount((current) => Math.min(totalTasks, current + 1));
    setDraftState("Task skipped in demo");
  }

  function handleSaveDraft() {
    setCompleted((current) => Math.min(totalTasks, Math.max(current, progressCount)));
    setDraftState("Draft saved locally");
  }

  const statusItems: PlatformStat[] = [
    { label: "Progress", value: `${progressCount} / ${totalTasks}`, progress: true, progressPercent },
    { label: "Time Left", value: "3d 2h 10m" },
    { label: "Total Tasks", value: String(totalTasks) },
    { label: "Completed", value: String(completed) },
    { label: "Skipped", value: String(skipped) },
  ];

  return (
    <PlatformShell
      ariaLabel="COT Evaluation platform preview"
      breadcrumbLabel="COT Evaluation v2"
      taskId="COT-240518-003"
      stats={statusItems}
      taskInformation={cotTaskInformation}
      guidelinesLabel="View COT Evaluation Guidelines"
      tips={cotTips}
      onSkipTask={handleSkipTask}
    >
      <div className={styles.cotWorkspace}>
        <section className={styles.cotVideoPanel} aria-labelledby="cot-video-title">
          <h3 id="cot-video-title">Video</h3>

          <div className={styles.videoPlayer}>
            <div ref={playerRef} className={styles.videoFrame}>
              {storyVideoSrc ? (
                <>
                  <video
                    ref={videoRef}
                    className={styles.videoMedia}
                    aria-label="Localized travel video preview"
                    src={storyVideoSrc}
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    onClick={toggleVideo}
                    onLoadedMetadata={(event) => {
                      event.currentTarget.playbackRate = playbackRate;
                      event.currentTarget.muted = isMuted;
                    }}
                    onTimeUpdate={(event) => {
                      const nextTime = Math.min(event.currentTarget.currentTime, cotDuration);
                      setCurrentTime(nextTime);

                      if (event.currentTarget.currentTime >= cotDuration) {
                        event.currentTarget.pause();
                        setIsPlaying(false);
                      }
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <button
                    className={`${styles.playButton} ${isPlaying ? styles.playButtonPlaying : ""}`}
                    type="button"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                    onClick={toggleVideo}
                  >
                    <Icon name={isPlaying ? "pause" : "play"} />
                  </button>
                  <div className={styles.videoControls}>
                    <button type="button" className={styles.controlButton} onClick={toggleVideo}>
                      <Icon name={isPlaying ? "pause" : "play"} />
                    </button>
                    <button type="button" className={styles.controlButton} onClick={toggleMute}>
                      <Icon name="volume" />
                    </button>
                    <span className={styles.videoTime}>
                      {formatTime(currentTime)} / {formatTime(cotDuration)}
                    </span>
                    <button
                      className={styles.videoSeek}
                      type="button"
                      aria-label="Seek COT video"
                      onClick={seekVideo}
                    >
                      <span style={{ width: `${(currentTime / cotDuration) * 100}%` }} />
                    </button>
                    <button type="button" className={styles.controlButton} onClick={cyclePlaybackRate}>
                      <Icon name="settings" />
                      <span>{playbackRate}x</span>
                    </button>
                    <button type="button" className={styles.controlButton} onClick={toggleFullscreen}>
                      <Icon name="fullscreen" />
                    </button>
                  </div>
                </>
              ) : (
                <VideoFallbackScene />
              )}
            </div>
          </div>

          <div className={styles.cotSegmentsHeader}>
            <h3>Segments</h3>
            <p>Identify the minimal complete semantic units.</p>
          </div>

          <div className={styles.cotSegmentList} aria-label="Video semantic segments">
            {cotSegments.map((segment, index) => (
              <button
                className={`${styles.cotSegmentItem} ${
                  index === activeSegment ? styles.cotSegmentItemActive : ""
                }`}
                type="button"
                key={segment.time}
                aria-pressed={index === activeSegment}
                onClick={() => selectSegment(index)}
              >
                <span>
                  <strong>{segment.time}</strong>
                  <em>{segment.segment}</em>
                </span>
                <span className={styles.cotSegmentPlay} aria-hidden="true">
                  <Icon name="play" />
                </span>
              </button>
            ))}
          </div>

          <button
            className={styles.cotAddSegmentButton}
            type="button"
            onClick={() => setDraftState("Segment draft ready")}
          >
            Add Segment
          </button>
        </section>

        <section className={styles.cotReviewPanel} aria-labelledby="cot-source-title">
          <div className={styles.cotTextGrid}>
            <article className={styles.cotTextPanel} aria-labelledby="cot-source-title">
              <h3 id="cot-source-title">Source Text (from ASR)</h3>
              <div className={styles.cotTextRows}>
                {cotSegments.map((segment, index) => (
                  <button
                    className={`${styles.cotTextRow} ${
                      index === activeSegment ? styles.cotTextRowActive : ""
                    }`}
                    type="button"
                    key={segment.source}
                    onClick={() => selectSegment(index)}
                  >
                    <span>{segment.time}</span>
                    <p>{segment.source}</p>
                  </button>
                ))}
              </div>
            </article>

            <article className={styles.cotTextPanel}>
              <h3>Localized Translation (Candidate)</h3>
              <div className={styles.cotTextRows}>
                {cotSegments.map((segment, index) => (
                  <button
                    className={`${styles.cotTextRow} ${
                      index === activeSegment ? styles.cotTextRowActive : ""
                    }`}
                    type="button"
                    key={segment.translation}
                    onClick={() => selectSegment(index)}
                  >
                    <span>{segment.time}</span>
                    <p>{segment.translation}</p>
                  </button>
                ))}
              </div>
            </article>

            <article className={styles.cotTextPanel}>
              <div className={styles.cotPanelTitleGroup}>
                <h3>Chain-of-Thought Reasoning</h3>
                <p>Why this localized translation?</p>
              </div>
              <div className={styles.cotTextRows}>
                {cotSegments.map((segment, index) => (
                  <button
                    className={`${styles.cotTextRow} ${
                      index === activeSegment ? styles.cotTextRowActive : ""
                    }`}
                    type="button"
                    key={segment.reasoning}
                    onClick={() => selectSegment(index)}
                  >
                    <span>{segment.time}</span>
                    <p>{segment.reasoning}</p>
                  </button>
                ))}
              </div>
            </article>
          </div>

          <div className={styles.cotScorePanel}>
            <div className={styles.qualityBlock}>
              <h3>Overall Localization Quality</h3>
              <div className={styles.qualityRatings} aria-label="Overall localization quality score">
                {qualityOptions.map((option) => (
                  <RatingButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selected={option.value === localizationQuality}
                    ariaLabel={`Set Overall Localization Quality to ${option.value} ${option.label}`}
                    onSelect={() => setLocalizationQuality(option.value)}
                  />
                ))}
              </div>
            </div>

            <label className={`${styles.commentsGroup} ${styles.cotCommentsGroup}`}>
              <span>Comments (optional)</span>
              <textarea
                value={comments}
                maxLength={commentsMaxLength}
                placeholder="Share your feedback..."
                onChange={(event) => setComments(event.target.value)}
              />
              <span className={styles.counter}>
                {comments.length} / {commentsMaxLength}
              </span>
            </label>

            <div className={styles.formActions}>
              <span className={styles.draftNotice}>{draftState}</span>
              <button className={styles.secondaryButton} type="button" onClick={handleSkipTask}>
                Skip Task
              </button>
              <button className={styles.primaryButton} type="button" onClick={handleSaveDraft}>
                Save Draft
              </button>
            </div>
          </div>
        </section>
      </div>
    </PlatformShell>
  );
}

function MoreWorkflowsSlide() {
  const [languageIndex, setLanguageIndex] = useState(0);
  const [notifications, setNotifications] = useState(2);

  return (
    <article
      className={`${styles.mockupCard} ${styles.moreMockupCard}`}
      aria-label="More Evaluation Workflows platform preview"
    >
      <header className={styles.productBar}>
        <div className={styles.brandSlot}>
          <BlackDogIpLogo placement="product" />
        </div>

        <nav className={styles.breadcrumb} aria-label="Platform breadcrumb">
          <span>Projects</span>
          <Icon name="chevronRight" />
          <span>More Evaluation Workflows</span>
          <Icon name="chevronRight" />
          <strong>Custom Workflow</strong>
        </nav>

        <div className={styles.topActions}>
          <button
            className={styles.languageButton}
            type="button"
            onClick={() => setLanguageIndex((current) => (current + 1) % languages.length)}
          >
            {languages[languageIndex]}
            <Icon name="chevronDown" />
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Notifications"
            onClick={() => setNotifications(0)}
          >
            <Icon name="bell" />
            {notifications > 0 ? (
              <span className={styles.notificationBadge}>{notifications}</span>
            ) : null}
          </button>
          <button className={styles.iconButton} type="button" aria-label="Account">
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <div className={styles.moreContent}>
        <Image
          src="/images/Blackdog_WorkFlow.png"
          alt="Customize any workflow with BlackDog"
          width={1536}
          height={1024}
          sizes="(max-width: 1320px) 72vw, 860px"
          className={styles.workflowImage}
        />
      </div>
    </article>
  );
}

export function PlatformShowcaseSection() {
  const [activeSlide, setActiveSlide] = useState<SlideIndex>(0);

  function moveSlide(direction: -1 | 1) {
    setActiveSlide(
      (current) => ((current + direction + carouselSlides.length) % carouselSlides.length) as SlideIndex,
    );
  }

  const currentTitle = slideTitles[activeSlide];

  return (
    <section
      id="platform-showcase"
      className={styles.section}
      aria-labelledby="platform-showcase-title"
    >
      <div className={styles.sectionBrand}>
        <BlackDogIpLogo placement="section" />
      </div>

      <div className={styles.titleBlock}>
        <p className={styles.eyebrow}>BLACKDOG EVALUATION PLATFORM</p>
        <h2 id="platform-showcase-title">{currentTitle.title}</h2>
        <p>{currentTitle.subtitle}</p>
        <span className={styles.titleRule} aria-hidden="true" />
      </div>

      <div className={styles.carousel} aria-label="Evaluation workflow carousel">
        <button
          className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
          type="button"
          aria-label="Previous evaluation workflow"
          onClick={() => moveSlide(-1)}
        >
          <Icon name="chevronLeft" />
        </button>

        <div className={styles.mockupViewport}>
          <div className={styles.slideFrame} key={activeSlide}>
            {activeSlide === 0 ? <CaptionEvaluationSlide /> : null}
            {activeSlide === 1 ? <GsbEvaluationSlide /> : null}
            {activeSlide === 2 ? <CotEvaluationSlide /> : null}
            {activeSlide === 3 ? <MoreWorkflowsSlide /> : null}
          </div>
        </div>

        <button
          className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
          type="button"
          aria-label="Next evaluation workflow"
          onClick={() => moveSlide(1)}
        >
          <Icon name="chevronRight" />
        </button>
      </div>

      <div className={styles.dots} role="tablist" aria-label="Evaluation workflow slides">
        {carouselSlides.map((slide, index) => (
          <button
            key={slide}
            className={`${styles.dot} ${index === activeSlide ? styles.dotActive : ""}`}
            type="button"
            aria-label={slide}
            aria-selected={index === activeSlide}
            role="tab"
            onClick={() => setActiveSlide(index as SlideIndex)}
          />
        ))}
      </div>
    </section>
  );
}
