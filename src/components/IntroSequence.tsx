// src/components/IntroSequence.tsx
import { useEffect, useState } from "react";
import { Lightstreak } from "@/components/Lightstreak";

/**
 * IntroSequence
 * - Fullscreen black screen + neon border animation (Lightstreak)
 * - Centered brand row: logo.png + "RasakuYa!"
 * - Fades out after visibleDuration, then unmounts after fadeDuration
 *
 * Customize by tweaking visibleDuration / fadeDuration or replacing /logo.png.
 */
export const IntroSequence = () => {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  // Total time the animation is visible
  const visibleDuration = 3500; // ms
  const fadeDuration = 800; // ms

  useEffect(() => {
    const startFade = setTimeout(() => setFade(true), visibleDuration);
    const hideAll = setTimeout(() => setVisible(false), visibleDuration + fadeDuration);

    return () => {
      clearTimeout(startFade);
      clearTimeout(hideAll);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity ${
        fade ? "opacity-0" : "opacity-100"
      }`}
      style={{
        transition: `opacity ${fadeDuration}ms ease-in-out`,
      }}
      aria-hidden={fade ? "true" : "false"}
    >
      {/* 🔵 Neon edge animation */}
      <Lightstreak durationMs={visibleDuration} fadeOutMs={fadeDuration} className="z-10" />

      {/* Center brand row: logo + text */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <img
            src="/logo.jpg" // ensure this exists in /public/logo.png
            alt="RasakuYa logo"
            className="h-14 w-14 md:h-16 md:w-16 object-contain select-none drop-shadow-[0_0_16px_rgba(59,130,246,0.45)]"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <h1
            className="text-4xl md:text-5xl font-bold text-white tracking-wide"
            style={{ textShadow: "0 0 16px rgba(59,130,246,0.35)" }}
          >
            Rasaku<span className="text-blue-400">Ya</span>
          </h1>
        </div>
      </div>
    </div>
  );
};
