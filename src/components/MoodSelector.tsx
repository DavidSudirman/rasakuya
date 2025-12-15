// src/components/MoodSelector.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Battery, ChevronLeft, ChevronRight, Sparkles, Hand, Dot } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface MoodOption {
  id: string; // ids match DB
  emoji: string;
  nameKey: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  { id: "bahagia", emoji: "😊", nameKey: "mood.happy", color: "mood-good" },
  { id: "netral", emoji: "😐", nameKey: "mood.neutral", color: "mood-neutral" },
  { id: "cemas", emoji: "😰", nameKey: "mood.anxious", color: "mood-anxious" },
  { id: "sedih", emoji: "😔", nameKey: "mood.sad", color: "mood-sad" },
  { id: "marah", emoji: "😠", nameKey: "mood.angry", color: "mood-angry" },
];

// intro slide type
type IntroItem = {
  kind: "intro";
  id: "intro";
  image: string;
};

type MoodItem = MoodOption & { kind: "mood" };
type CarouselItem = IntroItem | MoodItem;

interface MoodSelectorProps {
  selectedMood: string | null;
  onMoodSelect: (moodId: string | null) => void; // allow null for intro
  description: string;
  onDescriptionChange: (description: string) => void;
  energyLevel: number;
  onEnergyLevelChange: (level: number) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onMoodSelect,
  description,
  onDescriptionChange,
  energyLevel,
  onEnergyLevelChange,
}) => {
  const { t } = useLanguage();

  // ✅ Prevent “tracker.key_name” showing when translation is missing.
  const tt = (key: string, fallback: string) => {
    const out = t(key);
    if (!out) return fallback;
    if (out === key) return fallback;
    if (out.includes(".") || out.includes("_")) return fallback;
    return out;
  };

  const introItem: IntroItem = {
    kind: "intro",
    id: "intro",
    image: "/themes/choose-emotion.jpg",
  };

  const moodItems: MoodItem[] = useMemo(
    () => moodOptions.map((m) => ({ ...m, kind: "mood" as const })),
    []
  );
  const carouselItems: CarouselItem[] = useMemo(() => [introItem, ...moodItems], [moodItems]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Accent per mood (neon-ish)
  const moodAccent: Record<string, string> = {
    bahagia: "#FBBF24",
    netral: "#A1A1AA",
    cemas: "#60A5FA",
    sedih: "#818CF8",
    marah: "#FB7185",
  };

  const currentItem = carouselItems[currentIndex];
  const activeMood = currentItem.kind === "mood" ? currentItem : null;
  const accent = activeMood ? moodAccent[activeMood.id] ?? "#A78BFA" : "#A78BFA";

  // ✅ ONLY happy + neutral -> dark text for the UI labels you listed
  const isLightBgMood = activeMood?.id === "bahagia" || activeMood?.id === "netral";

  const uiText = isLightBgMood ? "text-slate-900" : "text-white";
  const uiTextMuted = isLightBgMood ? "text-slate-700" : "text-white/70";
  const uiTextFaint = isLightBgMood ? "text-slate-600" : "text-white/55";

  const pillBorder = isLightBgMood ? "border-black/10" : "border-white/15";
  const pillBg = isLightBgMood ? "bg-white/70" : "bg-white/10";

  const chipBorder = isLightBgMood ? "border-black/10" : "border-white/15";
  const chipBg = isLightBgMood ? "bg-white/65" : "bg-white/10";

  const textareaClass = isLightBgMood
    ? "bg-white/70 border-black/10 text-slate-900 placeholder:text-slate-500"
    : "bg-white/10 border-white/15 text-white placeholder:text-white/50";

  const [draggingEnergy, setDraggingEnergy] = useState(false);

  // sync with parent selectedMood
  useEffect(() => {
    if (!selectedMood) {
      setCurrentIndex(0);
      return;
    }
    const idx = carouselItems.findIndex(
      (item) => item.kind === "mood" && item.id === selectedMood
    );
    if (idx !== -1) setCurrentIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMood]);

  const goToIndex = (newIndex: number) => {
    const len = carouselItems.length;
    const wrappedIndex = ((newIndex % len) + len) % len;

    setCurrentIndex(wrappedIndex);

    const item = carouselItems[wrappedIndex];
    if (item.kind === "intro") onMoodSelect(null);
    else onMoodSelect(item.id);
  };

  const goNext = () => goToIndex(currentIndex + 1);
  const goPrev = () => goToIndex(currentIndex - 1);

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40;
    if (deltaX > threshold) goPrev();
    else if (deltaX < -threshold) goNext();
    touchStartX.current = null;
  };

  const isOnMoodSlide = currentItem.kind === "mood" && !!selectedMood;

  // distance from center, but wrap so ends are neighbours
  const getOffset = (index: number) => {
    const len = carouselItems.length;
    let offset = index - currentIndex;
    if (offset > len / 2) offset -= len;
    if (offset < -len / 2) offset += len;
    return offset;
  };

  const dots = carouselItems.map((it) => it.id);

  return (
    <div className="space-y-5" style={{ ["--accent" as any]: accent }}>
      {/* How are you feeling today? (✅ black only for happy+neutral) */}
      <div className="text-center space-y-1">
        <div
          className={`inline-flex items-center gap-2 rounded-full border ${pillBorder} ${pillBg} px-4 py-2 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.35)]`}
        >
          <Sparkles className={`h-4 w-4 ${isLightBgMood ? "text-slate-900/80" : "text-white/85"}`} />
          <h3 className={`text-sm sm:text-base font-semibold ${uiText}`}>
            {tt("tracker.how_feel_today", "How do you feel today?")}
          </h3>
        </div>

        
      </div>

      {/* 🎠 Carousel */}
      <div className="relative">
        {/* glow behind carousel */}
        <div
          className="pointer-events-none absolute -inset-x-8 -inset-y-6 blur-2xl opacity-60"
          style={{
            background:
              "radial-gradient(600px 220px at 50% 40%, color-mix(in srgb, var(--accent) 38%, transparent), transparent 70%)",
          }}
        />

        <div className="relative flex items-center justify-center gap-3 sm:gap-4">
          {/* Prev */}
          <button
            type="button"
            onClick={goPrev}
            className="
              h-10 w-10 sm:h-11 sm:w-11
              rounded-full
              border border-white/15
              bg-white/10 hover:bg-white/15
              backdrop-blur-xl
              shadow-[0_12px_28px_rgba(0,0,0,0.35)]
              transition
              grid place-items-center
            "
            aria-label="Previous mood"
          >
            <ChevronLeft className="h-5 w-5 text-white/90" />
          </button>

          {/* Stage */}
          <div
            className="relative flex-1 max-w-xl h-60 sm:h-64 [perspective:1200px]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative h-full flex items-center justify-center [transform-style:preserve-3d]">
              {carouselItems.map((item, index) => {
                const offset = getOffset(index);
                if (Math.abs(offset) > 3) return null;

                const isCenter = offset === 0;

                const translateX = offset * 165;
                const translateZ = isCenter ? 110 : -160 * Math.abs(offset);
                const rotateY = offset * -24;
                const scale = isCenter ? 1.02 : 1 - 0.12 * Math.abs(offset);

                const handleCardClick = () => {
                  if (offset > 0) goNext();
                  else if (offset < 0) goPrev();
                };

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={handleCardClick}
                    className="absolute w-40 sm:w-48 md:w-56 focus:outline-none"
                    style={{
                      transform: `
                        translateX(${translateX}px)
                        translateZ(${translateZ}px)
                        rotateY(${rotateY}deg)
                        scale(${scale})
                      `,
                      opacity: isCenter ? 1 : 0.48,
                      zIndex: 30 - Math.abs(offset),
                      transition:
                        "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease",
                    }}
                  >
                    <Card
                      className="
                        relative rounded-[28px] overflow-hidden
                        border border-white/12
                        bg-white/[0.07]
                        backdrop-blur-2xl
                        shadow-[0_24px_65px_rgba(0,0,0,0.55)]
                      "
                      style={
                        isCenter
                          ? ({
                              boxShadow:
                                "0 0 0 1px color-mix(in srgb, var(--accent) 60%, transparent), 0 24px 70px rgba(0,0,0,0.55), 0 0 42px color-mix(in srgb, var(--accent) 35%, transparent)",
                            } as any)
                          : undefined
                      }
                    >
                      {/* stronger contrast overlay to keep text readable */}
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            item.kind === "intro"
                              ? "linear-gradient(180deg, rgba(0,0,0,0.20), rgba(0,0,0,0.55) 70%)"
                              : "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.35) 75%)",
                        }}
                      />

                      {/* light sheen */}
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.08))",
                          mixBlendMode: "overlay",
                          opacity: 0.65,
                        }}
                      />

                      {/* center accent ring */}
                      {isCenter && (
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{
                            borderRadius: 28,
                            boxShadow:
                              "inset 0 0 0 1px color-mix(in srgb, var(--accent) 70%, transparent)",
                          }}
                        />
                      )}

                      {item.kind === "intro" ? (
                        <div className="h-52 sm:h-56 w-full relative">
                          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                            <div className="inline-flex items-center gap-2 rounded-full bg-black/30 border border-white/20 px-3 py-1.5 backdrop-blur-xl">
                              <Hand className="h-4 w-4 text-white/90" />
                              <p className="text-xs font-semibold text-white tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                                {tt("tracker.choose_emotion_intro", "Choose your emotion")}
                              </p>
                            </div>

                            <p className="text-[11px] sm:text-xs text-white/80 mt-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                              {tt("tracker.swipe_or_use_arrows", "Swipe left/right — or use the arrows.")}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-52 sm:h-56 flex flex-col items-center justify-center relative">
                          <div
                            className="
                              grid place-items-center
                              h-16 w-16 rounded-2xl
                              border border-white/20
                              bg-black/20
                              backdrop-blur-xl
                              shadow-[0_16px_45px_rgba(0,0,0,0.45)]
                            "
                            style={{
                              boxShadow: isCenter
                                ? "0 0 0 1px color-mix(in srgb, var(--accent) 55%, transparent), 0 18px 55px rgba(0,0,0,0.5)"
                                : undefined,
                            }}
                          >
                            <div className="text-4xl">{item.emoji}</div>
                          </div>

                          <div className="mt-4 text-center px-4">
                            <p className="text-sm sm:text-base font-semibold text-white tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                              {tt(item.nameKey, item.id)}
                            </p>
                          </div>
                        </div>
                      )}
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={goNext}
            className="
              h-10 w-10 sm:h-11 sm:w-11
              rounded-full
              border border-white/15
              bg-white/10 hover:bg-white/15
              backdrop-blur-xl
              shadow-[0_12px_28px_rgba(0,0,0,0.35)]
              transition
              grid place-items-center
            "
            aria-label="Next mood"
          >
            <ChevronRight className="h-5 w-5 text-white/90" />
          </button>
        </div>

        {/* dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {dots.map((id, idx) => {
            const active = idx === currentIndex;
            return (
              <span
                key={id}
                className={`
                  inline-block h-1.5 rounded-full transition-all duration-300
                  ${active ? "w-7" : "w-2.5"}
                `}
                style={{
                  background: active
                    ? "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 35%, white))"
                    : "rgba(255,255,255,0.22)",
                  boxShadow: active
                    ? "0 0 18px color-mix(in srgb, var(--accent) 40%, transparent)"
                    : undefined,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Details (✅ black only for happy+neutral) */}
      {isOnMoodSlide && (
        <div className="space-y-4">
          {/* ⚡ Energy meter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className={`flex items-center gap-2 ${uiText}`}>
                <Battery className="h-4 w-4" />
                {tt("tracker.energy_level", "Energy level")}
              </Label>

              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${chipBorder} ${chipBg} backdrop-blur ${
                  draggingEnergy ? "animate-pulse" : ""
                }`}
                style={{
                  boxShadow: "0 0 18px color-mix(in srgb, var(--accent) 40%, transparent)",
                  color: isLightBgMood ? "#0f172a" : "white",
                }}
              >
                <span className="mr-1">⚡</span>
                {energyLevel}/10
              </div>
            </div>

            <div className="relative px-2">
              <div className={`${isLightBgMood ? "bg-black/10" : "bg-white/10"} h-2 rounded-full overflow-hidden`}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(energyLevel / 10) * 100}%`,
                    background:
                      "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 35%, white))",
                    boxShadow: "0 0 20px color-mix(in srgb, var(--accent) 55%, transparent)",
                  }}
                />
              </div>

              <div className="mt-3">
                <Slider
                  value={[energyLevel]}
                  onValueChange={(value) => onEnergyLevelChange(value[0])}
                  onPointerDown={() => setDraggingEnergy(true)}
                  onPointerUp={() => setDraggingEnergy(false)}
                  max={10}
                  min={1}
                  step={1}
                  className={`
                    w-full
                    [&_[data-orientation=horizontal]]:h-2
                    [&_[data-orientation=horizontal]]:${isLightBgMood ? "bg-black/10" : "bg-white/10"}
                    [&_[data-orientation=horizontal]]:rounded-full
                    [&_[data-range]]:bg-[color:var(--accent)]
                    [&_[data-thumb]]:h-5 [&_[data-thumb]]:w-5
                    [&_[data-thumb]]:border-2 [&_[data-thumb]]:${isLightBgMood ? "border-black/20" : "border-white/70"}
                    [&_[data-thumb]]:bg-white
                    [&_[data-thumb]]:shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                  `}
                />

                <div className={`flex justify-between text-xs mt-2 ${uiTextMuted}`}>
                  <span>{tt("tracker.very_tired", "Very tired")}</span>
                  <span>{tt("tracker.very_energetic", "Very energetic")}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { v: 2, labelKey: "tracker.energy_low", fallback: "😴 Low" },
                  { v: 5, labelKey: "tracker.energy_mid", fallback: "🙂 Mid" },
                  { v: 8, labelKey: "tracker.energy_high", fallback: "⚡ High" },
                ].map((p) => (
                  <button
                    key={p.v}
                    type="button"
                    onClick={() => onEnergyLevelChange(p.v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${chipBorder} ${chipBg} hover:bg-white/15 transition backdrop-blur ${uiText}`}
                    style={{
                      boxShadow:
                        energyLevel === p.v
                          ? "0 0 18px color-mix(in srgb, var(--accent) 40%, transparent)"
                          : undefined,
                    }}
                  >
                    {tt(p.labelKey, p.fallback)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* description */}
          <div className="space-y-2">
            <Label htmlFor="mood-description" className={uiText}>
              {tt("tracker.describe_label", "Tell us more about how you feel (optional)")}
            </Label>

            <Textarea
              id="mood-description"
              placeholder={tt(
                "tracker.describe_placeholder",
                "What made you feel this way? Any activities or events today?"
              )}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className={`min-h-[92px] resize-none backdrop-blur-xl rounded-2xl shadow-[0_16px_45px_rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] ${textareaClass}`}
            />

            <div className={`flex items-center justify-between text-[11px] ${uiTextFaint}`}>
              <span className="inline-flex items-center gap-1">
                <Dot className="h-4 w-4" />
                {tt("tracker.private_note", "Saved privately to your journal.")}
              </span>
              <span>{description.length}/240</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
