// src/pages/Index.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoodSelector } from "@/components/MoodSelector";
import { MoodCalendar } from "@/components/MoodCalendar";
import { MoodPrediction } from "@/components/MoodPrediction";
import { MoodStats } from "@/components/MoodStats";
import { ArunaChatTabs } from "@/components/ArunaChatTabs";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AccountDropdown } from "@/components/AccountDropdown";
import { MoodVFX } from "@/components/MoodVFX";
import { Heart, Sparkles, Calendar, BarChart3, Bot, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ymdLocal, utcNoonIsoFromYmd } from "@/lib/dates";
import { computeDailyStreak } from "@/lib/streak";
import { isSameDay } from "date-fns";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { NeutralMoodLayer } from "@/components/NeutralMoodLayer";

type BgMode =
  | "default"
  | "happy"
  | "angry"
  | "sad"
  | "neutral"
  | "anxiety";

const MOOD_THEME: Record<
  BgMode,
  {
    text: string;
    muted: string;
    title: string;
    headerTitle: string;
    headerSubtitle: string;
    streakPill: string;
    navActive: string;
    navInactive: string;
  }
> = {
  default: {
    text: "text-white",
    muted: "text-white/70",
    title: "text-white",
    headerTitle: "text-white",
    headerSubtitle: "text-white/70",
    streakPill:
      "bg-orange-100/90 text-orange-800 border border-orange-200/80",
    navActive:
      "bg-sky-500/90 text-white shadow-sm shadow-sky-400/60",
    navInactive:
      "text-white/70 hover:text-white hover:bg-white/10",
  },
  happy: {
    text: "text-amber-950",
    muted: "text-amber-900/80",
    title:
      "bg-gradient-to-r from-amber-700 via-yellow-500 to-lime-500 bg-clip-text text-transparent",
    headerTitle: "text-amber-950",
    headerSubtitle: "text-amber-900/80",
    streakPill:
      "bg-amber-100 text-amber-800 border border-amber-200",
    navActive:
      "bg-amber-400 text-amber-950 shadow-sm shadow-amber-300/80",
    navInactive:
      "text-amber-900/75 hover:text-amber-950 hover:bg-amber-200/40",
  },
  sad: {
    text: "text-sky-50",
    muted: "text-sky-100/80",
    title:
      "bg-gradient-to-r from-sky-100 via-blue-200 to-indigo-300 bg-clip-text text-transparent",
    headerTitle: "text-sky-50",
    headerSubtitle: "text-sky-100/80",
    streakPill:
      "bg-slate-900/70 text-sky-100 border border-sky-500/40",
    navActive:
      "bg-sky-500/80 text-white shadow-sm shadow-sky-400/80",
    navInactive:
      "text-sky-100/75 hover:text-white hover:bg-white/10",
  },
  angry: {
    text: "text-orange-50",
    muted: "text-orange-100/80",
    title:
      "bg-gradient-to-r from-orange-200 via-red-300 to-amber-200 bg-clip-text text-transparent",
    headerTitle: "text-orange-50",
    headerSubtitle: "text-orange-100/80",
    streakPill:
      "bg-orange-900/70 text-orange-100 border border-red-400/60",
    navActive:
      "bg-red-500/80 text-white shadow-sm shadow-red-400/80",
    navInactive:
      "text-orange-100/80 hover:text-white hover:bg-white/10",
  },
  neutral: {
    text: "text-slate-900",
    muted: "text-slate-600",
    title:
      "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 bg-clip-text text-transparent",
    headerTitle: "text-slate-900",
    headerSubtitle: "text-slate-600",
    streakPill:
      "bg-slate-100 text-slate-800 border border-slate-200",
    navActive:
      "bg-slate-900 text-white shadow-sm shadow-slate-500/80",
    navInactive:
      "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60",
  },
  anxiety: {
    text: "text-sky-50",
    muted: "text-sky-100/80",
    title:
      "bg-gradient-to-r from-teal-200 via-sky-200 to-indigo-300 bg-clip-text text-transparent",
    headerTitle: "text-sky-50",
    headerSubtitle: "text-sky-100/80",
    streakPill:
      "bg-slate-900/70 text-sky-100 border border-teal-400/60",
    navActive:
      "bg-teal-400/90 text-slate-900 shadow-sm shadow-teal-300/80",
    navInactive:
      "text-sky-100/75 hover:text-white hover:bg-white/10",
  },
};



