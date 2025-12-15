import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

function parseHasStyle(raw?: string | null) {
  if (!raw) return false;
  try {
    const j = JSON.parse(raw);
    return typeof j?.style === "string" && j.style.trim().length > 0;
  } catch {
    return raw.trim().length > 0; // backward-compat: plain text
  }
}

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    async function run() {
      if (!user) { setChecked(true); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("has_completed_onboarding, aruna_preferences")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        // if table/columns missing, let them through rather than block
        console.warn("OnboardingGuard select error:", error);
        setChecked(true);
        return;
      }

      const row = (data ?? {}) as { has_completed_onboarding?: boolean | null; aruna_preferences?: string | null };
      const done = row?.has_completed_onboarding === true || parseHasStyle(row?.aruna_preferences);

      if (!done) {
        navigate("/onboarding", { replace: true });
        return;
      }
      setChecked(true);
    }
    run();
    return () => { active = false; };
  }, [user, navigate]);

  if (!checked) return null; // or spinner
  return <>{children}</>;
}
