import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";

/* ================= TYPES ================= */

interface MoodEntry {
  date: string;
  mood: string;
  emoji: string;
  description?: string;
}

interface MoodPredictionProps {
  moodEntries: MoodEntry[];
}

type UsageInfo = {
  remaining_chats: number;
  max_chats: number;
  mood_prediction_used: boolean;
  mood_prediction_text?: string | null;
  mood_prediction_at?: string | null;
};

/* ================= HELPERS ================= */

// Hide <memory> blocks from UI (but they stay stored server-side)
function stripMemoryBlocks(text: string) {
  return text.replace(/<memory\b[^>]*>[\s\S]*?<\/memory>/gi, "").trim();
}

/* ================= COMPONENT ================= */

export const MoodPrediction: React.FC<MoodPredictionProps> = ({
  moodEntries,
}) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [aiReasoning, setAiReasoning] = useState("");
  const [loadingReasoning, setLoadingReasoning] = useState(false);

  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  /* ================= TREND LOGIC ================= */

  const trendInfo = useMemo(() => {
    if (moodEntries.length < 3) {
      return {
        prediction: "😊",
        confidence: t("prediction.conf_low"),
        message: t("prediction.need_more"),
        trend: "stable" as const,
        average: null as number | null,
      };
    }

    const recent = moodEntries.slice(-7);
    const moodScores = recent.map((e) => {
      switch (e.mood) {
        case "sangat-bahagia":
          return 5;
        case "bahagia":
          return 4;
        case "netral":
          return 3;
        case "cemas":
          return 2.5;
        case "sedih":
          return 2;
        case "marah":
          return 1;
        default:
          return 3;
      }
    });

    const recentAvg =
      moodScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg =
      moodScores.slice(0, -3).reduce((a, b) => a + b, 0) /
        (moodScores.length - 3) || recentAvg;

    let trend: "stable" | "improving" | "declining" = "stable";
    let prediction = "😊";
    let confidence = t("prediction.conf_med");
    let message = t("prediction.trend_stable");

    if (recentAvg > olderAvg + 0.5) trend = "improving";
    else if (recentAvg < olderAvg - 0.5) trend = "declining";

    if (recentAvg > 4) {
      prediction = "😄";
      message = t("prediction.msg_very_positive");
      confidence = t("prediction.conf_high");
    } else if (recentAvg > 3.5) {
      prediction = "😊";
      message =
        trend === "improving"
          ? t("prediction.msg_improving")
          : t("prediction.msg_positive");
    } else if (recentAvg < 2.5) {
      prediction = "😔";
      message =
        trend === "declining"
          ? t("prediction.msg_declining")
          : t("prediction.msg_need_selfcare");
    } else if (recentAvg < 3) {
      prediction = "😐";
      message = t("prediction.msg_neutral");
    }

    return { prediction, confidence, message, trend, average: recentAvg };
  }, [moodEntries, t]);

  const getTrendIcon = () => {
    if (trendInfo.trend === "improving")
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (trendInfo.trend === "declining")
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-blue-400" />;
  };

  /* ================= USAGE FETCH ================= */

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsageInfo(null);
      setUsageLoading(false);
      return;
    }

    setUsageLoading(true);
    setUsageError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "aruna-usage",
        { body: {} }
      );

      if (error) throw error;

      if (data?.success) {
        setUsageInfo({
          remaining_chats: data.remaining_chats,
          max_chats: data.max_chats,
          mood_prediction_used: data.mood_prediction_used,
          mood_prediction_text: data.mood_prediction_text ?? null,
          mood_prediction_at: data.mood_prediction_at ?? null,
        });
      }
    } catch (e: any) {
      setUsageError(e.message || "USAGE_FAILED");
      setUsageInfo(null);
    } finally {
      setUsageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.access_token) void fetchUsage();
    });
    return () => sub.subscription.unsubscribe();
  }, [fetchUsage]);

  /* ================= RESTORE TODAY’S PREDICTION ================= */

  useEffect(() => {
    if (
      usageInfo?.mood_prediction_used &&
      usageInfo.mood_prediction_text
    ) {
      setAiReasoning(
        stripMemoryBlocks(usageInfo.mood_prediction_text)
      );
    }
  }, [usageInfo]);

  /* ================= GENERATE AI ================= */

  const generateAIReasoning = async () => {
    if (!user || !usageInfo) return;

    if (usageInfo.mood_prediction_used) {
      toast({
        title: language === "id" ? "Batas tercapai" : "Limit reached",
        description:
          language === "id"
            ? "Prediksi mood AI hanya bisa sekali per hari."
            : "AI mood prediction is limited to once per day.",
        variant: "destructive",
      });
      return;
    }

    if (moodEntries.length < 3) {
      setAiReasoning(t("prediction.ai_not_enough"));
      return;
    }

    setLoadingReasoning(true);

    try {
      const moodContext = moodEntries
        .slice(-7)
        .map(
          (e) =>
            `${e.date}: ${e.mood}${
              e.description ? ` - ${e.description}` : ""
            }`
        )
        .join("\n");

      const prompt =
        language === "en"
          ? `Analyze these mood entries and explain tomorrow's mood prediction concisely (max 3 sentences).\n\n${moodContext}`
          : `Analisis entri mood ini dan jelaskan prediksi mood besok secara singkat (maks 3 kalimat).\n\n${moodContext}`;

      const { data, error } = await supabase.functions.invoke(
        "chat-openrouter",
        {
          body: {
            message: prompt,
            history: [],
            language,
            purpose: "mood_prediction",
          },
        }
      );

      if (error) throw error;

      const cleaned = stripMemoryBlocks(data.answer ?? "");
      setAiReasoning(cleaned);

      // ✅ TRUST SERVER SNAPSHOT
      setUsageInfo({
        remaining_chats: data.usage.remaining_chats,
        max_chats: data.usage.max_chats,
        mood_prediction_used: true,
        mood_prediction_text: data.answer,
        mood_prediction_at: new Date().toISOString(),
      });
    } catch {
      setAiReasoning(t("prediction.ai_error"));
      void fetchUsage();
    } finally {
      setLoadingReasoning(false);
    }
  };

  const aiButtonDisabled =
    loadingReasoning ||
    usageLoading ||
    !usageInfo ||
    usageInfo.mood_prediction_used;

  /* ================= UI ================= */

  return (
    <Card className="p-6 bg-gradient-calm text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/20 rounded-full">
          <Brain className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">
          {t("prediction.title")}
        </h3>
        <Sparkles className="h-4 w-4" />
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">
            {trendInfo.prediction}
          </div>
          <p className="text-sm opacity-90">
            {t("prediction.subtitle")}
          </p>
        </div>

        <div className="flex items-start gap-2">
          {getTrendIcon()}
          <p className="text-sm opacity-90">
            {trendInfo.message}
          </p>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              {t("prediction.ai_analysis")}
            </h4>

            <Button
              variant="ghost"
              size="sm"
              onClick={generateAIReasoning}
              disabled={aiButtonDisabled}
              className="text-white hover:bg-white/20 h-6 px-2"
            >
              <RefreshCw
                className={`h-3 w-3 ${
                  loadingReasoning ? "animate-spin" : ""
                }`}
              />
            </Button>
          </div>

          <p className="text-sm opacity-90 leading-relaxed">
            {loadingReasoning
              ? t("prediction.analyzing")
              : aiReasoning}
          </p>
        </div>
      </div>
    </Card>
  );
};
