// src/pages/Terms.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";

const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;

export default function Terms() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const date = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen text-white">
      {/* Background */}
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

      {/* Content */}
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
            {t("terms.title")}
          </h1>

          <p className="text-white/70 mt-2">
            {t("legal.last_updated", { date })}
          </p>

          <div className="mt-8 space-y-6 text-white/85 leading-relaxed">
            {/* 1. About */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.about.title")}
              </h2>
              <p className="mt-2">{t("terms.about.body")}</p>
            </section>

            {/* 2. Operator / Legal Entity (REQUIRED by Paddle) */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.operator.title")}
              </h2>
              <p className="mt-2">
                {t("terms.operator.body", {
                  operator: t("legal.operator_name"),
                  brand: t("legal.brand_name"),
                })}
              </p>
            </section>

            {/* 3. Not Medical */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.not_medical.title")}
              </h2>
              <p className="mt-2">{t("terms.not_medical.body")}</p>
            </section>

            {/* 4. Eligibility */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.eligibility.title")}
              </h2>
              <p className="mt-2">{t("terms.eligibility.body")}</p>
            </section>

            {/* 5. Account */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.account.title")}
              </h2>
              <p className="mt-2">{t("terms.account.body")}</p>
            </section>

            {/* 6. Acceptable Use */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.use.title")}
              </h2>
              <p className="mt-2">{t("terms.use.body")}</p>
            </section>

            {/* 7. AI Limitations */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.ai.title")}
              </h2>
              <p className="mt-2">{t("terms.ai.body")}</p>
            </section>

            {/* 8. Billing */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.billing.title")}
              </h2>
              <p className="mt-2">{t("terms.billing.body")}</p>
            </section>

            {/* 9. Refunds */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.refunds.title")}
              </h2>
              <p className="mt-2">{t("terms.refunds.body")}</p>
            </section>

            {/* 10. Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.privacy.title")}
              </h2>
              <p className="mt-2">{t("terms.privacy.body")}</p>
            </section>

            {/* 11. Changes */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.changes.title")}
              </h2>
              <p className="mt-2">{t("terms.changes.body")}</p>
            </section>

            {/* 12. Contact */}
            <section>
              <h2 className="text-xl font-semibold text-white">
                {t("terms.contact.title")}
              </h2>
              <p className="mt-2">
                {t("terms.contact.body", {
                  email: t("legal.contact_email"),
                })}
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
