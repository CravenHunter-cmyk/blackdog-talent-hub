"use client";

import { useCallback, useEffect, useRef } from "react";

type VideoModalProps = {
  src: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};

export function VideoModal({ src, isOpen, onClose, title = "Video preview" }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
  }, []);

  const handleClose = useCallback(() => {
    stopVideo();
    onClose();
  }, [onClose, stopVideo]);

  useEffect(() => {
    if (!isOpen) stopVideo();
  }, [isOpen, stopVideo]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, isOpen]);

  useEffect(() => {
    return () => stopVideo();
  }, [stopVideo]);

  if (!isOpen || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(10,12,20,0.78)] px-4 py-6 backdrop-blur-[14px] sm:px-6 sm:py-12"
      role="presentation"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[1280px] overflow-hidden rounded-[24px] bg-black shadow-[0_32px_120px_rgba(0,0,0,0.42)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close video preview"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/88 text-[#111827] shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:bg-white"
        >
          <span className="text-2xl leading-none">×</span>
        </button>
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="block w-full bg-black"
        />
      </div>
    </div>
  );
}
