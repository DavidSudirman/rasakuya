import { useEffect, useState } from "react";

type BlackFadeProps = {
  /** Time in ms before fade starts */
  delayMs?: number;
  /** Duration of fade-out (ms) */
  fadeOutMs?: number;
  /** Called when fade is fully complete */
  onComplete?: () => void;
  /** Optional z-index or styling */
  className?: string;
};

export const BlackFade = ({
  delayMs = 1000,
  fadeOutMs = 1000,
  onComplete,
  className = "z-50",
}: BlackFadeProps) => {
  const [phase, setPhase] = useState<"show" | "fade" | "hidden">("show");

  useEffect(() => {
    const startFade = setTimeout(() => setPhase("fade"), delayMs);
    const finish = setTimeout(() => {
      setPhase("hidden");
      onComplete?.();
    }, delayMs + fadeOutMs);

    return () => {
      clearTimeout(startFade);
      clearTimeout(finish);
    };
  }, [delayMs, fadeOutMs, onComplete]);

  if (phase === "hidden") return null;

  return (
    <div
      className={`fixed inset-0 bg-black transition-opacity ${className}`}
      style={{
        opacity: phase === "fade" ? 0 : 1,
        transitionDuration: `${fadeOutMs}ms`,
      }}
    />
  );
};
