/// <reference lib="deno.unstable" />

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * RasakuYa — chat-openrouter (non-clinical mood companion) — cost-optimized
 * - purpose: "companion" (default) | "mood_prediction"
 * - also accepts legacy "therapist" => "companion"
 * - limits: chats/day + 1 prediction/day (UTC)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// best-effort IP rate limit (edge instance local)
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const WINDOW = 60 * 1000;
const MAX_REQ = 20;

function getKey(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

function checkLimit(key: string) {
  const now = Date.now();
  const lim = rateLimits.get(key);
  if (!lim || now > lim.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + WINDOW });
    return true;
  }
  if (lim.count >= MAX_REQ) return false;
  lim.count++;
  return true;
}

const safeSlice = (s: unknown, n: number) =>
  (typeof s === "string" ? s : "").trim().slice(0, n);

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

async function ensureUsageRow(admin: any, userId: string, dateUtc: string) {
  const { error } = await admin.from("aruna_daily_usage").upsert(
    { user_id: userId, date_utc: dateUtc, chat_count: 0, mood_predictions: 0 },
    { onConflict: "user_id,date_utc", ignoreDuplicates: true },
  );
  if (error) throw error;
}

async function getDailyUsage(admin: any, userId: string, dateUtc: string) {
  const { data, error } = await admin
    .from("aruna_daily_usage")
    .select("chat_count, mood_predictions, mood_prediction_text, mood_prediction_at")
    .eq("user_id", userId)
    .eq("date_utc", dateUtc)
    .maybeSingle();

  if (error) throw error;

  return {
    chat_count: data?.chat_count ?? 0,
    mood_predictions: data?.mood_predictions ?? 0,
    mood_prediction_text: data?.mood_prediction_text ?? null,
    mood_prediction_at: data?.mood_prediction_at ?? null,
  };
}

type HistoryMsg = { role: "user" | "assistant"; content: string };

type IncomingBody = {
  message?: string;
  history?: HistoryMsg[];
  language?: "id" | "en";
  purpose?: "companion" | "mood_prediction" | "therapist";
  context?: {
    mood?: string;
    voice?: string;
  };
};

function normalizePurpose(raw: unknown): "companion" | "mood_prediction" {
  if (raw === "mood_prediction") return "mood_prediction";
  // legacy "therapist" => companion
  return "companion";
}

function normalizeLanguage(raw: unknown): "id" | "en" {
  return raw === "en" ? "en" : "id";
}

function compactUserText(text: string) {
  return text.replace(/\s{3,}/g, "  ").trim().slice(0, 1200);
}

