import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check } from "lucide-react";

const BASE = import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL;

export default function Pricing() {
  const navigate = useNavigate();

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
            Back
          </Button>

          <div className="text-sm text-white/80">
            <Link to="/terms" className="underline underline-offset-4 hover:text-white">
              Terms
            </Link>{" "}
            •{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-white">
              Privacy
            </Link>{" "}
            •{" "}
            <Link to="/refund" className="underline underline-offset-4 hover:text-white">
              Refund
            </Link>
          </div>
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Pricing
          </h1>
          <p className="text-white/70 mt-2">
            One simple plan — full access to insights + ARUNA.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-6">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-white">RasakuYa Premium</div>
                  <div className="text-white/70 mt-1">Best for daily tracking</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold text-white">Rp 40.000</div>
                  <div className="text-white/70 text-sm">/ month</div>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-white/90">
                {[
                  "Access to RasakuYa Software",
                  "ARUNA AI companion (100 chats per day)",
                  "Access to Mood Tracker and Mood Calendar",
                  "Access to Mood Predictor (1 per day)",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="h-5 w-5 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                {/* Replace with your LemonSqueezy checkout URL later */}
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  Continue to Payment
                </Button>

                <p className="text-xs text-white/70 text-center">
                  By continuing, you agree to our{" "}
                  <Link to="/terms" className="underline underline-offset-4 hover:text-white">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="underline underline-offset-4 hover:text-white">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </Card>

            <div className="flex flex-col justify-center">
              <Card className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-6">
                <div className="text-lg font-semibold text-white">What you’ll notice</div>
                <ul className="mt-3 space-y-2 text-white/85 leading-relaxed list-disc pl-5">
                  <li>Patterns become obvious (sleep, stress, triggers)</li>
                  <li>You stop “guessing” what happened that day</li>
                  <li>ARUNA helps you reflect without feeling judged</li>
                  <li>You build a calm habit, not a chore</li>
                </ul>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
