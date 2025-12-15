import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Send, Bot, User, Settings, Mic, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArunaPreferences } from "./ArunaPreferences";
import { extractMemoryItems } from "@/lib/utils";
import { useAudioFeatures, type FeatureSummary } from "@/hooks/useAudioFeatures";
import { labelFromSummary, type VoiceLabels } from "@/lib/voicerules";
import { useSpeech } from "@/hooks/useSpeech";
import { useTTS } from "@/hooks/useTTS";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AITherapistProps {
  moodEntries: Array<{ date: string; mood: string; emoji: string; description?: string }>;
  sessionId?: string;
}

type VoiceGender = "auto" | "male" | "female";

type UsageInfo = {
  remaining_chats: number;
  max_chats: number;
  mood_prediction_used: boolean;
};

// Remove emojis, :shortcodes:, and URLs before TTS
function cleanForTTS(text: string) {
  const noEmoji = text
    .replace(/\p{Extended_Pictographic}|\uFE0F/gu, "")
    .replace(/:[a-z0-9_+.-]+:/gi, "");
  const noLinks = noEmoji.replace(/https?:\/\/\S+/gi, "");
  return noLinks.replace(/\s{2,}/g, " ").trim();
}

// Hide any <memory>...</memory> block from model output (still parsed & saved)
function stripMemoryBlocks(text: string) {
  return text.replace(/<memory\b[^>]*>[\s\S]*?<\/memory>/gi, "").trim();
}

// localStorage key per user+session
function messagesKey(uid: string, sid: string) {
  return `aruna-chat-${uid}-${sid || "default"}`;
}

// Use a loosely-typed client so we can hit new tables without regenerating types
const sbAny = supabase as any;

async function saveArunaMemories(userId: string, items: string[]) {
  if (!items.length) return;
  await sbAny
    .from("aruna_memories")
    .upsert(
      items.map((item) => ({ user_id: userId, item })),
      { onConflict: "user_id,item_hash", ignoreDuplicates: true } as any
    );
}