interface MoodEntry {
  date: string; // YYYY-MM-DD (local)
  mood: string;
  emoji: string;
  description?: string;
  energy_level?: number;
  id?: string;
}

function parseHasStyle(raw?: string | null) {
  if (!raw) return false;
  try {
    const j = JSON.parse(raw);
    return typeof j?.style === "string" && j.style.trim().length > 0;
  } catch {
    return raw.trim().length > 0;
  }
}

// Explicit row shape so TS is happy even if generated types are stale
type ProfileBits = {
  has_completed_onboarding: boolean | null;
  aruna_preferences: string | null;
};

/**
 * 🌳 Optional: Trees layer to sit ABOVE the plain happy background (without baked trees)
 * Uses PNGs and a smooth grow animation once the white flash ends.
 */
const HappyTreesLayer: React.FC<{ visible: boolean; kick: boolean }> = ({ visible, kick }) => {
  const [leftLoaded, setLeftLoaded] = React.useState(false);
  const [rightLoaded, setRightLoaded] = React.useState(false);
  const ready = leftLoaded && rightLoaded;
  const play = visible && kick && ready;

  const base =
    "absolute bottom-[6%] transform origin-bottom pointer-events-none select-none transform-gpu will-change-transform will-change-opacity backface-hidden";

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-0">
      {/* left tree */}
      <div className={cn(base, "left-[12%] w-[32%]", play ? "animate-trees-grow" : "opacity-0")}>
        <img
          src="/themes/tree-left.png"
          alt=""
          className="w-full h-auto"
          decoding="async"
          loading="eager"
          draggable={false}
          onLoad={() => setLeftLoaded(true)}
        />
      </div>

      {/* right tree */}
      <div className={cn(base, "left-[64%] w-[32%]", play ? "animate-trees-grow" : "opacity-0")}>
        <img
          src="/themes/tree-right.png"
          alt=""
          className="w-full h-auto"
          decoding="async"
          loading="eager"
          draggable={false}
          onLoad={() => setRightLoaded(true)}
        />
      </div>
    </div>
  );
};

