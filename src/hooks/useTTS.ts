import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Browser TTS helper using Web Speech Synthesis API.
 * - Exposes available voices
 * - Speak with optional voiceName override
 * - Cancels current speech
 */
export function useTTS() {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speakingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();

    // Some browsers populate voices async
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const cancel = useCallback(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
    speakingRef.current = false;
  }, [supported]);

  const pickVoiceByLang = useCallback(
    (lang: string) => {
      const all = voices;
      const by = (prefix: string) =>
        all.find((v) => v.lang?.toLowerCase().startsWith(prefix.toLowerCase()));
      // exact locale -> base language -> English -> first
      return by(lang) || by(lang.split("-")[0]) || by("en") || all[0];
    },
    [voices]
  );

  const findVoiceByName = useCallback(
    (voiceName?: string) => {
      if (!voiceName) return undefined;
      return voices.find((v) => v.name === voiceName);
    },
    [voices]
  );

  const chunkText = (text: string, size: number) => {
    const parts: string[] = [];
    for (let i = 0; i < text.length; i += size) parts.push(text.slice(i, i + size));
    return parts;
  };

  /**
   * Speak text in given language.
   * @param text text to speak
   * @param lang e.g. "id-ID" | "en-US"
   * @param rate 0.5..2 (1 normal)
   * @param voiceName optional exact voice name to use
   */
  const speak = useCallback(
    (text: string, lang = "id-ID", rate = 1, voiceName?: string) => {
      if (!supported || !text) return;
      cancel();

      const preferred = findVoiceByName(voiceName) || pickVoiceByLang(lang);
      const chunks = chunkText(text, 220);

      chunks.forEach((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = lang;
        u.rate = rate;
        if (preferred) u.voice = preferred;

        if (i === 0) speakingRef.current = true;
        if (i === chunks.length - 1) {
          u.onend = () => (speakingRef.current = false);
        }

        window.speechSynthesis.speak(u);
      });
    },
    [supported, cancel, findVoiceByName, pickVoiceByLang]
  );

  return { supported, voices, speak, cancel, isSpeaking: speakingRef.current };
}