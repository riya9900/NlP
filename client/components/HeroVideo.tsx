"use client";

import { useCallback, useEffect, useRef } from "react";

const SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4";

const FADE_IN_MS = 250;

/**
 * Full-bleed background video that loops continuously (native `loop`, so it never blanks between loops).
 * The only fade is a single 250 ms JavaScript fade-in the first time playback starts (no CSS transitions).
 */
export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  const cancelFade = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const fadeIn = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    cancelFade();
    const from = Number(el.style.opacity || 0); // resume from the current opacity, never snap
    let start: number | null = null; // anchored to the first frame's own timestamp
    const step = (now: number) => {
      if (start === null) start = now;
      const t = Math.max(0, Math.min(1, (now - start) / FADE_IN_MS));
      el.style.opacity = String(from + (1 - from) * t);
      rafRef.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    rafRef.current = requestAnimationFrame(step);
  }, [cancelFade]);

  const handlePlaying = () => {
    if (startedRef.current) return; // fade in once; loops must stay fully visible
    startedRef.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // respect the setting: a still frame instead of a moving background
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.style.opacity = "1";
      return;
    }
    fadeIn();
  };

  useEffect(() => cancelFade, [cancelFade]);

  return (
    <video
      ref={videoRef}
      src={SRC}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={handlePlaying}
      style={{ opacity: 0 }}
      className="pointer-events-none absolute left-1/2 top-0 h-[115%] w-[115%] max-w-none -translate-x-1/2 object-cover object-top"
    />
  );
}
