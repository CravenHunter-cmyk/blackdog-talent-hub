"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function VideoStorySection() {
  const [videoOpen, setVideoOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const VIDEO_SRC = process.env.NEXT_PUBLIC_BLACKDOG_BRAIN_STORY_VIDEO_URL || "";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (videoOpen) {
      video.currentTime = 0;
      void video.play().catch(() => {});
      return;
    }

    video.pause();
    video.currentTime = 0;
  }, [videoOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setVideoOpen(false);
      }
    };

    if (videoOpen) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }

    return undefined;
  }, [videoOpen]);

  const openVideo = () => {
    if (VIDEO_SRC) setVideoOpen(true);
  };
  const closeVideo = () => setVideoOpen(false);

  return (
    <>
      <section id="video-story" className="scroll-mt-28">
        <div className="relative left-1/2 w-[min(1520px,calc(100vw-64px))] -translate-x-1/2">
          <div
            className="relative overflow-hidden rounded-[36px] border border-[rgba(255,255,255,0.72)] bg-[#fff1e6] shadow-[0_24px_80px_rgba(18,24,38,0.08)]"
          >
            <div
              className="absolute inset-[-8px] z-0 bg-no-repeat"
              style={{
                backgroundImage: "url('/images/BlackdogBrain_video_Background.png')",
                backgroundPosition: "center center",
                backgroundSize: "cover",
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,248,241,0.80)_0%,rgba(255,248,241,0.58)_42%,rgba(255,248,241,0.26)_68%,rgba(255,248,241,0.12)_100%)]" />

            <div className="relative z-[2] grid gap-10 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] lg:items-center lg:gap-10 lg:px-12 lg:py-12">
                <button
                  type="button"
                  onClick={openVideo}
                  className="group relative block w-full overflow-hidden rounded-[30px] border border-[rgba(255,255,255,0.18)] bg-[#251f4a] text-left shadow-[0_26px_76px_rgba(18,24,38,0.20)]"
                  aria-label="Watch the 1 min story"
                >
                  <div className="relative aspect-[16/7] min-h-[340px] w-full">
                    <Image
                      src="/images/BlackdogBrain_video_cover.png"
                      alt="BlackDog Brain in 60 seconds"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 1000px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,24,38,0.04),rgba(18,24,38,0.16))]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.9)] text-[#6d5dfc] shadow-[0_18px_48px_rgba(18,24,38,0.20)] transition-transform duration-200 group-hover:scale-[1.04]">
                        <div className="ml-1 h-0 w-0 border-y-[14px] border-l-[24px] border-y-transparent border-l-current" />
                      </div>
                    </div>
                  </div>
                </button>

                <div className="max-w-[520px] justify-self-start text-left">
                  <h2 className="mt-5 text-[clamp(40px,3.4vw,58px)] font-black leading-[1.04] tracking-[-0.05em] text-[#111827]">
                    <span className="block text-[#111827]">What is</span>
                    <span
                      className="block whitespace-nowrap bg-[linear-gradient(90deg,#ff6a1a_0%,#f97316_22%,#111827_72%,#111827_100%)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
                    >
                      BlackDog Brain?
                    </span>
                  </h2>
                </div>
            </div>
          </div>
        </div>
      </section>

      {videoOpen && VIDEO_SRC ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(10,12,20,0.78)] px-4 py-6 backdrop-blur-[14px] sm:px-6 sm:py-12"
          role="presentation"
          onClick={closeVideo}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="BlackDog Brain story video"
            className="relative w-full max-w-[1280px] overflow-hidden rounded-[24px] bg-black shadow-[0_32px_120px_rgba(0,0,0,0.42)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close video preview"
              onClick={closeVideo}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/88 text-[#111827] shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:bg-white"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              controls
              playsInline
              preload="metadata"
              className="block w-full bg-black"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
