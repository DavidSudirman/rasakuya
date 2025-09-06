import React, { useEffect, useState } from 'react';
import { Sparkles, Heart, Star } from 'lucide-react';

interface MoodVFXProps {
  trigger: boolean;
  onComplete: () => void;
  moodEmoji?: string;
}

export const MoodVFX: React.FC<MoodVFXProps> = ({ trigger, onComplete, moodEmoji = '😊' }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      // Complete animation after 1.5 seconds
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Main burst effect */}
      <div className="relative">
        {/* Central emoji burst */}
        <div className="text-8xl animate-[scale-in_0.5s_ease-out,fade-out_0.5s_ease-out_1s] transform">
          {moodEmoji}
        </div>
        
        {/* Sparkle particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400`}
            style={{
              animation: `sparkle-burst 1.2s ease-out ${i * 0.1}s`,
              transform: `rotate(${i * 45}deg) translate(0, -60px)`,
            }}
          >
            <Sparkles className="h-6 w-6" />
          </div>
        ))}
        
        {/* Heart particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`heart-${i}`}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-pink-400"
            style={{
              animation: `heart-float 1.5s ease-out ${i * 0.15}s`,
              transform: `rotate(${i * 60}deg) translate(0, -40px)`,
            }}
          >
            <Heart className="h-4 w-4 fill-current" />
          </div>
        ))}
        
        {/* Star particles */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400"
            style={{
              animation: `star-twinkle 1.3s ease-out ${i * 0.2}s`,
              transform: `rotate(${i * 90}deg) translate(0, -80px)`,
            }}
          >
            <Star className="h-5 w-5 fill-current" />
          </div>
        ))}
        
        {/* Ring burst effect */}
        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-4 border-primary/30 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-[ring-burst_1s_ease-out]" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-secondary/40 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-[ring-burst_1s_ease-out_0.2s]" />
      </div>
      
      {/* Success message */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-20 animate-[fade-in_0.5s_ease-out_0.8s_both]">
        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          Mood tersimpan! ✨
        </div>
      </div>
    </div>
  );
};