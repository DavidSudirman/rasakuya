import React from "react";
import { cn } from "@/lib/utils";

type LeavesVFXProps = {
  show: boolean;
  imageSrc?: string;
  maxLeaves?: number;                 // how many visible at once
  spawnInterval?: [number, number];   // ms between new leaves
  fallDuration?: [number, number];    // seconds to reach bottom
  swayDuration?: [number, number];    // seconds per sway cycle
  spinDuration?: [number, number];    // seconds per rotation
  sizeRange?: [number, number];       // scale factor
};

type CSSVarStyle = React.CSSProperties & {
  ["--fallDur"]?: string;
  ["--swayDur"]?: string;
  ["--spinDur"]?: string;
};

type Leaf = {
  id: number;
  left: number;     // vw
  fallDur: number;  // seconds
  swayDur: number;  // seconds
  spinDur: number;  // seconds
  scale: number;    // scale factor
  blur: number;     // px
};

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max));

export const LeavesVFX: React.FC<LeavesVFXProps> = ({
  show,
  imageSrc = "/themes/leaf.png",
  maxLeaves = 10,
  spawnInterval = [600, 1200],
  fallDuration = [4.5, 6.5],   // ⚡ faster fall but not instant
  swayDuration = [2.2, 3.4],
  spinDuration = [6, 10],
  sizeRange = [1.2, 1.8],
}) => {
  const [leaves, setLeaves] = React.useState<Leaf[]>([]);
  const idRef = React.useRef(0);
  const timerRef = React.useRef<number | null>(null);
  const runningRef = React.useRef(false);

  // spawn new leaf at random intervals
  const scheduleNext = React.useCallback(() => {
    if (!runningRef.current) return;
    const delay = randInt(spawnInterval[0], spawnInterval[1]);
    timerRef.current = window.setTimeout(() => {
      setLeaves((prev) => {
        if (prev.length >= maxLeaves) {
          scheduleNext();
          return prev;
        }
        const id = ++idRef.current;
        const leaf: Leaf = {
          id,
          left: rand(0, 100),
          fallDur: rand(fallDuration[0], fallDuration[1]),
          swayDur: rand(swayDuration[0], swayDuration[1]),
          spinDur: rand(spinDuration[0], spinDuration[1]),
          scale: rand(sizeRange[0], sizeRange[1]),
          blur: Math.random() < 0.25 ? 0.8 : 0,
        };
        scheduleNext();
        return [...prev, leaf];
      });
    }, delay) as unknown as number;
  }, [maxLeaves, spawnInterval, fallDuration, swayDuration, spinDuration, sizeRange]);

  React.useEffect(() => {
    if (show) {
      runningRef.current = true;
      scheduleNext();
    } else {
      runningRef.current = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setLeaves([]);
    }
    return () => {
      runningRef.current = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [show, scheduleNext]);

  if (!show && leaves.length === 0) return null;

  const isJPG =
    typeof imageSrc === "string" &&
    (imageSrc.endsWith(".jpg") || imageSrc.endsWith(".jpeg"));

  return (
    <div
      aria-hidden
      className={cn(
        // fixed overlay across entire viewport, above everything except flash
        "pointer-events-none fixed inset-0 z-[60] select-none"
      )}
    >
      <div className="absolute inset-0 [@media(prefers-reduced-motion:reduce)]:hidden">
        {leaves.map((leaf) => (
          <div
            key={leaf.id}
            className={cn(
              "absolute top-[-10%] transform-gpu will-change-transform backface-hidden",
              "animate-leaf-fall-once"
            )}
            style={
              {
                left: `${leaf.left}vw`,
                "--fallDur": `${leaf.fallDur}s`,
              } as CSSVarStyle
            }
            onAnimationEnd={() =>
              setLeaves((prev) => prev.filter((l) => l.id !== leaf.id))
            }
          >
            <div
              className={cn(
                "relative transform-gpu",
                "animate-leaf-sway"
              )}
              style={
                {
                  "--swayDur": `${leaf.swayDur}s`,
                } as CSSVarStyle
              }
            >
              <div
                className={cn("origin-center transform-gpu", "animate-leaf-spin")}
                style={
                  {
                    transform: `scale(${leaf.scale})`,
                    "--spinDur": `${leaf.spinDur}s`,
                    filter: leaf.blur ? `blur(${leaf.blur}px)` : undefined,
                  } as CSSVarStyle
                }
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt=""
                    className={cn(
                      "w-10 h-10 md:w-12 md:h-12",
                      isJPG
                    )}
                    decoding="async"
                    loading="eager"
                    draggable={false}
                  />
                ) : (
                  <span className="text-2xl md:text-3xl block">🍂</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
