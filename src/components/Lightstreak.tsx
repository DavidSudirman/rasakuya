import { useEffect, useState } from "react";

type LightstreakProps = {
  /** How long to stay visible before fading (ms). 
   *  Tip: use ≥ 2600ms so the bottom join finishes. */
  durationMs?: number;
  /** Fade-out duration (ms). */
  fadeOutMs?: number;
  /** Extra classes (e.g., z-index control). */
  className?: string;
  /** Called after it fully disappears. */
  onComplete?: () => void;
};

export const Lightstreak = ({
  durationMs = 3500,
  fadeOutMs = 600,
  className = "",
  onComplete,
}: LightstreakProps) => {
  const [phase, setPhase] = useState<"show" | "fade" | "hidden">("show");

  useEffect(() => {
    // Start fade after durationMs
    const t1 = setTimeout(() => setPhase("fade"), durationMs);
    // Fully hide after fadeOutMs
    const t2 = setTimeout(() => {
      setPhase("hidden");
      onComplete?.();
    }, durationMs + fadeOutMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [durationMs, fadeOutMs, onComplete]);

  if (phase === "hidden") return null;

  return (
    <div
      id="stage"
      className={`fixed inset-0 overflow-hidden transition-opacity ${className}`}
      style={{
        // fade from 1 -> 0 during fade phase
        opacity: phase === "fade" ? 0 : 1,
        transitionDuration: `${fadeOutMs}ms`,
      }}
    >
      {/* faint border background */}
      <div className="absolute inset-[12px] border border-[rgba(90,160,255,0.08)] rounded-[18px] shadow-[inset_0_0_40px_rgba(100,160,255,0.05)]" />

      {/* trails */}
      <div className="trail top" />
      <div className="trail left" />
      <div className="trail right" />
      <div className="trail bottom-left" />
      <div className="trail bottom-right" />

      {/* soft edge glow */}
      <div className="absolute inset-[12px] pointer-events-none blur-[16px]"
           style={{
             borderLeft: "2px solid rgba(90,200,255,0.15)",
             borderRight: "2px solid rgba(140,100,255,0.15)",
             borderTop: "0",
             borderBottom: "0",
           }}
      />
    </div>
  );
};
