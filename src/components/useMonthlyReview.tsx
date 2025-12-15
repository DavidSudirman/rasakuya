import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Reason = "first" | "monthly" | null;

type State = {
  firstLoginAt: Date | null;
  lastPromptAt: Date | null;
  snoozedUntil: Date | null;
  optedOut: boolean;
};

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export const useMonthlyReview = () => {
  const { user, loading: authLoading } = useAuth(); // adjust if your hook is different
  const [loading, setLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);
  const [reason, setReason] = useState<Reason>(null);

  const [state, setState] = useState<State>({
    firstLoginAt: null,
    lastPromptAt: null,
    snoozedUntil: null,
    optedOut: false,
  });

  // Load state from Supabase once the user is known
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // no logged-in user -> never show
      setLoading(false);
      setShouldShow(false);
      setReason(null);
      return;
    }

    let cancelled = false;

    const loadState = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("monthly_review_state")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const now = new Date();

      const firstLoginAt = data?.first_login_at
        ? new Date(data.first_login_at)
        : new Date(user.created_at ?? now.toISOString());

      const lastPromptAt = data?.last_prompt_at ? new Date(data.last_prompt_at) : null;
      const snoozedUntil = data?.snoozed_until ? new Date(data.snoozed_until) : null;
      const optedOut = data?.opted_out ?? false;

      setState({
        firstLoginAt,
        lastPromptAt,
        snoozedUntil,
        optedOut,
      });

      // Decide if we should show now
      let show = false;
      let why: Reason = null;

      if (!optedOut) {
        const base = lastPromptAt ?? firstLoginAt; // on first time, base = first login
        const dueDate = addMonths(base, 1);        // +1 month
        const snoozeOk = !snoozedUntil || now >= snoozedUntil;

        if (now >= dueDate && snoozeOk) {
          show = true;
          why = lastPromptAt ? "monthly" : "first";
        }
      }

      setShouldShow(show);
      setReason(why);
      setLoading(false);
    };

    loadState();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const markPromptShown = useCallback(async () => {
    if (!user) return;

    const nowIso = new Date().toISOString();

    await supabase.from("monthly_review_state").upsert(
      {
        user_id: user.id,
        first_login_at: state.firstLoginAt?.toISOString() ?? nowIso,
        last_prompt_at: nowIso,
      },
      { onConflict: "user_id" }
    );

    setState((prev) => ({ ...prev, lastPromptAt: new Date(nowIso) }));
    // we don't force close here; component manages open/close
  }, [user, state.firstLoginAt]);

  const snooze = useCallback(async () => {
    if (!user) return;

    const until = new Date();
    until.setDate(until.getDate() + 7); // 7 days snooze

    await supabase.from("monthly_review_state").upsert({
      user_id: user.id,
      snoozed_until: until.toISOString(),
    });

    setState((prev) => ({ ...prev, snoozedUntil: until }));
    setShouldShow(false);
  }, [user]);

  const optOut = useCallback(async () => {
    if (!user) return;

    await supabase.from("monthly_review_state").upsert({
      user_id: user.id,
      opted_out: true,
    });

    setState((prev) => ({ ...prev, optedOut: true }));
    setShouldShow(false);
  }, [user]);

  const submitReview = useCallback(
    async (rating: number, comment: string, appVersion?: string) => {
      if (!user) return;

      await supabase.from("monthly_reviews").insert({
        user_id: user.id,
        rating,
        comment,
        app_version: appVersion ?? null,
      });
    },
    [user]
  );

  return {
    loading: authLoading || loading,
    shouldShow,
    reason,
    markPromptShown,
    snooze,
    optOut,
    submitReview,
  };
};