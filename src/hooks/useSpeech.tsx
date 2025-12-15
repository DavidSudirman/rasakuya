import { useCallback, useEffect, useRef, useState } from "react";

type UseSpeechOptions = {
  language?: string;          // e.g., "id-ID" or "en-US"
  continuous?: boolean;       // keep listening until stop()
  interimResults?: boolean;   // show partial words while speaking
  maxAlternatives?: number;
};

export function useSpeech(options?: UseSpeechOptions) {
  const {
    language = "id-ID",
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
  } = options || {};

  const [supported, setSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef<string>(""); // collects final results
  const interimRef = useRef<string>(""); // collects interim

  // init recognition
  useEffect(() => {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec: SpeechRecognition = new SR();
    rec.lang = language;
    rec.continuous = continuous;
    rec.interimResults = interimResults;
    rec.maxAlternatives = maxAlternatives;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      interimRef.current = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalRef.current += res + " ";
        } else {
          interimRef.current += res;
        }
      }
      // show final + interim
      setTranscript((finalRef.current + interimRef.current).trim());
    };

    rec.onerror = (e: any) => {
      setError(e?.error || "speech-error");
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        rec.stop();
      } catch {}
      recognitionRef.current = null;
    };
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    finalRef.current = "";
    interimRef.current = "";
    setTranscript("");
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // start throws if already started
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    interimRef.current = "";
    setTranscript("");
    setError(null);
  }, []);

  return {
    supported,
    isListening,
    transcript, // final + interim
    error,
    start,
    stop,
    reset,
  };
}