function safeParsePrefs(str: string | null | undefined): any {
  if (!str) return {};
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

export const AITherapist: React.FC<AITherapistProps> = ({
  moodEntries,
  sessionId = "default",
}) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [arunaPreferences, setArunaPreferences] = useState<string>("");

  // Voice settings loaded from preferences (read-only here)
  const [voiceOn, setVoiceOn] = useState<boolean>(false);
  const [voiceGenderPref, setVoiceGenderPref] = useState<VoiceGender>("auto");
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | undefined>(undefined);

  // Daily usage info (from aruna-usage edge function)
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Hard lock to stop double-send (fixes chat_count increments by 2)
  const inFlightRef = useRef(false);

  // ===== 🎙️ Speech-to-Text =====
  const AUTO_SEND_ON_STOP = false;
  const {
    supported: micSupported,
    isListening,
    transcript,
    error: micError,
    start: startMic,
    stop: stopMic,
    reset: resetMic,
  } = useSpeech({ language: "id-ID", continuous: true, interimResults: true });

  // ===== 🎛️ Voice feature sensor (AudioWorklet) =====
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const { start: startSensor, stop: stopSensor, finalize, summary } = useAudioFeatures();
  const [voiceLabels, setVoiceLabels] = useState<VoiceLabels | null>(null);

  // ===== 🔊 Text-to-Speech =====
  const { supported: ttsSupported, voices, speak, cancel } = useTTS();

  // show mic error
  useEffect(() => {
    if (micError) {
      toast({ title: t("therapist.error"), description: micError, variant: "destructive" });
    }
  }, [micError, toast, t]);

  // keep scrolled
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Convert summary → human-friendly labels
  useEffect(() => {
    if (!summary) return;
    setVoiceLabels(labelFromSummary(summary));
  }, [summary]);

  // On STT stop → add transcript and finalize features
  useEffect(() => {
    if (!isListening && transcript) {
      setInput((prev) => (prev ? (prev + " " + transcript).trim() : transcript));
      try { finalize(); } catch {}
      if (AUTO_SEND_ON_STOP && !loading) setTimeout(() => void sendMessage(transcript), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  // Choose a voice by gender heuristics if no specific name is chosen
  function pickVoiceByGenderFallback(langCode: string): string | undefined {
    if (!voices.length) return undefined;

    const norm = (s: string) => s.toLowerCase();
    const isMale = (v: SpeechSynthesisVoice) =>
      /(^|[^a-z])(male|man|pak|adam|indra|budi|rio|idris|brian|matt|male voice)($|[^a-z])/i.test(v.name);
    const isFemale = (v: SpeechSynthesisVoice) =>
      /(^|[^a-z])(female|woman|bu|siti|dina|gina|lisa|amy|jenny|sarah|natalie|female voice)($|[^a-z])/i.test(v.name);

    const langVoices = voices.filter(
      (v) =>
        norm(v.lang).startsWith(norm(langCode)) ||
        norm(v.lang).startsWith(norm(langCode.split("-")[0]))
    );
    const pool = langVoices.length ? langVoices : voices;

    if (voiceGenderPref === "male") return (pool.find(isMale) || pool.find((v) => /male/i.test(v.name)))?.name;
    if (voiceGenderPref === "female") return (pool.find(isFemale) || pool.find((v) => /female|fem/i.test(v.name)))?.name;

    return undefined; // auto
  }

  // Start/stop mic + sensor together
  const onMicClick = async () => {
    if (!micSupported) {
      toast({
        title: t("therapist.error"),
        description:
          language === "id"
            ? "Browser tidak mendukung pengenalan suara. Gunakan Chrome/Edge."
            : "This browser does not support speech recognition. Use Chrome/Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      stopMic();
      try { finalize(); } catch {}
      try { stopSensor(); } catch {}
      mediaStream?.getTracks().forEach((tr) => tr.stop());
      setMediaStream(null);
      return;
    }

    resetMic();
    startMic();
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      setMediaStream(ms);
      await startSensor(ms);
    } catch (e) {
      console.error("getUserMedia error", e);
      toast({ title: t("therapist.error"), description: "Mic permission failed.", variant: "destructive" });
    }
  };

  // Load preferences
  const loadArunaPreferences = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("aruna_preferences")
        .eq("user_id", user.id)
        .single();

      if (error && (error as any).code !== "PGRST116") throw error;

      const stored = (data as any)?.aruna_preferences ?? "";
      setArunaPreferences(stored);

      const prefs = safeParsePrefs(stored);
      if (typeof prefs.voiceOn === "boolean") setVoiceOn(prefs.voiceOn);
      if (prefs.voiceGender === "male" || prefs.voiceGender === "female" || prefs.voiceGender === "auto") {
        setVoiceGenderPref(prefs.voiceGender);
      }
      if (typeof prefs.voiceName === "string" || prefs.voiceName === null) {
        setSelectedVoiceName(prefs.voiceName || undefined);
      }
    } catch (err) {
      console.error("Error loading ARUNA preferences:", err);
    }
  }, [user]);

  useEffect(() => {
    void loadArunaPreferences();
  }, [loadArunaPreferences]);

  // ✅ Fetch daily usage from aruna-usage (NO manual Authorization header)
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsageInfo(null);
      return;
    }

    setUsageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("aruna-usage", { body: {} });

      if (error) {
        console.error("aruna-usage invoke error:", {
          name: error.name,
          message: error.message,
          context: (error as any)?.context,
        });
        setUsageInfo(null);
        return;
      }

      if (data?.success) {
        setUsageInfo({
          remaining_chats: data.remaining_chats,
          max_chats: data.max_chats,
          mood_prediction_used: data.mood_prediction_used,
        });
      } else {
        setUsageInfo(null);
      }
    } catch (e) {
      console.error("aruna-usage exception:", e);
      setUsageInfo(null);
    } finally {
      setUsageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchUsage();
  }, [fetchUsage]);

  // also refetch once token is ready / auth changes
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.access_token) void fetchUsage();
    });
    return () => sub.subscription.unsubscribe();
  }, [fetchUsage]);

  // per-tab, per-user message persistence
  useEffect(() => {
    if (!user) return;
    const key = messagesKey(user.id, sessionId);

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { role: "user" | "assistant"; content: string; timestamp: string }[];
        setMessages(parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }

    cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionId]);

  useEffect(() => {
    if (!user) return;
    const key = messagesKey(user.id, sessionId);
    const serializable = messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() }));
    localStorage.setItem(key, JSON.stringify(serializable));
  }, [messages, user, sessionId]);

  const getMoodContext = () => {
    const recentMoods = moodEntries.slice(-7);
    if (recentMoods.length === 0) return "User has not logged any moods yet.";

    const moodCounts = recentMoods.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const moodTranslations = {
      "sangat-bahagia": "very happy",
      bahagia: "happy",
      netral: "neutral",
      sedih: "sad",
      marah: "angry",
      cemas: "anxious",
    } as const;

    const moodSummary = Object.entries(moodCounts)
      .map(([mood, count]) => `${moodTranslations[mood as keyof typeof moodTranslations] || mood}: ${count} days`)
      .join(", ");

    const last = moodEntries.slice(-1)[0];
    const lastMood = last
      ? moodTranslations[last.mood as keyof typeof moodTranslations] || last.mood
      : "unknown";

    return `In the last 7 days, user logged moods: ${moodSummary}. Latest mood: ${lastMood}.`;
  };

  function estimateWPM(text: string, s?: FeatureSummary) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const speechSecs = s ? Math.max(1, s.durationSec * (s.voicedRatio || 0.6)) : 60;
    return Math.round((words / speechSecs) * 60);
  }

  // ✅ IMPORTANT: call edge function via invoke so JWT attaches
  // ✅ "recommended safe": always trust server usage snapshot when provided
  const callAruna = useCallback(
  async (userText: string, ctx?: { mood?: string; voice?: string }) => {
    const { data, error } = await supabase.functions.invoke("chat-openrouter", {
      body: {
        message: userText,
        history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        language,
        purpose: "companion",
        context: {
          mood: ctx?.mood || "",
          voice: ctx?.voice || "",
        },
      },
    });

    if (error) {
      const status = (error as any)?.context?.status;
      if (status === 429) throw new Error("DAILY_LIMIT_429");
      throw new Error(error.message || "Chat failed.");
    }

    if (!data?.success) throw new Error(data?.error || "Chat failed.");
    return data as { answer: string; usage?: any };
  },
  [messages, language]
);


  const sendMessage = async (override?: string) => {
    // ✅ hard-block double send
    if (inFlightRef.current) return;
    if (loading) return;

    inFlightRef.current = true;
    setLoading(true);

    // Stop current speech so replies don’t overlap
    cancel();

    try {
      const textToSend = (override ?? input).trim();
      if (!textToSend) return;

      // If we don't know usage yet, be safe and refresh
      if (!usageInfo && user) {
        await fetchUsage();
      }

      // client-side guard (server is still the source of truth)
      if (usageInfo && usageInfo.remaining_chats <= 0) {
        toast({
          title: language === "id" ? "Batas tercapai" : "Limit reached",
          description:
            language === "id"
              ? "Kamu sudah mencapai 100 pesan dengan ARUNA hari ini. Coba lagi besok ya. 💙"
              : "You’ve reached the 100-message ARUNA limit for today. Try again tomorrow. 💙",
          variant: "destructive",
        });
        return;
      }

      const userMessage: Message = { role: "user", content: textToSend, timestamp: new Date() };
      setMessages((prev) => [...prev, userMessage]);
      if (!override) setInput("");

      // ✅ Compact mood context (short)
const moodCtx = (() => {
  const recent = moodEntries.slice(-7);
  if (!recent.length) return language === "id" ? "Belum ada catatan mood." : "No mood logs yet.";
  const last = recent[recent.length - 1];
  return language === "id"
    ? `7 hari terakhir: ${recent.length} entri. Mood terakhir: ${last?.mood || "unknown"}.`
    : `Last 7 days: ${recent.length} entries. Latest mood: ${last?.mood || "unknown"}.`;
})();

// ✅ Compact voice context (ONE line only)
const voiceCtx = (() => {
  if (!summary || !voiceLabels) return "";
  const tone = voiceLabels.toneVariation || "n/a";
  const nerv = voiceLabels.nervousness || "n/a";
  return language === "id"
    ? `Suara: tone=${tone}, tegang=${nerv}.`
    : `Voice: tone=${tone}, tension=${nerv}.`;
})();

// ✅ Call ARUNA (cheap)
const result = await callAruna(textToSend, { mood: moodCtx, voice: voiceCtx });

// ✅ single reply var
const reply = result.answer ?? "…";


      // Parse + save memory locally (optional; server can also do it)
      if (user) {
        try {
          const items = extractMemoryItems(reply);
          if (items.length) await saveArunaMemories(user.id, items);
        } catch (e) {
          console.warn("Memory parse/save failed:", e);
        }
      }

      // Hide <memory> in UI
      const displayText = stripMemoryBlocks(reply);
      const assistantMessage: Message = { role: "assistant", content: displayText, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMessage]);

      // ✅ TRUST SERVER USAGE SNAPSHOT (recommended safe)
      if (result.usage) {
        setUsageInfo({
          remaining_chats: result.usage.remaining_chats,
          max_chats: result.usage.max_chats,
          mood_prediction_used: result.usage.mood_prediction_used,
        });
      } else {
        // fallback only if backend didn't send usage
        setUsageInfo((prev) =>
          prev ? { ...prev, remaining_chats: Math.max(0, prev.remaining_chats - 1) } : prev
        );
      }

      // Speak
      if (voiceOn && ttsSupported) {
        const cleaned = cleanForTTS(displayText);
        if (cleaned.length > 1) {
          const langCode = language === "id" ? "id-ID" : "en-US";
          const chosenName = selectedVoiceName ?? pickVoiceByGenderFallback(langCode);
          speak(cleaned, langCode, 1, chosenName);
        }
      }
    } catch (err: any) {
      console.error("Error sending message:", err);

      let errorMessage = t("therapist.failed_send");

      if (err?.message === "DAILY_LIMIT_429") {
        errorMessage =
          language === "id"
            ? "Batas harian ARUNA tercapai (100 pesan). Coba lagi besok ya. 💙"
            : "Daily ARUNA limit reached (100 messages). Try again tomorrow. 💙";

        // resync from server
        void fetchUsage();
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast({ title: t("therapist.error"), description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
      inFlightRef.current = false;
      if (override) resetMic();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  // cleanup
  useEffect(() => {
    return () => {
      try { stopSensor(); } catch {}
      mediaStream?.getTracks().forEach((tr) => tr.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Bot className="h-8 w-8 text-primary" />
          <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title={language === "id" ? "Pengaturan" : "Settings"}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ArunaPreferences
                onClose={() => {
                  setPreferencesOpen(false);
                  void loadArunaPreferences();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        <h2 className="text-xl font-semibold">{t("therapist.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("therapist.subtitle")}</p>
      </div>

      <div className="space-y-4">
        <div className="h-96 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("therapist.greeting")}</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.role === "user" ? (
                      <User className="h-6 w-6 text-primary" />
                    ) : (
                      <Bot className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString(language === "id" ? "id-ID" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <div className="bg-card border p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="space-y-1">
          <div className="flex gap-2 items-start">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                micSupported
                  ? language === "id"
                    ? "Tulis perasaanmu… (atau tekan 🎙️ untuk bicara)"
                    : "Type your feelings… (or tap 🎙️ to speak)"
                  : language === "id"
                  ? "Tulis perasaanmu…"
                  : "Type your feelings…"
              }
              className="min-h-[80px] resize-none flex-1"
              disabled={loading}
            />

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={onMicClick}
                variant={isListening ? "destructive" : "secondary"}
                className={isListening ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                title={
                  isListening
                    ? language === "id"
                      ? "Berhenti merekam"
                      : "Stop listening"
                    : language === "id"
                    ? "Mulai bicara"
                    : "Start listening"
                }
                disabled={loading}
              >
                {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || loading || usageLoading || (usageInfo && usageInfo.remaining_chats <= 0)}
                size="lg"
                className="px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {voiceOn
              ? language === "id"
                ? "Mode suara AKTIF (ubah di Pengaturan)."
                : "Voice mode ON (change in Settings)."
              : language === "id"
              ? "Mode suara NONAKTIF (ubah di Pengaturan)."
              : "Voice mode OFF (change in Settings)."}
          </p>

          {micSupported && (
            <p className="text-xs text-muted-foreground">
              {isListening
                ? language === "id"
                  ? "Mendengarkan… bicara sekarang."
                  : "Listening… speak now."
                : transcript
                ? language === "id"
                  ? "Teks hasil suara siap. Edit dulu atau tekan Kirim."
                  : "Transcript ready. Edit or press Send."
                : language === "id"
                ? "Klik 🎙️ untuk bicara."
                : "Click 🎙️ to speak."}
            </p>
          )}

          {usageInfo && (
            <p className="text-xs text-muted-foreground mt-1">
              {language === "id"
                ? `Batas ARUNA hari ini: ${usageInfo.max_chats - usageInfo.remaining_chats}/${usageInfo.max_chats} pesan. Prediksi mood: ${usageInfo.mood_prediction_used ? "sudah dipakai" : "belum dipakai"}.`
                : `Today's ARUNA limit: ${usageInfo.max_chats - usageInfo.remaining_chats}/${usageInfo.max_chats} messages. Mood prediction: ${usageInfo.mood_prediction_used ? "already used" : "available"}.`}
            </p>
          )}

          {summary && voiceLabels && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {voiceLabels.paceHint && (
                <span className="px-2 py-1 rounded-full bg-sky-100">Pace: {voiceLabels.paceHint}</span>
              )}
              <span className="px-2 py-1 rounded-full bg-emerald-100">Volume: {voiceLabels.volumeLevel}</span>
              <span className="px-2 py-1 rounded-full bg-violet-100">Tone: {voiceLabels.toneVariation}</span>
              <span className="px-2 py-1 rounded-full bg-amber-100">Nervousness: {voiceLabels.nervousness}</span>
              <span className="px-2 py-1 rounded bg-slate-100">Voiced: {Math.round(summary.voicedRatio * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
