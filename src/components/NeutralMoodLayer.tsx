// src/components/NeutralMoodLayer.tsx
import * as React from "react";

type NeutralMoodLayerProps = {
  active: boolean;
};

export const NeutralMoodLayer: React.FC<NeutralMoodLayerProps> = ({ active }) => {
  const [mouse, setMouse] = React.useState({ x: 0, y: 0 });
  const [showFade, setShowFade] = React.useState(false);

  // Track mouse only when neutral is active
  React.useEffect(() => {
    if (!active) return;

    const handleMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const nx = (e.clientX - cx) / cx; // -1 .. 1
      const ny = (e.clientY - cy) / cy;
      setMouse({ x: nx, y: ny });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [active]);

  // Fade from black when neutral turns on
  React.useEffect(() => {
    if (!active) return;
    setShowFade(true);
    const id = setTimeout(() => setShowFade(false), 700);
    return () => clearTimeout(id);
  }, [active]);

  if (!active && !showFade) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Static neutral background */}
      <div
        className="absolute inset-0 neutral-bg"
        style={{
          backgroundImage: "url('/themes/normal1.jpg')",
        }}
      />

      {/* Shapes layer – moves gently with cursor */}
      {active && (
        <div
          className="absolute inset-0 neutral-shapes-layer"
          style={{
            transform: `translate3d(${mouse.x * 18}px, ${mouse.y * 12}px, 0)`
            
          }}
        >
        
            <img
            src="/themes/shapes.png"
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* Fade-from-black overlay */}
      {showFade && <div className="neutral-fade-overlay" />}
    </div>
  );
};
