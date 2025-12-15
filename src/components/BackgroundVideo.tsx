// src/components/BackgroundVideo.tsx
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;                 // e.g. "/videos/Maintheme.mp4"
  poster?: string | null;      // e.g. "/videos/Maintheme.jpg" | null to disable
  overlayClassName?: string;   // optional tint, e.g. "bg-black/30"
  hideOnMobile?: boolean;      // set true if you want to skip video on small screens
};

export const BackgroundVideo: React.FC<Props> = ({
  src,
  poster = null,               // <— default to NO poster so it can’t “stick”
  overlayClassName,
  hideOnMobile = false,
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    // Required for autoplay on mobile
    v.muted = true;
    v.playsInline = true;

    const tryPlay = () => {
      // force playback if possible
      v.play().catch(() => {
        // some browsers delay until 'canplay'/'loadeddata'
      });
    };

    const onLoaded = () => {
      setReady(true);
      tryPlay();
    };

    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("canplay", onLoaded);
    tryPlay();

    return () => {
      v.removeEventListener("loadeddata", onLoaded);
      v.removeEventListener("canplay", onLoaded);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-20 overflow-hidden", // behind gradient (-z-10)
        hideOnMobile && "hidden sm:block"
      )}
      // Avoid a white flash between poster → first frame
      style={{ backgroundColor: "black" }}
    >
      <video
        ref={ref}
        className={cn(
          "h-full w-full object-cover",
          ready ? "opacity-100" : "opacity-0" // fade in only when ready
        )}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        // poster disabled by default; pass a value if you want it
        {...(poster ? { poster } : {})}
      >
        <source src={src} type="video/mp4" />
      </video>

      {overlayClassName && <div className={cn("absolute inset-0", overlayClassName)} />}
    </div>
  );
};
