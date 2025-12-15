import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type CheckResult = {
  shouldShow: boolean;
  reason: "interval" | "snooze" | "never" | "recent" | "first" | "optout";
};

const LS_LAST_PROMPT = "ry:lastReviewPromptAt";
const LS_SNOOZE_UNTIL = "ry:reviewSnoozeUntil";
const LS_OPTOUT = "ry:reviewOptOut";
const INTERVAL_DAYS = 30;  // show again after 30 days
const SNOOZE_DAYS = 7;     // remind me later → 7 days

function daysSince(dateISO?: string | null): number {
  if (!dateISO) return Number.POSITIVE_INFINITY;
  const then = new Date(dateISO).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function isBeforeNow(dateISO?: string | null) {
  if (!dateISO) return true;
  return new Date(dateISO).getTime() <= Date.now();
}

export function useMonthlyReview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);
  const [reason, setReason] = useState<CheckResult["reason"]>("first");

  const checkLocal = useCallback((): CheckResult => {
    const optOut = localStorage.getItem(LS_OPTOUT) === "1";
    if (optOut) return { shouldShow: false, reason: "optout" };

    const snoozeUntil = localStorage.getItem(LS_SNOOZE_UNTIL);
    if (snoozeUntil && !isBeforeNow(snoozeUntil)) {
      return { shouldShow: false, reason: "snooze" };
    }

    const lastPrompt = localStorage.getItem(LS_LAST_PROMPT);
    if (!lastPrompt) return { shouldShow: true, reason: "first" };

    const d = daysSince(lastPrompt);
    if (d >= INTERVAL_DAYS) return { shouldShow: true, reason: "interval" };
    return { shouldShow: false, reason: "recent" };
  }, []);

  const checkRemote = useCallback(async (): Promise<CheckResult> => {
    if (!user) return checkLocal();

    const { data, error } = await supabase
      .from("profiles")
      .select("last_review_prompt_at, review_opt_out")
      .eq("id", user.id)
      .single();

    if (error) {
      // fallback to local if profile not ready
      return checkLocal();
    }

    if (data?.review_opt_out) return { shouldShow: false, reason: "optout" };

    const snoozeUntil = localStorage.getItem(LS_SNOOZE_UNTIL);
    if (snoozeUntil && !isBeforeNow(snoozeUntil)) {
      return { shouldShow: false, reason: "snooze" };
    }

    const d = daysSince(data?.last_review_prompt_at);
    if (!data?.last_review_prompt_at) return { shouldShow: true, reason: "first" };
    if (d >= INTERVAL_DAYS) return { shouldShow: true, reason: "interval" };
    return { shouldShow: false, reason: "recent" };
  }, [user, checkLocal]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await checkRemote();
      if (!mounted) return;
      setShouldShow(res.shouldShow);
      setReason(res.reason);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [checkRemote]);

  const markPromptShown = useCallback(async () => {
    const iso = new Date().toISOString();
    localStorage.setItem(LS_LAST_PROMPT, iso);
    if (user) {
      await supabase.from("profiles")
        .update({ last_review_prompt_at: iso })
        .eq("id", user.id);
    }
  }, [user]);

  const snooze = useCallback(async () => {
    const until = new Date(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(LS_SNOOZE_UNTIL, until);
    await markPromptShown();
    setShouldShow(false);
  }, [markPromptShown]);

  const optOut = useCallback(async () => {
    localStorage.setItem(LS_OPTOUT, "1");
    await markPromptShown();
    if (user) {
      await supabase.from("profiles").update({ review_opt_out: true }).eq("id", user.id);
    }
    setShouldShow(false);
  }, [user, markPromptShown]);

  const submitReview = useCallback(
    async (rating: number, comment: string, appVersion?: string) => {
      // Save review
      await supabase.from("reviews").insert({
        user_id: user?.id ?? null,
        rating,
        comment: comment?.trim() || null,
        app_version: appVersion || null,
      });
      // Record that we prompted now
      await markPromptShown();
      // Clear snooze so the next cycle is counted from today
      localStorage.removeItem(LS_SNOOZE_UNTIL);
      setShouldShow(false);
    },
    [user, markPromptShown]
  );

  return {
    loading,
    shouldShow,
    reason,
    markPromptShown, // call once when the dialog opens
    snooze,
    optOut,
    submitReview,
  };
}