function buildSystemPrompt(args: {
  language: "id" | "en";
  purpose: "companion" | "mood_prediction";
  userName?: string;
  styleNote?: string;
  memorySummary?: string;
}) {
  const { language, purpose, userName, styleNote, memorySummary } = args;

  const baseEN =
    `You are ARUNA 💙, a warm Indonesian-friendly mood companion inside RasakuYa.
Help the user reflect, name feelings gently, and choose one small next step.

Rules:
Reply in English only.
You are not a therapist/doctor. Do not diagnose or give medical/legal instructions.
Use soft language ("might", "could", "it seems"). Keep it short (2–5 short paragraphs).
No lists, no markdown. 0–1 emoji only if it feels natural.
If they mention self-harm or immediate danger: urge local emergency help + trusted person immediately.`;

  const baseID =
    `Kamu ARUNA 💙, pendamping suasana hati yang hangat (gaya Indonesia) di RasakuYa.
Bantu pengguna refleksi, memahami perasaan, dan memilih satu langkah kecil.

Aturan:
Jawab hanya dalam bahasa Indonesia. 
Kamu bukan terapis/dokter. Jangan mendiagnosis atau memberi instruksi medis/legal.
Pakai bahasa lembut ("mungkin", "bisa jadi"). Singkat (2–5 paragraf pendek).
Tanpa daftar, tanpa markdown. 0–1 emoji kalau pas.
Jika ada self-harm/bahaya langsung: arahkan bantuan darurat setempat + orang tepercaya segera.`;

  const modeEN =
    purpose === "mood_prediction"
      ? `Mode: mood trend estimate for tomorrow. Be gentle, not certain. Add one sentence: "This is only an estimate for self-reflection."`
      : `Mode: supportive chat. Reflect what they said and ask 1 thoughtful question.`;

  const modeID =
    purpose === "mood_prediction"
      ? `Mode: perkiraan tren mood besok. Lembut, tidak pasti. Tambahkan 1 kalimat: "Ini hanya perkiraan untuk refleksi diri."`
      : `Mode: ngobrol pendamping. Rangkum perasaan pengguna dan tanya 1 pertanyaan reflektif.`;

  const ctx: string[] = [];
  if (userName) ctx.push(language === "en" ? `User name: ${userName}` : `Nama: ${userName}`);
  if (styleNote) ctx.push(language === "en" ? `Preferred style: ${styleNote}` : `Gaya favorit: ${styleNote}`);
  if (memorySummary) ctx.push(memorySummary);

  const memRule =
    language === "en"
      ? `Only output <memory>...</memory> if user shares a stable fact useful later. If used, put ONE tag at the very end.`
      : `Hanya tulis <memory>...</memory> bila ada fakta stabil yang berguna ke depan. Jika dipakai, SATU tag di paling akhir.`;

  return `${language === "en" ? baseEN : baseID}\n${language === "en" ? modeEN : modeID}${
    ctx.length ? `\nContext: ${ctx.join(" | ")}` : ""
  }\n${memRule}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed" });

  const key = getKey(req);
  if (!checkLimit(key)) return json(429, { success: false, error: "Rate limit exceeded" });

  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { success: false, error: "Missing Bearer token" });
    }

    // Verify user from JWT (anon client)
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userRes?.user) {
      return json(401, { success: false, error: "Unauthorized", detail: userErr?.message });
    }

    const userId = userRes.user.id;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = (await req.json().catch(() => ({}))) as IncomingBody;

    const messageRaw = body?.message;
    const history = Array.isArray(body?.history) ? body.history : [];
    const language = normalizeLanguage(body?.language);
    const purpose = normalizePurpose(body?.purpose);

    if (!messageRaw || typeof messageRaw !== "string") {
      return json(400, { success: false, error: "Message is required" });
    }

    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) return json(500, { success: false, error: "Missing OPENROUTER_API_KEY" });

    const today = todayUTC();
    await ensureUsageRow(admin, userId, today);
    const usage = await getDailyUsage(admin, userId, today);

    const maxChats = 100;

    // ✅ enforce limits BEFORE calling OpenRouter
    if (purpose === "companion") {
      if (usage.chat_count >= maxChats) {
        return json(429, { success: false, error: "CHAT_LIMIT", max_chats: maxChats });
      }
    } else {
      if (usage.mood_predictions >= 1) {
        return json(429, {
          success: false,
          error: "PREDICTION_LIMIT",
          usage: {
            chat_count: usage.chat_count,
            mood_predictions: usage.mood_predictions,
            max_chats: maxChats,
            remaining_chats: Math.max(0, maxChats - usage.chat_count),
            mood_prediction_used: true,
            date_utc: today,
            mood_prediction_text: usage.mood_prediction_text,
            mood_prediction_at: usage.mood_prediction_at,
          },
        });
      }
    }

    // load user context (keep small)
    let styleNote = "";
    let memorySummary = "";
    let userName = "";

    const { data: prof, error: profErr } = await admin
      .from("profiles")
      .select("name, aruna_preferences")
      .eq("user_id", userId)
      .maybeSingle();

    if (profErr) console.warn("profiles read error:", profErr.message);
    if (prof?.name) userName = String(prof.name);

    if (prof?.aruna_preferences) {
      try {
        const raw = prof.aruna_preferences;
        const prefs = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (typeof prefs?.style === "string") styleNote = safeSlice(prefs.style, 120);
      } catch (e) {
        console.warn("aruna_preferences parse error:", String(e));
      }
    }

    // keep only 5 memories to reduce prompt bloat
    const { data: memRows, error: memErr } = await admin
      .from("aruna_memories")
      .select("item")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (memErr) console.warn("aruna_memories read error:", memErr.message);

    if (Array.isArray(memRows) && memRows.length) {
      const items = memRows.map((r) => safeSlice((r as any)?.item, 90)).filter(Boolean);
      if (items.length) {
        memorySummary =
          language === "en"
            ? `Known: ${items.join(" | ")}.`
            : `Diketahui: ${items.join(" | ")}.`;
      }
    }

    const systemPrompt = buildSystemPrompt({
      language,
      purpose,
      userName: userName || undefined,
      styleNote: styleNote || undefined,
      memorySummary: memorySummary || undefined,
    });

    const recentHistory = history
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .slice(-8)
      .map((m) => ({
        role: m.role,
        content: safeSlice(m.content, 420),
      }));

    const moodCtx = safeSlice(body?.context?.mood ?? "", 220);
    const voiceCtx = safeSlice(body?.context?.voice ?? "", 220);

    const userCore = compactUserText(messageRaw);

    const userMsg =
      purpose === "mood_prediction"
        ? (language === "en"
          ? `Give a gentle estimate for tomorrow based on recent patterns.\nUser: ${userCore}${moodCtx ? `\nMood: ${moodCtx}` : ""}${voiceCtx ? `\nVoice: ${voiceCtx}` : ""}`
          : `Beri perkiraan lembut tren mood besok berdasarkan pola terbaru.\nPengguna: ${userCore}${moodCtx ? `\nMood: ${moodCtx}` : ""}${voiceCtx ? `\nSuara: ${voiceCtx}` : ""}`)
        : (language === "en"
          ? `${userCore}${moodCtx ? `\nMood: ${moodCtx}` : ""}${voiceCtx ? `\nVoice: ${voiceCtx}` : ""}`
          : `${userCore}${moodCtx ? `\nMood: ${moodCtx}` : ""}${voiceCtx ? `\nSuara: ${voiceCtx}` : ""}`);

    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory,
      { role: "user", content: userMsg },
    ];

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://rasakuya.lovable.app/",
        "X-Title": "RasakuYa Mood Companion",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages,
        temperature: 0.6,
        max_tokens: purpose === "mood_prediction" ? 180 : 160,
        stream: false,
      }),
    });

    if (!resp.ok) {
      const errTxt = await resp.text().catch(() => "");
      console.error("OpenRouter API error:", resp.status, errTxt);
      return json(resp.status === 429 ? 429 : 500, {
        success: false,
        error: "OPENROUTER_ERROR",
        status: resp.status,
        detail: errTxt.slice(0, 1200),
      });
    }

    const data = await resp.json();
    const answer = data?.choices?.[0]?.message?.content ?? "…";

    // ✅ increment usage ONLY after success (NO RPC)
    if (purpose === "companion") {
      const { error: incErr } = await admin
        .from("aruna_daily_usage")
        .update({ chat_count: usage.chat_count + 1 })
        .eq("user_id", userId)
        .eq("date_utc", today);

      if (incErr) console.warn("chat_count update failed:", incErr.message);
    } else {
      const { error: upErr } = await admin
        .from("aruna_daily_usage")
        .update({
          mood_predictions: 1,
          mood_prediction_text: answer,
          mood_prediction_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("date_utc", today);

      if (upErr) console.warn("mood_prediction update failed:", upErr.message);
    }

    const newUsage = await getDailyUsage(admin, userId, today);

    return json(200, {
      success: true,
      answer,
      usage: {
        chat_count: newUsage.chat_count,
        mood_predictions: newUsage.mood_predictions,
        max_chats: maxChats,
        remaining_chats: Math.max(0, maxChats - newUsage.chat_count),
        mood_prediction_used: newUsage.mood_predictions >= 1,
        date_utc: today,
        mood_prediction_text: newUsage.mood_prediction_text,
        mood_prediction_at: newUsage.mood_prediction_at,
      },
    });
  } catch (e: any) {
    console.error("❌ Error in chat-openrouter:", e);

    const detail =
      typeof e?.message === "string"
        ? e.message
        : typeof e === "string"
        ? e
        : JSON.stringify(e, Object.getOwnPropertyNames(e));

    return json(500, { success: false, error: "Internal server error", detail });
  }
});
