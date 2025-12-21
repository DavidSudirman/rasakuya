// src/pages/Questioning.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";

const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;

type Choice = { label: string; value: string };

type Slide =
  | { type: "question"; title: string; choices: Choice[] }
  | { type: "info"; title: string; body: string }
  | { type: "cta"; title: string; body: string; ctaLabel: string };

export default function Questioning() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const slides: Slide[] = useMemo(
    () => [
      {
        type: "question",
        title: t("questioning.q1.title"),
        choices: [
          { label: t("questioning.q1.yes"), value: "yes" },
          { label: t("questioning.q1.sometimes"), value: "sometimes" },
          { label: t("questioning.q1.no"), value: "no" },
        ],
      },
      {
        type: "question",
        title: t("questioning.q2.title"),
        choices: [
          { label: t("questioning.q2.yes"), value: "yes" },
          { label: t("questioning.q2.occasionally"), value: "occasionally" },
          { label: t("questioning.q2.rarely"), value: "rarely" },
        ],
      },
      {
        type: "question",
        title: t("questioning.q3.title"),
        choices: [
          { label: t("questioning.q3.yes"), value: "yes" },
          { label: t("questioning.q3.not_really"), value: "not_really" },
          { label: t("questioning.q3.wondered"), value: "wondered" },
        ],
      },
      {
        type: "info",
        title: t("questioning.info.title"),
        body: t("questioning.info.body"),
      },
      {
        type: "cta",
        title: t("questioning.cta.title"),
        body: t("questioning.cta.body"),
        ctaLabel: t("questioning.cta.primary"),
      },
    ],
    [t]
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const current = slides[step];
  const total = slides.length;

  const canGoBack = step > 0;
  const canGoNext = current.type === "question" ? Boolean(answers[step]) : true;

  const fadeKey = `step-${step}`;

  function goNext() {
    if (!canGoNext) return;
    if (step < total - 1) setStep((s) => s + 1);
  }

  function goBack() {
    if (!canGoBack) return;
    setStep((s) => s - 1);
  }

  return (
    <div className="min-h-screen text-white">
      {/* Slower, smoother fade */}
      <style>
        {`
          @keyframes ryFadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ry-fade {
            animation: ryFadeUp 5000ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
        `}
      </style>

      {/* Background video */}
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
        <div className="absolute inset-0 bg-white/10" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="text-white/90 hover:text-white hover:bg-white/10"
            onClick={() => navigate("/auth")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("questioning.back_to_auth")}
          </Button>

          <div className="flex items-center gap-3">
            <div className="text-sm text-white/80">
              {t("questioning.step", { current: step + 1, total })}
            </div>
            <LanguageSelector />
          </div>
        </div>

        <Card className="bg-white/15 border-white/20 backdrop-blur-xl rounded-2xl p-6 md:p-10">
          {/* Progress dots */}
          <div className="flex gap-2 mb-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className={[
                  "h-2 rounded-full transition-all duration-300",
                  i === step ? "w-10 bg-white/90" : "w-2 bg-white/30",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Content */}
          <div key={fadeKey} className="ry-fade">
            {current.type === "question" && (
              <>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                  {current.title}
                </h1>
                <p className="text-white/70 mt-3">
                  {t("questioning.helper")}
                </p>

                <div className="mt-8 grid gap-3">
                  {current.choices.map((c) => {
                    const selected = answers[step] === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [step]: c.value }))
                        }
                        className={[
                          "w-full text-left rounded-xl px-4 py-4 border",
                          "backdrop-blur-sm transition-all duration-300",
                          selected
                            ? "border-white/60 bg-white/20"
                            : "border-white/20 bg-white/10 hover:bg-white/15",
                        ].join(" ")}
                      >
                        <div className="text-white font-medium">
                          {c.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {current.type === "info" && (
              <>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                  {current.title}
                </h1>
                <p className="text-white/85 mt-6 leading-relaxed">
                  {current.body}
                </p>
                <p className="text-white/70 mt-4">
                  {t("questioning.info.footer")}
                </p>
              </>
            )}

            {current.type === "cta" && (
              <>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                  {current.title}
                </h1>
                <p className="text-white/85 mt-6 leading-relaxed">
                  {current.body}
                </p>

                <div className="mt-8">
                  <Button
                    className="w-full transition-all duration-300"
                    onClick={() => navigate("/pricing")}
                  >
                    {current.ctaLabel}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full mt-3 text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300"
                    onClick={() => navigate("/")}
                  >
                    {t("questioning.cta.secondary")}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300"
              onClick={goBack}
              disabled={!canGoBack}
            >
              {t("questioning.nav.back")}
            </Button>

            {step < total - 1 && (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="transition-all duration-300"
              >
                {t("questioning.nav.next")}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
