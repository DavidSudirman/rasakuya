// src/pages/Privacy.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";

const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;

export default function Privacy() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const date = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen text-white">
      {/* ✅ Fixed background video (cannot scroll outside) */}
      <div className="fixed inset-0 -z-10">
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src={`${BASE}/videos/rasakuya-bg.mp4`} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-white/90 hover:text-white hover:bg-white/10"
            onClick={() => navigate("/auth")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("questioning.back_to_auth")}
          </Button>

          <LanguageSelector />
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            {t("privacy.title")}
          </h1>

          <p className="text-white/70 mt-2">
            {t("legal.last_updated", { date })}
          </p>

          <div className="mt-8 space-y-6 text-white/85 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacy.collect.title")}
              </h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>{t("privacy.collect.a")}</li>
                <li>{t("privacy.collect.b")}</li>
                <li>{t("privacy.collect.c")}</li>
                <li>{t("privacy.collect.d")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacy.use.title")}
              </h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>{t("privacy.use.a")}</li>
                <li>{t("privacy.use.b")}</li>
                <li>{t("privacy.use.c")}</li>
                <li>{t("privacy.use.d")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacy.ai.title")}
              </h2>
              <p className="mt-2">{t("privacy.ai.body")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacy.security.title")}
              </h2>
              <p className="mt-2">{t("privacy.security.body")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacy.sharing.title")}
              </h2>
              <p className="mt-2">{t("privacy.sharing.body")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacy.choices.title")}
              </h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>{t("privacy.choices.a")}</li>
                <li>{t("privacy.choices.b")}</li>
                <li>{t("privacy.choices.c")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacy.children.title")}
              </h2>
              <p className="mt-2">{t("privacy.children.body")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacy.changes.title")}
              </h2>
              <p className="mt-2">{t("privacy.changes.body")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("privacy.contact.title")}
              </h2>
              <p className="mt-2">
                {t("privacy.contact.body", { email: t("legal.contact_email") })}
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
