// src/pages/Pricing.tsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";

const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;

export default function Pricing() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    t("pricing.features.1"),
    t("pricing.features.2"),
    t("pricing.features.3"),
    t("pricing.features.4"),
  ];

  return (
    <div className="min-h-screen text-white">
      {/* Fixed background video */}
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
        {/* top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="text-white/90 hover:text-white hover:bg-white/10"
            onClick={() => navigate("/questioning")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("pricing.back")}
          </Button>

          <div className="text-sm text-white/80 flex items-center gap-3">
            <Link
              to="/terms"
              className="underline underline-offset-4 hover:text-white"
            >
              {t("pricing.links.terms")}
            </Link>
            <span>•</span>
            <Link
              to="/privacy"
              className="underline underline-offset-4 hover:text-white"
            >
              {t("pricing.links.privacy")}
            </Link>
            <span>•</span>
            <Link
              to="/refund"
              className="underline underline-offset-4 hover:text-white"
            >
              {t("pricing.links.refund")}
            </Link>

            <LanguageSelector />
          </div>
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            {t("pricing.page_title")}
          </h1>
          <p className="text-white/70 mt-2">{t("pricing.page_subtitle")}</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-6">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-white">
                    {t("pricing.plan.name")}
                  </div>
                  <div className="text-white/70 mt-1">
                    {t("pricing.plan.desc")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold text-white">
                    {t("pricing.plan.price")}
                  </div>
                  <div className="text-white/70 text-sm">
                    {t("pricing.plan.per_month")}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-white/90">
                {features.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="h-5 w-5 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                {/* Replace with your LemonSqueezy checkout URL later */}
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  {t("pricing.cta.pay")}
                </Button>

                <p className="text-xs text-white/70 text-center">
                  {t("pricing.notice")}{" "}
                  <Link
                    to="/terms"
                    className="underline underline-offset-4 hover:text-white"
                  >
                    {t("pricing.links.terms")}
                  </Link>{" "}
                  {t("common.and")}{" "}
                  <Link
                    to="/privacy"
                    className="underline underline-offset-4 hover:text-white"
                  >
                    {t("pricing.links.privacy")}
                  </Link>
                  .
                </p>
              </div>
            </Card>

            <div className="flex flex-col justify-center">
              <Card className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-6">
                <div className="text-lg font-semibold text-white">
                  {t("pricing.side.title")}
                </div>
                <ul className="mt-3 space-y-2 text-white/85 leading-relaxed list-disc pl-5">
                  <li>{t("pricing.side.a")}</li>
                  <li>{t("pricing.side.b")}</li>
                  <li>{t("pricing.side.c")}</li>
                  <li>{t("pricing.side.d")}</li>
                </ul>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
