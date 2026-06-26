"use client";

import Image from "next/image";
import { useState } from "react";
import { VideoModal } from "@/components/common/VideoModal";
import { ResponsiveArtboard } from "./ResponsiveArtboard";

const brainIntroVideoSrc = process.env.NEXT_PUBLIC_BLACKDOG_BRAIN_INTRO_VIDEO_URL || "";
const brainVideoFrameClass =
  "brain-overview-video-frame relative left-1/2 w-[calc(100vw-48px)] max-w-none -translate-x-1/2 max-[900px]:w-[calc(100vw-24px)]";
const brainVideoBaseWidth = 1600;
const brainVideoBaseHeight = 823;

export function VideoStorySection() {
  const [videoOpen, setVideoOpen] = useState(false);

  const openVideo = () => {
    if (brainIntroVideoSrc) setVideoOpen(true);
  };
  const closeVideo = () => setVideoOpen(false);

  return (
    <>
      <section id="video-story" className="scroll-mt-28">
        <div className={brainVideoFrameClass}>
        <ResponsiveArtboard baseWidth={brainVideoBaseWidth} baseHeight={brainVideoBaseHeight} className="brain-overview-video-artboard">
          <div
            className="relative h-full w-full overflow-hidden rounded-[36px] border border-[rgba(255,255,255,0.72)] bg-[#fff1e6] shadow-[0_24px_80px_rgba(18,24,38,0.08)]"
          >
            <div
              className="absolute inset-[-8px] z-0 bg-no-repeat"
              style={{
                backgroundImage: "url('/images/BlackdogBrain_video_Background.png')",
                backgroundPosition: "top center",
                backgroundSize: "cover",
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,248,241,0.80)_0%,rgba(255,248,241,0.58)_42%,rgba(255,248,241,0.26)_68%,rgba(255,248,241,0.12)_100%)]" />

            <div className="relative z-[2] grid gap-10 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] lg:items-center lg:gap-10 lg:px-12 lg:py-12">
                <button
                  type="button"
                  onClick={openVideo}
                  disabled={!brainIntroVideoSrc}
                  className="group relative block w-full overflow-hidden rounded-[30px] border border-[rgba(255,255,255,0.18)] bg-[#251f4a] text-left shadow-[0_26px_76px_rgba(18,24,38,0.20)]"
                  aria-label="Watch the 1 min story"
                >
                  <div className="relative aspect-[16/7] min-h-[340px] w-full">
                    <Image
                      src="/images/BlackdogBrain_video_cover.png"
                      alt="BlackDog Brain in 60 seconds"
                      fill
                      priority
                      unoptimized
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
        </ResponsiveArtboard>
        </div>
      </section>

      <VideoModal
        src={brainIntroVideoSrc}
        isOpen={videoOpen}
        onClose={closeVideo}
        title="BlackDog Brain intro video"
      />
    </>
  );
}
