import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;

type Choice = { label: string; value: string };

type Slide =
  | {
      type: "question";
      title: string;
      choices: Choice[];
    }
  | {
      type: "info";
      title: string;
      body: string;
    }
  | {
      type: "cta";
      title: string;
      body: string;
      ctaLabel: string;
    };

export default function Questioning() {
  const navigate = useNavigate();

  const slides: Slide[] = useMemo(
    () => [
      {
        type: "question",
        title: "Do some days feel heavier than others — without a clear reason?",
        choices: [
          { label: "Yes", value: "yes" },
          { label: "Sometimes", value: "sometimes" },
          { label: "No", value: "no" },
        ],
      },
      {
        type: "question",
        title: "Do small things sometimes change how you feel for hours?",
        choices: [
          { label: "Yes", value: "yes" },
          { label: "Occasionally", value: "occasionally" },
          { label: "Rarely", value: "rarely" },
        ],
      },
      {
        type: "question",
        title: "Have you noticed patterns, but never tracked them?",
        choices: [
          { label: "Yes", value: "yes" },
          { label: "Not really", value: "not_really" },
          { label: "I’ve wondered", value: "wondered" },
        ],
      },
      {
        type: "info",
        title: "A quick context",
        body:
          "Only ~4% of people regularly track their mood — and those who do often report much better emotional awareness and management than those who don’t.",
      },
      {
        type: "cta",
        title: "Your feelings pass — insights stay.",
        body:
          "RasakuYa helps you spot patterns, name what’s happening, and build calm, repeatable awareness — without making it clinical.",
        ctaLabel: "See Pricing & Continue Exploring Insights",
      },
    ],
    []
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const current = slides[step];
  const total = slides.length;

  const canGoBack = step > 0;
  const canGoNext = current.type === "question" ? Boolean(answers[step]) : true;

  // Used to re-trigger the fade animation on each step
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
      {/* Simple fade-in keyframes */}
      <style>
        {`
          @keyframes ryFadeUp {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ry-fade {
            animation: ryFadeUp 320ms ease-out both;
          }
        `}
      </style>

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
        {/* slightly brighter “white screen overlay” vibe */}
        <div className="absolute inset-0 bg-white/10" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        {/* top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="text-white/90 hover:text-white hover:bg-white/10"
            onClick={() => navigate("/auth")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Auth
          </Button>

          <div className="text-sm text-white/80">
            {step + 1} / {total}
          </div>
        </div>

        <Card className="bg-white/15 border-white/20 backdrop-blur-xl rounded-2xl p-6 md:p-10">
          {/* progress dots */}
          <div className="flex gap-2 mb-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className={[
                  "h-2 rounded-full transition-all",
                  i === step ? "w-10 bg-white/90" : "w-2 bg-white/30",
                ].join(" ")}
              />
            ))}
          </div>

          {/* content (fade-in wrapper) */}
          <div key={fadeKey} className="ry-fade">
            {current.type === "question" && (
              <>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                  {current.title}
                </h1>
                <p className="text-white/70 mt-3">
                  Pick the closest option — no right answer.
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
                          "w-full text-left rounded-xl px-4 py-4 border transition",
                          "backdrop-blur-sm",
                          selected
                            ? "border-white/60 bg-white/20"
                            : "border-white/20 bg-white/10 hover:bg-white/15",
                        ].join(" ")}
                      >
                        <div className="text-white font-medium">{c.label}</div>
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
                  That’s why RasakuYa is built to make tracking feel simple — and worth it.
                </p>
              </>
            )}

            {current.type === "cta" && (
              <>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                  {current.title}
                </h1>
                <p className="text-white/85 mt-6 leading-relaxed">{current.body}</p>

                <div className="mt-8">
                  <Button className="w-full" onClick={() => navigate("/pricing")}>
                    {current.ctaLabel}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full mt-3 text-white/90 hover:text-white hover:bg-white/10"
                    onClick={() => navigate("/")}
                  >
                    Continue without pricing
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* nav buttons */}
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-white/90 hover:text-white hover:bg-white/10"
              onClick={goBack}
              disabled={!canGoBack}
            >
              Back
            </Button>

            {step < total - 1 ? (
              <Button type="button" onClick={goNext} disabled={!canGoNext}>
                Next
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
