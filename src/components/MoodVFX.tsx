import React, { useEffect, useState } from 'react';

interface MoodVFXProps {
  trigger: boolean;
  onComplete: () => void;
}

const confettiColors = [
  'bg-red-400',
  'bg-blue-400', 
  'bg-green-400',
  'bg-yellow-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-indigo-400',
  'bg-orange-400'
];

const confettiShapes = ['square', 'circle', 'triangle'];

export const MoodVFX: React.FC<MoodVFXProps> = ({ trigger, onComplete }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      // Complete animation after 2 seconds
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Confetti pieces */}
      {[...Array(30)].map((_, i) => {
        const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const shape = confettiShapes[Math.floor(Math.random() * confettiShapes.length)];
        const leftPosition = Math.random() * 100;
        const animationDelay = Math.random() * 0.5;
        const animationDuration = 1.5 + Math.random() * 1;
        
        return (
          <div
            key={i}
            className={`absolute -top-2 ${color} opacity-90`}
            style={{
              left: `${leftPosition}%`,
              width: shape === 'circle' ? '8px' : '6px',
              height: shape === 'triangle' ? '10px' : '6px',
              borderRadius: shape === 'circle' ? '50%' : shape === 'triangle' ? '0' : '2px',
              clipPath: shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
              animation: `confetti-fall ${animationDuration}s linear ${animationDelay}s 1 forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
      
      {/* Success message */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-[fade-in_0.5s_ease-out_0.5s_both]">
        <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-lg font-medium shadow-lg">
          Mood tersimpan! 🎉
        </div>
      </div>
    </div>
  );
};