// src/pages/profile.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { AccountDropdown } from "@/components/AccountDropdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";

/* ---------- Emoji selector (1 emoji, click to open picker) ---------- */

interface EmojiSelectorProps {
  value: string;
  onChange: (emoji: string) => void;
}

const EmojiSelector: React.FC<EmojiSelectorProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji); // always 1 emoji
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <div
        onClick={() => setOpen((o) => !o)}
        className="
          w-20 h-14 flex items-center justify-center text-4xl cursor-pointer
          bg-slate-900/90 border border-slate-600 rounded-2xl
          hover:bg-slate-800 transition-colors
        "
      >
        {value || "🙂"}
      </div>

      {open && (
        <div className="absolute z-50 mt-2">
          <EmojiPicker onEmojiClick={handleEmojiClick} height={360} width={320} />
        </div>
      )}
    </div>
  );
};

/* -------------------------- Profile page ---------------------------- */

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  const [emoji, setEmoji] = useState("🙂");
  const [capsuleMessage, setCapsuleMessage] = useState("");
  const [capsuleDate, setCapsuleDate] = useState("");
  const [lastMood, setLastMood] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  // redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  // fetch Name ID from Supabase profiles table
  useEffect(() => {
    const fetchProfileName = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data?.name) {
        setProfileName(data.name);
      }
    };

    fetchProfileName();
  }, [user]);

  // mood → background tint
  const moodBackgrounds: Record<string, string> = {
    happy:
      "bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_45%,#020617_100%)]",
    sad: "bg-[radial-gradient(circle_at_top,#0b1120_0%,#020617_40%,#000000_100%)]",
    anxiety:
      "bg-[radial-gradient(circle_at_top,#082f49_0%,#020617_45%,#020617_100%)]",
    calm:
      "bg-[radial-gradient(circle_at_top,#022c22_0%,#020617_45%,#000000_100%)]",
    stressed:
      "bg-[radial-gradient(circle_at_top,#450a0a_0%,#111827_50%,#020617_100%)]",
    neutral:
      "bg-[radial-gradient(circle_at_top,#111827_0%,#020617_55%,#000000_100%)]",
  };

  const bgClass =
    lastMood && moodBackgrounds[lastMood]
      ? moodBackgrounds[lastMood]
      : "bg-[radial-gradient(circle_at_top,#0b173d_0%,#020617_55%,#000000_100%)]";

  // fetch last mood once we know user
  useEffect(() => {
    const fetchLastMood = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("mood_entries")
        .select("mood")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].mood) {
        setLastMood(data[0].mood);
      }
    };

    fetchLastMood();
  }, [user]);

  if (!user) return null;

  const displayName =
    profileName ||
    (user as any)?.user_metadata?.full_name ||
    (user as any)?.user_metadata?.name ||
    (user.email ? user.email.split("@")[0] : "");

  return (
    <div className={`min-h-screen text-white ${bgClass}`}>
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* Header – like Settings: logo left, back in middle, language + account right */}
        <header className="pt-6">
          <div
            className="
              flex items-center justify-between gap-4
              rounded-2xl border border-white/10
              bg-gradient-to-r from-sky-900/80 via-slate-900/70 to-slate-900/80
              backdrop-blur-2xl
              px-4 py-3 md:px-6 md:py-4
              shadow-[0_18px_45px_rgba(0,0,0,0.65)]
            "
          >
            {/* Left: logo + tagline */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="RasakuYa logo"
                className="h-9 w-9 rounded-xl object-cover"
              />
              <div>
                <p className="font-semibold text-sm md:text-base">
                  Rasaku<span className="text-sky-300">Ya!</span>
                </p>
                <p className="text-[11px] md:text-xs text-sky-100/80">
                  {t("header.subtitle")}
                </p>
              </div>
            </div>

            {/* Middle: back button */}
            <div className="hidden md:flex justify-center flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="
                  rounded-full px-4 py-1 text-xs md:text-sm
                  bg-slate-900/80 hover:bg-slate-800
                  border border-white/10 text-slate-50
                "
                onClick={() => navigate("/")}
              >
                ← {t("profile.back_to_tracker")}
              </Button>
            </div>

            {/* Right: language + account */}
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <AccountDropdown />
            </div>
          </div>
        </header>

        {/* Page title */}
        <h1 className="mt-10 text-2xl md:text-3xl font-semibold text-white">
          {t("profile.page_title")}
        </h1>

        {/* Body */}
        <main className="mt-6 flex justify-center">
          <div className="w-full max-w-3xl space-y-6">
            {/* Profile summary card */}
            <Card className="bg-slate-950/85 border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl text-white">
                  {t("profile.section_profile")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name ID – read-only, white */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-slate-100">
                    {t("profile.name_id")}
                  </Label>
                  <p className="text-lg font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-200/80">
                    {t("profile.name_id_hint")}
                  </p>
                </div>

                {/* Emoji section – text, then picker below */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-100">
                    {t("profile.emoji_label")}
                  </Label>
                  <p className="text-xs text-slate-200/80">
                    {t("profile.emoji_hint")}
                  </p>
                  <EmojiSelector value={emoji} onChange={setEmoji} />
                </div>

                {/* Subscription */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-slate-100">
                    {t("profile.subscription")}
                  </Label>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm md:text-base text-slate-50">
                      <span className="font-semibold">
                        {t("profile.subscription_free_label")}
                      </span>{" "}
                      · {t("profile.subscription_free_desc")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-sky-400/70 text-sky-200 bg-sky-500/10 hover:bg-sky-500/20"
                    >
                      {t("profile.subscription_button")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time capsule card (unchanged logic, but white text) */}
            <Card className="bg-slate-950/85 border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl text-white">
                  {t("profile.timecapsule_title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-100/90">
                  {t("profile.timecapsule_desc")}
                </p>

                <div className="space-y-1.5">
                  <Label className="text-sm text-slate-100">
                    {t("profile.timecapsule_message_label")}
                  </Label>
                  <textarea
                    className="
                      w-full min-h-[120px] rounded-xl
                      bg-slate-900/90 border border-slate-600
                      px-3 py-2 text-sm text-white
                      focus:outline-none focus:ring-2 focus:ring-sky-500/60
                    "
                    placeholder={t("profile.timecapsule_placeholder")}
                    value={capsuleMessage}
                    onChange={(e) => setCapsuleMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 max-w-xs">
                  <Label className="text-sm text-slate-100">
                    {t("profile.timecapsule_date_label")}
                  </Label>
                  <Input
                    type="date"
                    value={capsuleDate}
                    onChange={(e) => setCapsuleDate(e.target.value)}
                    className="bg-slate-900/90 border-slate-600 text-white"
                  />
                </div>

                <Button className="w-full bg-sky-500 hover:bg-sky-600">
                  {t("profile.timecapsule_save_button")}
                  {/* TODO: connect to Supabase later */}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
