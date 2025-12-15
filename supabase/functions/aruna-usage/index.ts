/// <reference lib="deno.unstable" />

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed" });

  try {
    const authHeader =
      req.headers.get("authorization") ||
      req.headers.get("Authorization") ||
      "";

    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { success: false, error: "Missing Bearer token" });
    }

    // ✅ Verify user from JWT (anon client)
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userRes?.user) {
      return json(401, { success: false, error: "Unauthorized", detail: userErr?.message });
    }

    const userId = userRes.user.id;
    const today = todayUTC();

    // ✅ Service role for DB
    const supabase = createClient(supabaseUrl, serviceKey);

    // ✅ Ensure row exists WITHOUT resetting existing counts
    const up = await supabase
      .from("aruna_daily_usage")
      .upsert(
        { user_id: userId, date_utc: today, chat_count: 0, mood_predictions: 0 },
        { onConflict: "user_id,date_utc", ignoreDuplicates: true }
      );

    if (up.error) {
      return json(500, { success: false, error: "DB upsert failed", detail: up.error.message });
    }

    const { data, error } = await supabase
      .from("aruna_daily_usage")
      .select("chat_count, mood_predictions, mood_prediction_text, mood_prediction_at")
      .eq("user_id", userId)
      .eq("date_utc", today)
      .maybeSingle();

    if (error) {
      return json(500, { success: false, error: "DB read failed", detail: error.message });
    }

    const chatCount = data?.chat_count ?? 0;
    const moodPreds = data?.mood_predictions ?? 0;

    const maxChats = 100;
    const remainingChats = Math.max(0, maxChats - chatCount);

    return json(200, {
      success: true,
      chat_count: chatCount,
      remaining_chats: remainingChats,
      mood_predictions: moodPreds,
      mood_prediction_used: moodPreds >= 1,
      max_chats: maxChats,
      date_utc: today,

      // ✅ NEW: so client can display today's prediction after reload
      mood_prediction_text: data?.mood_prediction_text ?? null,
      mood_prediction_at: data?.mood_prediction_at ?? null,
    });
  } catch (e) {
    return json(500, { success: false, error: "Internal server error", detail: String(e) });
  }
});