// ✨ Soft star particle layer for sad mood only
const SadSparkles: React.FC<{ active: boolean }> = ({ active }) => {
  // randomize particle positions once
  const [particles] = React.useState(() =>
    Array.from({ length: 40 }).map(() => ({
      top: Math.random() * 100,        // 0–100% viewport height
      left: Math.random() * 100,       // 0–100% viewport width
      delay: Math.random() * 4,        // 0–4s delay
      duration: 3 + Math.random() * 4, // 3–7s twinkle cycle
      size: 3 + Math.random() * 4,     // 3–7px size
    }))
  );

  if (!active) return null;

  return (
    <div className="sad-sparkles-layer">
      {particles.map((p, i) => (
        <div
          key={i}
          className="sad-sparkle"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

const BottomSpacer: React.FC = () => <div className="h-24 md:h-40 lg:h-56" />;

const Index: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodDescription, setMoodDescription] = useState<string>("");
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [activeTab, setActiveTab] = useState<
    "tracker" | "calendar" | "stats" | "prediction" | "therapist"
  >("tracker");
  // ✅ Prediction disclaimer popup (5s, once per UTC day)
const [showPredictionDisclaimer, setShowPredictionDisclaimer] = useState(false);
const [disclaimerCountdown, setDisclaimerCountdown] = useState(5);

  const [loading, setLoading] = useState(true);
  const [isEditingToday, setIsEditingToday] = useState(false);
  const [showVFX, setShowVFX] = useState(false);

  // 🌈 background modes
  const [bgMode, setBgMode] = useState<BgMode>("default");


  const [flashing, setFlashing] = useState(false);
  const [kickTrees, setKickTrees] = useState(false);
  const [showLeaves, setShowLeaves] = useState(false);

  // 🔥 Angry & 😢 Sad VFX overlay state
  const [showAngryVfx, setShowAngryVfx] = useState(false);
  const [showSadVfx, setShowSadVfx] = useState(false);
  const [sadBlendOn, setSadBlendOn] = useState(false);
  const [showAnxietyVfx, setShowAnxietyVfx] = useState(false);


  // Onboarding flags
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
   // use a UTC day key so it’s universal for everyone
  const utcDayKey = new Date().toISOString().slice(0, 10);
  const disclaimerKey = `pred-disclaimer-${user?.id ?? "anon"}-${utcDayKey}`;

  useEffect(() => {
    if (!user) return;
    if (activeTab !== "prediction") return;

    const seen = localStorage.getItem(disclaimerKey) === "1";
    if (seen) return;

    setShowPredictionDisclaimer(true);
    setDisclaimerCountdown(5);

    let t = 5;
    const interval = window.setInterval(() => {
      t -= 1;
      setDisclaimerCountdown(Math.max(0, t));
    }, 1000);

    const timeout = window.setTimeout(() => {
      setShowPredictionDisclaimer(false);
      localStorage.setItem(disclaimerKey, "1");
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [activeTab, user, disclaimerKey]);

  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const theme = MOOD_THEME[bgMode] ?? MOOD_THEME.default;

  // Check authentication and load mood entries
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    void loadMoodEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  // Check onboarding
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCheckingOnboarding(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("has_completed_onboarding, aruna_preferences")
          .eq("user_id", user.id)
          .returns<ProfileBits>()
          .maybeSingle();

        if (error) {
          console.warn("Profile check error:", error);
          setNeedsOnboarding(false);
        } else {
          const row = (data ?? null) as ProfileBits | null;
          const done =
            !!row &&
            (row.has_completed_onboarding === true || parseHasStyle(row.aruna_preferences));
          setNeedsOnboarding(!done);
        }
      } catch (e) {
        console.warn(e);
        setNeedsOnboarding(false);
      } finally {
        setCheckingOnboarding(false);
      }
    })();
  }, [user, authLoading]);

  useEffect(() => {
    if (showSadVfx) {
      setSadBlendOn(false);

      const timer = setTimeout(() => {
        setSadBlendOn(true);
      },4020); 

      return () => clearTimeout(timer);
    } else {
      setSadBlendOn(false);
    }
  }, [showSadVfx]);

  const loadMoodEntries = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("mood_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: true });

      if (error) throw error;

      const formattedEntries = (data ?? []).map((entry: any) => ({
        date: ymdLocal(new Date(entry.logged_at)), // ✅ local YMD
        mood: entry.mood,
        emoji: entry.emoji || getMoodEmoji(entry.mood),
        description: entry.description,
        energy_level: entry.energy_level,
        id: entry.id,
      }));

      setMoodEntries(formattedEntries);
    } catch (error) {
      console.error("Error loading mood entries:", error);
      toast({
        title: t("common.error"),
        description: t("mood.load_error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: { [key: string]: string } = {
      bahagia: "😊",
      netral: "😐",
      cemas: "😰",
      sedih: "😔",
      marah: "😠",
    };
    return moodEmojis[mood] || "😐";
  };

  // 💫 when clicking a mood, trigger mood-specific transitions
  // moodId can be null when user is on the "Choose your emotion" intro slide
const handleMoodSelect = (moodId: string | null) => {
  setSelectedMood(moodId);

  // 🪧 Intro / no mood selected yet → no VFX, reset to default bg
  if (!moodId) {
    setBgMode("default");
    setFlashing(false);
    setKickTrees(false);
    setShowLeaves(false);
    setShowAngryVfx(false);
    setShowSadVfx(false);
    setShowAnxietyVfx(false);
    return;
  }

  const isHappy = moodId === "bahagia";
  const isAngry = moodId === "marah";
  const isSad = moodId === "sedih";
  const isNeutral = moodId === "netral";
  const isAnxiety = moodId === "cemas";

  if ((window as any).__flashTimer) clearTimeout((window as any).__flashTimer);

  // 🟡 HAPPY
  if (isHappy) {
    setShowAngryVfx(false);
    setShowSadVfx(false);
    setKickTrees(false);
    setShowLeaves(false);
    setBgMode("happy");
    setFlashing(true);
    setShowAnxietyVfx(false);

    (window as any).__flashTimer = setTimeout(() => {
      setFlashing(false);
      setKickTrees(true);
      setShowLeaves(true);
    }, 1000);
    return;
  }

  // 🔴 ANGRY
  if (isAngry) {
    setFlashing(false);
    setKickTrees(false);
    setShowLeaves(false);
    setShowSadVfx(false);
    setShowAnxietyVfx(false);

    setBgMode("angry");

    setShowAngryVfx(false);
    requestAnimationFrame(() => {
      setShowAngryVfx(true);
    });

    return;
  }

  // 😢 SAD
  if (isSad) {
    setFlashing(false);
    setKickTrees(false);
    setShowLeaves(false);
    setShowAngryVfx(false);
    setShowAnxietyVfx(false);

   
    setBgMode("sad");

    setShowSadVfx(false);
    requestAnimationFrame(() => {
      setShowSadVfx(true);
    });

    return;
  }

    // 😐 NEUTRAL
  if (isNeutral) {
    setFlashing(false);
    setKickTrees(false);
    setShowLeaves(false);
    setShowAngryVfx(false);
    setShowSadVfx(false);
    setShowAnxietyVfx(false);

    setBgMode("neutral");
    return;
  }

    if (isAnxiety) {
    setFlashing(false);
    setKickTrees(false);
    setShowLeaves(false);
    setShowAngryVfx(false);
    setShowSadVfx(false);

    setBgMode("anxiety");

    // restart anxiety fog VFX
    setShowAnxietyVfx(false);
    requestAnimationFrame(() => {
      setShowAnxietyVfx(true);
    });

    return;
  }


  // Other moods
  setBgMode("default");
  setFlashing(false);
  setKickTrees(false);
  setShowLeaves(false);
  setShowAngryVfx(false);
  setShowSadVfx(false);
  setShowAnxietyVfx(false);
};
  const saveMood = async () => {
    if (!selectedMood || !selectedDate || !user) return;
    try {
      const ymd = ymdLocal(selectedDate);
      const loggedAt = utcNoonIsoFromYmd(ymd); // ✅ stable “same day” in DB

      const { error } = await supabase
        .from("mood_logs")
        .upsert(
          [
            {
              user_id: user.id,
              mood: selectedMood,
              logged_at: loggedAt,
              description: moodDescription.trim() || null,
              energy_level: energyLevel,
            },
          ],
          { onConflict: "user_id,logged_at", ignoreDuplicates: false }
        )
        .select();

      if (error) throw error;

      await loadMoodEntries();
      setSelectedMood(null);
      setMoodDescription("");
      setEnergyLevel(5);
      setIsEditingToday(false);
      setShowVFX(true);

      toast({
        title: t("mood.saved"),
        description: t("mood.saved_desc").replace(
          "{date}",
          selectedDate.toLocaleDateString(language === "id" ? "id-ID" : "en-US")
        ),
      });
    } catch (error) {
      console.error("Error saving mood:", error);
      toast({
        title: t("common.error"),
        description: t("mood.save_error"),
        variant: "destructive",
      });
    }
  };

  const getCurrentMoodForDate = (dateYmd: string) => {
    return moodEntries.find((entry) => entry.date === dateYmd);
  };

  const selectedDateString = ymdLocal(selectedDate);
  const currentMoodEntry = getCurrentMoodForDate(selectedDateString);

  const todayYmd = ymdLocal(new Date());
  const uniqueYmds = Array.from(new Set(moodEntries.map((e) => e.date)));
  const { streak, hasToday } = computeDailyStreak(uniqueYmds, todayYmd);

  const streakText = (() => {
  if (hasToday) {
    if (streak === 1) {
      // e.g. "Streak: 1 day"
      return t("streak.with_today_one").replace("{count}", String(streak));
    }
    // e.g. "Streak: {count} days"
    return t("streak.with_today").replace("{count}", String(streak));
  }

  if (streak === 0) {
    // e.g. "No streak yet — log your first mood!"
    return t("streak.none");
  }

  // e.g. "Streak: {count} • log today to keep it!"
  return t("streak.no_today").replace("{count}", String(streak));
})();
  const isBrightBg = bgMode === "happy"; // yellow background only

  const mainTextClass = isBrightBg ? "text-slate-900" : "text-white";
  const subtleTextClass = isBrightBg ? "text-slate-700" : "text-white/70";



  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center">
        <div className="text-center">
          <img
            src="/logo.jpg"
            alt="Loading RasakuYa"
            className="block w-24 h-24 md:w-28 md:h-28 mx-auto mb-4 object-contain"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const today = new Date();
  const hasMoodToday = moodEntries.some((e) => isSameDay(new Date(e.date), today));
  const showInitialVideo = true;

  return (

    <div className="relative min-h-screen overflow-x-hidden">


      {showPredictionDisclaimer && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
    {/* backdrop */}
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

    {/* card */}
    <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)] text-white">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold">
            {language === "id" ? "Info Prediksi AI" : "AI Prediction Info"}
          </p>

          <p className="mt-1 text-sm text-white/80 leading-relaxed">
            {language === "id"
              ? "Prediksi AI hanya bisa dipakai 1× per hari (berdasarkan UTC)."
              : "AI prediction can only be used 1× per day (based on UTC)."}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-white/70">
              {language === "id"
                ? `Menutup dalam ${disclaimerCountdown}...`
                : `Closing in ${disclaimerCountdown}...`}
            </span>

            <Button
              type="button"
              variant="secondary"
              className="h-8 bg-white/15 hover:bg-white/25 text-white"
              onClick={() => setShowPredictionDisclaimer(false)}
            >
              {language === "id" ? "OK" : "OK"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      {/* 🔁 White flash overlay */}
      {flashing && (
        <div
          key={Date.now()}
          className="fixed inset-0 bg-white animate-whiteflash z-[999] pointer-events-none"
        />
      )}

      {/* 🎬 Main theme video (base background) */}
      {showInitialVideo && (
        <BackgroundVideo
          src="/videos/Maintheme.mp4"
          poster="/videos/Maintheme.jpg"
          overlayClassName=""
        />
      )}

      <NeutralMoodLayer active={bgMode === "neutral"} />

      {/* 🌈 Mood-specific backgrounds – fixed so they always fill viewport */}

      {/* Happy bg (plain yellow, then trees layer on top) */}
      <div
        className={cn(
          "fixed inset-0 -z-10 bg-cover bg-center pointer-events-none transition-opacity duration-300",
          bgMode === "happy" ? "opacity-100 bg-mood-happy-plain" : "opacity-0"
        )}
        style={{ backgroundRepeat: "no-repeat" }}
      />

      {/* Angry bg */}
      <div
        className={cn(
          "fixed inset-0 -z-10 bg-cover bg-center pointer-events-none transition-opacity duration-300",
          bgMode === "angry" ? "opacity-100" : "opacity-0"
        )}
        style={{
          backgroundImage: "url('/themes/angry1.jpg')",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Sad bg */}
      <div
        className={cn(
          "fixed inset-0 -z-10 bg-cover bg-center pointer-events-none transition-opacity duration-300",
          bgMode === "sad" ? "opacity-100" : "opacity-0"
        )}
        style={{
          backgroundImage: "url('/themes/sad1.jpg')",
          backgroundRepeat: "no-repeat",
        }}
      />

       {/* Anxiety bg */}
      <div
        className={cn(
          "fixed inset-0 -z-10 bg-cover bg-center pointer-events-none transition-opacity duration-300",
          bgMode === "anxiety" ? "opacity-100" : "opacity-0"
        )}
        style={{
          // change path if you put it somewhere else
          backgroundImage: "url('/themes/anxiety1.jpg')",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* ⭐ Stars + ✨ sparkles – ONLY when sad */}
      {bgMode === "sad" && (
        <>
          <div className="sad-stars-layer" />
          <SadSparkles active />
        </>
      )}

      {/* 🌳 Trees on happy mood */}
      <HappyTreesLayer visible={bgMode === "happy"} kick={kickTrees} />

      {/* Onboarding */}
      {needsOnboarding && (
        <OnboardingOverlay open={true} onDone={() => setNeedsOnboarding(false)} />
      )}

{/* Header – glass, minimal, Genshin-ish */}
<header className="fixed inset-x-0 top-0 z-[50] pointer-events-none">
  <div className="container mx-auto px-4 pt-2">

    <div
      className="
        pointer-events-auto
        flex items-center justify-between gap-4
        rounded-2xl border border-white/15
        bg-white/5 bg-gradient-to-r from-white/15 via-white/5 to-white/15
        backdrop-blur-2xl
        px-4 py-3 md:px-6 md:py-4
        shadow-[0_18px_45px_rgba(0,0,0,0.45)]
      "
    >
      {/* Left: logo + title */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src="/logo.jpg"
            alt="RasakuYa logo"
            className="h-9 w-9 md:h-10 md:w-10 rounded-xl object-cover"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          {/* tiny glowing ring behind logo */}
          <div className="pointer-events-none absolute inset-0 rounded-xl blur-md bg-primary/40 -z-10" />
        </div>
        <div className="leading-tight">
          <h1 className="text-lg md:text-2xl font-semibold text-white tracking-wide">
            Rasaku<span className="text-primary-glow/90">Ya</span>!
          </h1>
          <p className="hidden md:block text-xs text-white/70">
            {t("header.subtitle")}
          </p>
        </div>
      </div>

      {/* Center: nav tabs */}
      <nav className="hidden md:flex items-center justify-center flex-1">
        <div className="flex items-center gap-1 rounded-full bg-black/20 px-1 py-1">
          {[
            { id: "tracker", label: t("nav.tracker"), icon: Heart },
            { id: "calendar", label: t("nav.calendar"), icon: Calendar },
            { id: "stats", label: t("nav.stats"), icon: BarChart3 },
            { id: "prediction", label: t("nav.prediction"), icon: Sparkles },
            { id: "therapist", label: t("nav.therapist"), icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon as React.ComponentType<{ className?: string }>;
            const isActive = activeTab === (tab.id as any);

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-primary/90 text-primary-foreground shadow-sm shadow-primary/50"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right: language + account */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden sm:block">
          <LanguageSelector />
        </div>
        <AccountDropdown />
      </div>
    </div>
  </div>
</header>



      {/* Main */}
      
<div className={cn("container mx-auto px-4 pt-32 pb-12 relative z-10", theme.text)}>
  



        
        <Button
  onClick={() => {
    window.location.href =
      "https://rasakuya.lemonsqueezy.com/checkout/buy/4246fb09-2b7a-4df8-b473-a6fc0efb0775"; // your real LS URL
  }}
  variant="outline"
>
  Test Payment
</Button>


        {/* Content */}
        <div className="max-w-4xl mx-auto rounded-xl space-y-8 p-2 pb-24">
          {activeTab === "tracker" && (
            <div className="space-y-6">
              <div className="flex justify-center -mb-2">
  <div
    className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs",
      theme.streakPill
    )}
  >
    <span>🔥</span>
    <span>{streakText}</span>
  </div>
</div>


              <Card className="p-6 bg-transparent border border-white/20 shadow-none backdrop-blur-0 transition-all duration-700">
                <div className="text-center mb-6">
                  <h2 className={cn("text-2xl font-semibold mb-2", theme.title)}>
  {t("tracker.title")}
</h2>


                  <div className="flex justify-center mb-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <p className={cn("mt-1", theme.muted)}>
  {t("tracker.date").replace(
    "{date}",
    selectedDate.toLocaleDateString(
      language === "id" ? "id-ID" : "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    )
  )}
</p>
                </div>

                {currentMoodEntry && !isEditingToday ? (
                  <div className="text-center space-y-4">
                    <div className="text-6xl">{currentMoodEntry.emoji}</div>
                    <p className={cn("text-lg font-medium", mainTextClass)}>
  {t("tracker.already_logged")}
</p>

                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedMood(currentMoodEntry.mood);
                          setMoodDescription(currentMoodEntry.description || "");
                          setIsEditingToday(true);
                        }}
                      >
                        {t("tracker.edit_today")}
                      </Button>
                      <Button onClick={() => setActiveTab("calendar")}>
                        {t("tracker.view_calendar")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <MoodSelector
                      selectedMood={selectedMood}
                      onMoodSelect={handleMoodSelect}
                      description={moodDescription}
                      onDescriptionChange={setMoodDescription}
                      energyLevel={energyLevel}
                      onEnergyLevelChange={setEnergyLevel}
                    />

                    {selectedMood && (
                      <div className="text-center space-y-3">
                        <Button onClick={saveMood} size="lg" className="px-8">
                          {isEditingToday ? t("tracker.update_mood") : t("tracker.save_mood")}
                        </Button>
                        {isEditingToday && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedMood(null);
                              setMoodDescription("");
                              setEnergyLevel(5);
                              setIsEditingToday(false);
                            }}
                          >
                            {t("tracker.cancel")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="space-y-6">
              <MoodCalendar
                moodEntries={moodEntries}
                onDateSelect={(dateString) => setSelectedDate(new Date(dateString))}
                selectedDate={selectedDateString}
                onMoodUpdate={loadMoodEntries}
              />
              <BottomSpacer />
            </div>
          )}

          {activeTab === "stats" && (
  <div className="space-y-6">
    {/* title as its own row, not inside a big card */}
    <div className="text-center">
      <h2 className={cn("text-2xl font-semibold", mainTextClass)}>
        {t("stats.title")}
      </h2>
    </div>

    {/* 3 separate stat cards */}
    <MoodStats moodEntries={moodEntries} />

    <div className="mt-4 h-40 md:h-56 lg:h-72 shrink-0" />
  </div>
)}


          {activeTab === "prediction" && (
            <div className="space-y-6">
              <MoodPrediction moodEntries={moodEntries} />
              {moodEntries.length < 3 && (
                <Card className="p-6 text-center">
                  <p className={cn("mb-4", subtleTextClass)}>
  {t("tracker.need_3_days")}
</p>
                  <Button onClick={() => setActiveTab("tracker")}>
                    {t("tracker.start_logging")}
                  </Button>
                </Card>
              )}
              <BottomSpacer />
            </div>
          )}

          {activeTab === "therapist" && (
            <div className="space-y-6">
              <ArunaChatTabs moodEntries={moodEntries} />
            </div>
          )}
        </div>
      </div>

      {/* 🔥 Angry fire VFX */}
      {showAngryVfx && (
        <video
          key="angry-vfx"
          className="fixed inset-0 w-full h-full object-cover z-[80] video-fire"
          src="/videos/angryvid.mp4"
          autoPlay
          muted
          playsInline
          onError={(e) => {
            console.error("🔥 Angry VFX failed to load:", e);
            setShowAngryVfx(false);
          }}
          onEnded={() => {
            setShowAngryVfx(false);
            setBgMode("angry");
          }}
        />
      )}

      {/* 😢 Sad cloud VFX (green-screen) */}
            {/* 😢 Sad cloud VFX (green-screen) */}
      {/* 😢 Sad cloud VFX (green-screen) */}
{showSadVfx && (
  <>
    {/* CLICK BLOCKER (prevents all clicks during cloud animation) */}
    <div className="fixed inset-0 z-[90] pointer-events-auto"></div>

    {/* CLOUD VIDEO */}
    <video
      key="sad-vfx"
      className={cn(
        "fixed inset-0 w-full h-full object-cover z-[89] pointer-events-none transition-opacity duration-700",
        sadBlendOn ? "opacity-80" : "opacity-100"
      )}
      src="/videos/cloudvid1.mp4"
      autoPlay
      muted
      playsInline
      style={{
        mixBlendMode: sadBlendOn ? "screen" : "normal",
      }}
      onError={(e) => {
        console.error("😢 Sad VFX failed to load:", e);
        setShowSadVfx(false);
      }}
      onEnded={() => {
        setShowSadVfx(false);
        setBgMode("sad");
      }}
    />
  </>
)}

{showAnxietyVfx && (
  <video
    key="anxiety-vfx"
    className="fixed inset-0 w-full h-full object-cover z-[20] pointer-events-none transition-opacity duration-700"
    src="/videos/fogvid.mp4"
    autoPlay
    muted
    loop
    playsInline
    style={{
      // makes black parts “disappear”, fog stays
      mixBlendMode: "screen",
      opacity: 0.9,
    }}
    onError={(e) => {
      console.error("😰 Anxiety VFX failed to load:", e);
      setShowAnxietyVfx(false);
    }}
  />
)}


      

      {/* 🎉 Confetti after saving mood */}
      <MoodVFX trigger={showVFX} onComplete={() => setShowVFX(false)} />
    </div>
  );
};




export default Index;
