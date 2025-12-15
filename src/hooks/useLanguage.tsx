// src/hooks/useLanguage.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "id";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    "header.tagline": "Track your feelings, predict tomorrow",
    "header.greeting": "Hello, {name}!",
    "header.logout": "Logout",
    "header.subtitle": "Track your mood • Reflect with calm support",

    // Profile
    "profile.back_to_tracker": "Back to tracker",
    "profile.page_title": "Your Profile",
    "profile.section_profile": "Profile",
    "profile.name": "Name",
    "profile.name_hint": "Change your name from the Settings page if needed.",
    "profile.email": "Email",
    "profile.emoji_label": "Emoji that represents you",
    "profile.emoji_hint": "Choose 1 emoji that feels the most like you. You can change this anytime.",
    "profile.subscription": "Subscription",
    "profile.subscription_free_label": "Free Plan",
    "profile.subscription_free_desc": "basic RasakuYa features",
    "profile.subscription_button": "View plans",
    "profile.timecapsule_title": "Time Capsule",
    "profile.timecapsule_desc": "Write a short message to your future self. RasakuYa can remind you to read it later.",
    "profile.timecapsule_message_label": "Message to future you",
    "profile.timecapsule_placeholder": "Example: “I hope you’re proud of how far you’ve come.”",
    "profile.timecapsule_date_label": "Open on",
    "profile.timecapsule_save_button": "Save Time Capsule",
    "profile.name_id": "Name ID",
    "profile.name_id_hint": "This ID comes from your RasakuYa account.",

    // Monthly review
    "review.title": "How was your experience with RasakuYa this month?",
    "review.subtitle_first": "It’s the first time we’re asking for your feedback 💙",
    "review.subtitle_monthly": "We ask once a month so we can keep improving.",
    "review.placeholder": "Any suggestions, bugs, or dream features? Write here (optional)…",
    "review.send": "Send",
    "review.remind_later": "Remind me later",
    "review.never": "Don't ask again",

    // toasts
    "review.toast_need_rating_title": "Choose a rating ⭐",
    "review.toast_need_rating_desc": "Please give 1–5 stars.",
    "review.toast_thanks_title": "Thank you!",
    "review.toast_thanks_desc": "Your feedback helps RasakuYa improve.",
    "review.toast_snooze_title": "Okay!",
    "review.toast_snooze_desc": "We’ll remind you again next week.",
    "review.toast_never_title": "Understood",
    "review.toast_never_desc": "We won’t ask again.",

    // Streak pill
    "streak.with_today_one": "Streak: {count} day",
    "streak.with_today": "Streak: {count} days",
    "streak.no_today": "Streak: {count} • log today to keep it!",
    "streak.none": "No streak yet — log your first mood!",

    // Navigation
    "nav.tracker": "Tracker",
    "nav.calendar": "Calendar",
    "nav.stats": "Statistics",
    "nav.prediction": "AI Prediction",
    "nav.therapist": "AI Companion",
    "nav.payment": "Payment",

    // Account Dropdown
    "account.profile": "Profile",
    "account.settings": "Settings",
    "account.payment": "Payment Options",

    // Pricing
    "pricing.title": "Choose Your Plan",
    "pricing.subtitle": "Unlock premium features for deeper mood insights and self-reflection",
    "pricing.popular": "Popular",
    "pricing.free.name": "Free Plan",
    "pricing.free.price": "Free",
    "pricing.free.feature1": "Access to mood tracker",
    "pricing.free.feature2": "Access to mood calendar",
    "pricing.free.feature3": "Access to basic AI insights and feedback",
    "pricing.free.feature4": "Access to ARUNA AI companion",
    "pricing.free.button": "Current Plan",
    "pricing.premium.name": "Premium Plan",
    "pricing.premium.feature1": "Advanced mood reports (insights and suggestions)",
    "pricing.premium.feature2": "Customize your UI",
    "pricing.premium.feature3": "More personalized AI companions: LUMA, SAHATI",
    "pricing.premium.button": "Upgrade to Premium",

    // Mood Tracker
    "tracker.title": "Record Your Feelings Today",
    "tracker.date": "Date: {date}",
    "tracker.already_logged": "You've already logged your mood for today!",
    "tracker.edit_today": "Edit Today's Mood",
    "tracker.view_calendar": "View Mood Calendar",
    "tracker.save_mood": "Save Mood",
    "tracker.update_mood": "Update Mood",
    "tracker.cancel": "Cancel",
    "tracker.start_logging": "Start Logging Mood",
    "tracker.need_3_days": "Log moods for at least 3 days to get more accurate predictions!",
    "tracker.how_feel_today": "How are you feeling today?",
    "tracker.energy_level": "Energy Level",
    "tracker.very_tired": "Very Tired",
    "tracker.very_energetic": "Very Energetic",
    "tracker.describe_label": "Tell us more about how you feel (optional)",
    "tracker.describe_placeholder": "What made you feel this way? Any activities or events today?",

    // AI Companion (keep the keys, change the wording)
    "therapist.title": "ARUNA",
    "therapist.subtitle": "Your supportive AI mood companion",
    "therapist.greeting":
      "Hi! I'm ARUNA, your AI mood companion. I'm here to listen and help you reflect. What's on your mind today?",
    "therapist.placeholder": "Share your thoughts or feelings...",
    "therapist.service_busy": "Service Busy",
    "therapist.service_busy_desc": "The AI service is temporarily busy. Please try again in a few moments.",
    "therapist.error": "Error",
    "therapist.failed_send": "Failed to send message. Please try again.",
    "therapist.rate_limit": "Too many requests. Please wait a moment before trying again.",

    // Statistics
    "stats.title": "Mood Statistics",
    "stats.most_frequent": "Most Frequent Mood",
    "stats.positive_streak": "Positive Streak",
    "stats.week_avg": "This Week’s Average",
    "stats.days": "days",
    "stats.no_data": "No data yet",

    // Common
    "common.loading": "Loading RasakuYa!...",
    "common.error": "Error",
    "common.success": "Success",
    "mood.saved": "Mood saved!",
    "mood.saved_desc": "Mood for {date} has been saved successfully.",
    "mood.save_error": "Failed to save mood. Please try again.",
    "mood.load_error": "Failed to load mood data.",

    // Moods
    "mood.sangat-bahagia": "Very Happy",
    "mood.bahagia": "Happy",
    "mood.netral": "Neutral",
    "mood.cemas": "Anxious",
    "mood.sedih": "Sad",
    "mood.marah": "Angry",

    "mood.very_happy": "Very Happy",
    "mood.happy": "Happy",
    "mood.neutral": "Neutral",
    "mood.anxious": "Anxious",
    "mood.sad": "Sad",
    "mood.angry": "Angry",

    // AI Prediction (softened)
    "prediction.title": "RasakuYa! AI Prediction",
    "prediction.subtitle": "Estimated mood trend for tomorrow",
    "prediction.confidence": "Confidence",
    "prediction.conf_high": "High",
    "prediction.conf_med": "Medium",
    "prediction.conf_low": "Low",
    "prediction.need_more": "Need more data for an accurate estimate",
    "prediction.trend_stable": "Your mood trend looks relatively stable.",
    "prediction.msg_very_positive": "Your recent pattern suggests a very positive trend. Keep your helpful routines.",
    "prediction.msg_improving": "Your mood trend looks more positive recently.",
    "prediction.msg_positive": "Your recent pattern suggests a positive trend.",
    "prediction.msg_declining": "Your mood trend seems lower recently. Consider extra rest and self-care.",
    "prediction.msg_need_selfcare": "It might be a good time for a bit more self-care.",
    "prediction.msg_neutral": "Your mood trend may stay neutral. Try something small that feels pleasant today.",
    "prediction.ai_analysis": "AI Insights",
    "prediction.analyzing": "Analyzing mood patterns...",
    "prediction.ai_unavailable": "Insights are unavailable right now. Please try again.",
    "prediction.ai_error": "Could not generate insights. Please try again.",
    "prediction.ai_not_enough": "Not enough data for deeper insights. Log your mood more often for better patterns.",
    "prediction.footer": "Based on {count} mood entries • Average score: {avg}/5",
  },

  id: {
    // Header
    "header.tagline": "Lacak perasaanmu, prediksi hari esok",
    "header.greeting": "Halo, {name}!",
    "header.logout": "Keluar",
    "header.subtitle": "Lacak suasana hati • Refleksi dengan dukungan tenang",

    // Monthly review
    "review.title": "Bagaimana pengalamanmu dengan RasakuYa bulan ini?",
    "review.subtitle_first": "Ini pertama kalinya kami minta masukanmu 💙",
    "review.subtitle_monthly": "Kami bertanya sebulan sekali untuk terus membaik.",
    "review.placeholder": "Ada saran, bug, atau fitur impian? Tulis di sini (opsional)…",
    "review.send": "Kirim",
    "review.remind_later": "Ingatkan nanti",
    "review.never": "Jangan tanya lagi",

    "review.toast_need_rating_title": "Pilih penilaian dulu ⭐",
    "review.toast_need_rating_desc": "Beri 1–5 bintang ya.",
    "review.toast_thanks_title": "Terima kasih!",
    "review.toast_thanks_desc": "Masukanmu membantu RasakuYa jadi lebih baik.",
    "review.toast_snooze_title": "Baik!",
    "review.toast_snooze_desc": "Kita ingatkan lagi minggu depan.",
    "review.toast_never_title": "Dimengerti",
    "review.toast_never_desc": "Kami tidak akan menanyakan lagi.",

    // Profile
    "profile.back_to_tracker": "Kembali ke tracker",
    "profile.page_title": "Profil Kamu",
    "profile.section_profile": "Profil",
    "profile.name": "Nama",
    "profile.name_hint": "Ubah nama kamu dari halaman Pengaturan jika diperlukan.",
    "profile.email": "Email",
    "profile.emoji_label": "Emoji yang menggambarkan kamu",
    "profile.emoji_hint": "Pilih 1 emoji yang paling mewakili kamu. Kamu bisa mengubahnya kapan saja.",
    "profile.subscription": "Langganan",
    "profile.subscription_free_label": "Paket Gratis",
    "profile.subscription_free_desc": "fitur dasar RasakuYa",
    "profile.subscription_button": "Lihat paket",
    "profile.timecapsule_title": "Time Capsule",
    "profile.timecapsule_desc": "Tulis pesan singkat untuk dirimu di masa depan. RasakuYa bisa mengingatkanmu untuk membacanya lagi.",
    "profile.timecapsule_message_label": "Pesan untuk diri masa depan",
    "profile.timecapsule_placeholder": "Contoh: “Semoga kamu bangga dengan perjalananmu sampai di sini.”",
    "profile.timecapsule_date_label": "Buka pada",
    "profile.timecapsule_save_button": "Simpan Time Capsule",
    "profile.name_id": "Nama ID",
    "profile.name_id_hint": "ID ini diambil dari akun RasakuYa kamu.",

    // Streak pill
    "streak.with_today_one": "Streak: {count} hari",
    "streak.with_today": "Streak: {count} hari",
    "streak.no_today": "Streak: {count} • isi hari ini supaya tetap lanjut!",
    "streak.none": "Belum ada streak — mulai catat suasana hatimu!",

    // Navigation
    "nav.tracker": "Tracker",
    "nav.calendar": "Kalender",
    "nav.stats": "Statistik",
    "nav.prediction": "Prediksi AI",
    "nav.therapist": "AI Pendamping",
    "nav.payment": "Pembayaran",

    // Account Dropdown
    "account.profile": "Profil",
    "account.settings": "Pengaturan",
    "account.payment": "Opsi Pembayaran",

    // Pricing
    "pricing.title": "Pilih Paket Anda",
    "pricing.subtitle": "Buka fitur premium untuk insight mood yang lebih dalam dan refleksi diri",
    "pricing.popular": "Populer",
    "pricing.free.name": "Paket Gratis",
    "pricing.free.price": "Gratis",
    "pricing.free.feature1": "Akses ke mood tracker",
    "pricing.free.feature2": "Akses ke kalender mood",
    "pricing.free.feature3": "Akses ke insight dan feedback AI dasar",
    "pricing.free.feature4": "Akses ke ARUNA AI pendamping",
    "pricing.free.button": "Paket Saat Ini",
    "pricing.premium.name": "Paket Premium",
    "pricing.premium.feature1": "Laporan mood canggih (insight dan saran)",
    "pricing.premium.feature2": "Kustomisasi tampilan UI",
    "pricing.premium.feature3": "AI pendamping yang lebih personal: LUMA, SAHATI",
    "pricing.premium.button": "Upgrade ke Premium",

    // Mood Tracker
    "tracker.title": "Catat Perasaanmu Hari Ini",
    "tracker.date": "Tanggal: {date}",
    "tracker.already_logged": "Kamu sudah mencatat mood untuk hari ini!",
    "tracker.edit_today": "Ubah Mood Hari Ini",
    "tracker.view_calendar": "Lihat Kalender Mood",
    "tracker.save_mood": "Simpan Mood",
    "tracker.update_mood": "Update Mood",
    "tracker.cancel": "Batal",
    "tracker.start_logging": "Mulai Mencatat Mood",
    "tracker.need_3_days": "Catat mood setidaknya 3 hari untuk mendapatkan prediksi yang lebih akurat!",
    "tracker.how_feel_today": "Bagaimana perasaanmu hari ini?",
    "tracker.energy_level": "Tingkat Energi",
    "tracker.very_tired": "Sangat Lelah",
    "tracker.very_energetic": "Sangat Energik",
    "tracker.describe_label": "Ceritakan lebih detail tentang perasaanmu (opsional)",
    "tracker.describe_placeholder":
      "Apa yang membuatmu merasa seperti ini? Ceritakan aktivitas atau kejadian hari ini...",

    // AI Companion (keep keys, change text)
    "therapist.title": "ARUNA",
    "therapist.subtitle": "Pendamping AI untuk refleksi suasana hati",
    "therapist.greeting":
      "Hai! Aku ARUNA, AI pendamping suasana hatimu. Aku di sini untuk mendengarkan dan menemani kamu refleksi. Ceritakan apa yang kamu rasakan hari ini.",
    "therapist.placeholder": "Bagikan perasaan atau pikiranmu...",
    "therapist.service_busy": "Layanan Sibuk",
    "therapist.service_busy_desc": "Layanan AI sedang sibuk sementara. Silakan coba lagi dalam beberapa saat.",
    "therapist.error": "Kesalahan",
    "therapist.failed_send": "Gagal mengirim pesan. Silakan coba lagi.",
    "therapist.rate_limit": "Terlalu banyak permintaan. Silakan tunggu sebentar sebelum mencoba lagi.",

    // Statistics
    "stats.title": "Statistik Mood",
    "stats.most_frequent": "Mood Paling Sering",
    "stats.positive_streak": "Streak Positif",
    "stats.week_avg": "Rata-rata Minggu Ini",
    "stats.days": "hari",
    "stats.no_data": "Belum ada data",

    // Common
    "common.loading": "Memuat RasakuYa!...",
    "common.error": "Error",
    "common.success": "Berhasil",
    "mood.saved": "Mood tersimpan!",
    "mood.saved_desc": "Mood untuk {date} berhasil disimpan.",
    "mood.save_error": "Gagal menyimpan mood. Silakan coba lagi.",
    "mood.load_error": "Gagal memuat data mood.",

    // Moods
    "mood.sangat-bahagia": "Sangat Bahagia",
    "mood.bahagia": "Bahagia",
    "mood.netral": "Netral",
    "mood.cemas": "Cemas",
    "mood.sedih": "Sedih",
    "mood.marah": "Marah",

    "mood.very_happy": "Sangat Bahagia",
    "mood.happy": "Bahagia",
    "mood.neutral": "Netral",
    "mood.anxious": "Cemas",
    "mood.sad": "Sedih",
    "mood.angry": "Marah",

    // AI Prediction (softened)
    "prediction.title": "Prediksi AI RasakuYa!",
    "prediction.subtitle": "Perkiraan tren mood besok",
    "prediction.confidence": "Tingkat Kepercayaan",
    "prediction.conf_high": "Tinggi",
    "prediction.conf_med": "Sedang",
    "prediction.conf_low": "Rendah",
    "prediction.need_more": "Butuh lebih banyak data untuk perkiraan yang akurat",
    "prediction.trend_stable": "Tren mood kamu terlihat cukup stabil.",
    "prediction.msg_very_positive": "Pola terakhirmu menunjukkan tren yang sangat positif. Pertahankan rutinitas yang membantu.",
    "prediction.msg_improving": "Tren mood kamu terlihat lebih positif belakangan ini.",
    "prediction.msg_positive": "Pola terakhirmu menunjukkan kecenderungan yang lebih positif.",
    "prediction.msg_declining": "Tren mood belakangan ini terlihat menurun. Coba prioritaskan istirahat dan self-care.",
    "prediction.msg_need_selfcare": "Mungkin ini waktu yang pas untuk lebih banyak self-care.",
    "prediction.msg_neutral": "Tren mood mungkin tetap netral. Coba lakukan hal kecil yang terasa menyenangkan hari ini.",
    "prediction.ai_analysis": "Insight AI",
    "prediction.analyzing": "Menganalisis pola mood...",
    "prediction.ai_unavailable": "Insight sedang tidak tersedia. Coba lagi.",
    "prediction.ai_error": "Tidak dapat menghasilkan insight. Coba lagi.",
    "prediction.ai_not_enough": "Belum cukup data untuk insight yang lebih dalam. Catat mood lebih sering untuk pola yang lebih baik.",
    "prediction.footer": "Berdasarkan {count} entri mood • Skor rata-rata: {avg}/5",
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved =
      typeof window !== "undefined"
        ? (localStorage.getItem("language") as Language | null)
        : null;
    return saved || "id";
  });

  useEffect(() => {
    try {
      localStorage.setItem("language", language);
    } catch {
      // ignore
    }
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>) => {
    const map = translations[language] || {};
    let text = map[key] ?? key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
};
