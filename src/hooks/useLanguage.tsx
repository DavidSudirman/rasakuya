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

    "common.and": "and",

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

    

    // Questioning
"questioning.back_to_auth": "Back to Auth",
"questioning.step": "{current} / {total}",
"questioning.helper": "Pick the closest option — no right answer.",
"questioning.info.footer": "That’s why RasakuYa is built to make tracking feel simple — and worth it.",
"questioning.cta.primary": "See Pricing & Continue Exploring Insights",
"questioning.cta.secondary": "Continue without pricing",
"questioning.nav.back": "Back",
"questioning.nav.next": "Next",

"questioning.q1.title": "Do some days feel heavier than others — without a clear reason?",
"questioning.q1.yes": "Yes",
"questioning.q1.sometimes": "Sometimes",
"questioning.q1.no": "No",

"questioning.q2.title": "Do small things sometimes change how you feel for hours?",
"questioning.q2.yes": "Yes",
"questioning.q2.occasionally": "Occasionally",
"questioning.q2.rarely": "Rarely",

"questioning.q3.title": "Have you noticed patterns, but never tracked them?",
"questioning.q3.yes": "Yes",
"questioning.q3.not_really": "Not really",
"questioning.q3.wondered": "I’ve wondered",

"questioning.info.title": "A quick context",
"questioning.info.body":
  "Only ~4% of people regularly track their mood — and those who do often report much better emotional awareness and management than those who don’t.",
"questioning.cta.title": "Your feelings pass — insights stay.",
"questioning.cta.body":
  "RasakuYa helps you spot patterns, name what’s happening, and build calm, repeatable awareness — without making it clinical.",

// Legal common
"legal.last_updated": "Last updated: {date}",
"legal.contact_email": "rasakuyaa@gmail.com",

// Terms
"terms.title": "Terms of Service",
"terms.about.title": "1. About RasakuYa",
"terms.about.body":
  "RasakuYa is a mood tracking and wellbeing companion app. It helps you log emotions, reflect on patterns, and access AI-powered supportive conversations for self-reflection and general wellbeing.",
"terms.not_medical.title": "2. Not Medical Advice",
"terms.not_medical.body":
  "RasakuYa is not a medical service and does not provide diagnosis, treatment, or clinical therapy. If you are in crisis, consider reaching out to local emergency services or a qualified professional.",
"terms.eligibility.title": "3. Eligibility",
"terms.eligibility.body":
  "You must be able to form a legally binding agreement in your jurisdiction to use RasakuYa. If you are under the age of majority, use RasakuYa with permission from a parent or guardian.",
"terms.account.title": "4. Account and Security",
"terms.account.body":
  "You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account.",
"terms.use.title": "5. Acceptable Use",
"terms.use.body":
  "You agree not to misuse RasakuYa, including attempting to disrupt the service, bypass limits, reverse engineer, scrape, or use it for illegal or harmful activity.",
"terms.ai.title": "6. AI Features",
"terms.ai.body":
  "Some features generate responses using AI. Outputs may be inaccurate or incomplete. Use your judgment and do not rely on AI output as professional advice.",
"terms.billing.title": "7. Subscriptions and Billing",
"terms.billing.body":
  "If you purchase a subscription, you authorize billing according to the plan selected. Pricing, features, and limits may change over time and will be shown on our pricing page and/or in-app.",
"terms.refunds.title": "8. Refunds",
"terms.refunds.body":
  "Refund rules are described in our Refund Policy. In case of conflict, the Refund Policy controls for refund decisions.",
"terms.privacy.title": "9. Privacy",
"terms.privacy.body":
  "Our Privacy Policy explains how we collect, use, and protect information.",
"terms.changes.title": "10. Changes to These Terms",
"terms.changes.body":
  "We may update these Terms from time to time. Continued use after changes become effective means you accept the updated Terms.",
"terms.contact.title": "11. Contact",
"terms.contact.body": "Questions? Contact us at {email}",

// Privacy
"privacy.title": "Privacy Policy",
"privacy.collect.title": "1. What We Collect",
"privacy.collect.a": "Account data (email, user ID, profile name)",
"privacy.collect.b": "Mood entries (mood, notes, dates, optional metadata)",
"privacy.collect.c": "Usage data (basic analytics and error logs)",
"privacy.collect.d": "AI chat content if you use AI features",
"privacy.use.title": "2. How We Use Data",
"privacy.use.a": "To provide and improve RasakuYa",
"privacy.use.b": "To show mood history and insights",
"privacy.use.c": "To operate AI features on request",
"privacy.use.d": "For security and fraud prevention",
"privacy.ai.title": "3. AI Processing",
"privacy.ai.body":
  "Some input may be processed by AI service providers to generate responses. Only required data is sent.",
"privacy.security.title": "4. Data Storage & Security",
"privacy.security.body":
  "Data is stored securely using Supabase infrastructure. No system is guaranteed to be 100% secure.",
"privacy.sharing.title": "5. Sharing",
"privacy.sharing.body":
  "We do not sell personal data. We only share data with essential service providers (hosting, AI, payments).",
"privacy.choices.title": "6. Your Choices",
"privacy.choices.a": "Edit or delete mood entries",
"privacy.choices.b": "Request account deletion",
"privacy.choices.c": "Disable AI features at any time",
"privacy.children.title": "7. Children",
"privacy.children.body": "RasakuYa is not intended for children under 13.",
"privacy.changes.title": "8. Changes",
"privacy.changes.body":
  "Continued use after updates means acceptance of changes.",
"privacy.contact.title": "9. Contact",
"privacy.contact.body": "Contact: {email}",

// Refund
"refund.title": "Refund Policy",
"refund.overview.title": "1. Overview",
"refund.overview.body":
  "RasakuYa is a digital subscription service. By purchasing a plan, you receive immediate access to premium features and content.",
"refund.subscriptions.title": "2. Subscription Payments",
"refund.subscriptions.body":
  "Payments are billed in advance on a monthly basis. Once a billing period begins, it cannot be partially refunded.",
"refund.eligibility.title": "3. Refund Eligibility",
"refund.eligibility.body":
  "Because RasakuYa provides instant digital access, refunds are generally not offered after a subscription has started, except where required by law.",
"refund.exceptions.title": "4. Exceptional Cases",
"refund.exceptions.body": "We may consider refunds on a case-by-case basis for issues such as:",
"refund.exceptions.a": "Accidental duplicate charges",
"refund.exceptions.b": "Technical errors preventing access to paid features",
"refund.exceptions.c": "Billing issues caused by our payment provider",
"refund.request.title": "5. How to Request a Refund",
"refund.request.body":
  "To request a refund review, contact us at {email} with your account email and payment details.",
"refund.cancel.title": "6. Subscription Cancellation",
"refund.cancel.body":
  "You may cancel your subscription at any time. Cancellation stops future billing but does not refund the current billing period.",
"refund.changes.title": "7. Changes to This Policy",
"refund.changes.body":
  "We may update this Refund Policy from time to time. Continued use of RasakuYa after changes means you accept the updated policy.",
"refund.contact.title": "8. Contact",
"refund.contact.body": "Questions about refunds? Contact us at {email}",

// Pricing page text (your custom pricing page)
"pricing.page_title": "Pricing",
"pricing.page_subtitle": "One simple plan — full access to insights + ARUNA.",
"pricing.back": "Back",
"pricing.links.terms": "Terms",
"pricing.links.privacy": "Privacy",
"pricing.links.refund": "Refund",
"pricing.plan.name": "RasakuYa Premium",
"pricing.plan.desc": "Best for daily tracking",
"pricing.plan.price": "USD $2.40",
"pricing.plan.per_month": "/ month",
"pricing.features.1": "Access to RasakuYa Software",
"pricing.features.2": "ARUNA AI companion (100 chats per day)",
"pricing.features.3": "Access to Mood Tracker and Mood Calendar",
"pricing.features.4": "Access to Mood Predictor (1 per day)",
"pricing.cta.pay": "Continue to Payment",
"pricing.notice":
  "By continuing, you agree to our Terms and Privacy Policy.",
"pricing.side.title": "What you’ll notice",
"pricing.side.a": "Patterns become obvious (sleep, stress, triggers)",
"pricing.side.b": "You stop “guessing” what happened that day",
"pricing.side.c": "ARUNA helps you reflect without feeling judged",
"pricing.side.d": "You build a calm habit, not a chore",


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

    "common.and": "dan",

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

    // Questioning
"questioning.back_to_auth": "Kembali ke Auth",
"questioning.step": "{current} / {total}",
"questioning.helper": "Pilih yang paling mendekati — tidak ada jawaban benar/salah.",
"questioning.info.footer":
  "Itulah kenapa RasakuYa dibuat supaya tracking terasa mudah — dan terasa berguna.",
"questioning.cta.primary": "Lihat Harga & Lanjut Eksplor Insight",
"questioning.cta.secondary": "Lanjut tanpa lihat harga",
"questioning.nav.back": "Kembali",
"questioning.nav.next": "Lanjut",

"questioning.q1.title": "Apakah ada hari yang terasa lebih berat — tanpa alasan yang jelas?",
"questioning.q1.yes": "Ya",
"questioning.q1.sometimes": "Kadang-kadang",
"questioning.q1.no": "Tidak",

"questioning.q2.title": "Apakah hal kecil kadang bisa mengubah perasaanmu berjam-jam?",
"questioning.q2.yes": "Ya",
"questioning.q2.occasionally": "Sesekali",
"questioning.q2.rarely": "Jarang",

"questioning.q3.title": "Pernah sadar ada pola, tapi belum pernah kamu catat?",
"questioning.q3.yes": "Ya",
"questioning.q3.not_really": "Tidak juga",
"questioning.q3.wondered": "Pernah kepikiran",

"questioning.info.title": "Konteks singkat",
"questioning.info.body":
  "Hanya sekitar ~4% orang yang rutin tracking mood — dan yang melakukannya sering melaporkan kesadaran emosi dan pengelolaan emosi yang jauh lebih baik dibanding yang tidak.",
"questioning.cta.title": "Perasaan lewat — insight tetap.",
"questioning.cta.body":
  "RasakuYa membantu kamu melihat pola, menamai apa yang terjadi, dan membangun kesadaran yang tenang dan berulang — tanpa terasa klinis.",

// Legal common
"legal.last_updated": "Terakhir diperbarui: {date}",
"legal.contact_email": "rasakuyaa@gmail.com",

// Terms
"terms.title": "Syarat & Ketentuan",
"terms.about.title": "1. Tentang RasakuYa",
"terms.about.body":
  "RasakuYa adalah aplikasi mood tracking dan pendamping wellbeing. Aplikasi ini membantu kamu mencatat emosi, refleksi pola, dan mengakses percakapan AI yang suportif untuk refleksi diri dan wellbeing umum.",
"terms.not_medical.title": "2. Bukan Saran Medis",
"terms.not_medical.body":
  "RasakuYa bukan layanan medis dan tidak memberikan diagnosis, perawatan, atau terapi klinis. Jika kamu sedang krisis, pertimbangkan menghubungi layanan darurat setempat atau profesional yang berkualifikasi.",
"terms.eligibility.title": "3. Kelayakan",
"terms.eligibility.body":
  "Kamu harus dapat membuat perjanjian yang mengikat secara hukum di wilayahmu untuk menggunakan RasakuYa. Jika kamu belum cukup umur, gunakan RasakuYa dengan izin orang tua/wali.",
"terms.account.title": "4. Akun dan Keamanan",
"terms.account.body":
  "Kamu bertanggung jawab menjaga kerahasiaan kredensial dan semua aktivitas yang terjadi di akunmu.",
"terms.use.title": "5. Penggunaan yang Dilarang",
"terms.use.body":
  "Kamu setuju untuk tidak menyalahgunakan RasakuYa, termasuk mencoba mengganggu layanan, melewati batasan, reverse engineer, melakukan scraping, atau menggunakannya untuk aktivitas ilegal/berbahaya.",
"terms.ai.title": "6. Fitur AI",
"terms.ai.body":
  "Beberapa fitur menghasilkan respons menggunakan AI. Output bisa saja tidak akurat atau tidak lengkap. Gunakan pertimbanganmu dan jangan mengandalkan output AI sebagai saran profesional.",
"terms.billing.title": "7. Langganan dan Penagihan",
"terms.billing.body":
  "Jika kamu membeli langganan, kamu mengizinkan penagihan sesuai paket yang dipilih. Harga, fitur, dan batasan dapat berubah dari waktu ke waktu dan akan ditampilkan di halaman harga dan/atau di aplikasi.",
"terms.refunds.title": "8. Refund",
"terms.refunds.body":
  "Aturan refund dijelaskan di Kebijakan Refund. Jika terjadi konflik, Kebijakan Refund menjadi acuan.",
"terms.privacy.title": "9. Privasi",
"terms.privacy.body":
  "Kebijakan Privasi menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi.",
"terms.changes.title": "10. Perubahan Syarat",
"terms.changes.body":
  "Kami dapat memperbarui Syarat ini dari waktu ke waktu. Penggunaan berkelanjutan setelah perubahan berlaku berarti kamu menerima Syarat yang diperbarui.",
"terms.contact.title": "11. Kontak",
"terms.contact.body": "Pertanyaan? Hubungi kami di {email}",

// Privacy
"privacy.title": "Kebijakan Privasi",
"privacy.collect.title": "1. Data yang Kami Kumpulkan",
"privacy.collect.a": "Data akun (email, user ID, nama profil)",
"privacy.collect.b": "Entri mood (mood, catatan, tanggal, metadata opsional)",
"privacy.collect.c": "Data penggunaan (analitik dasar dan log error)",
"privacy.collect.d": "Konten chat AI jika kamu memakai fitur AI",
"privacy.use.title": "2. Cara Kami Menggunakan Data",
"privacy.use.a": "Untuk menyediakan dan meningkatkan RasakuYa",
"privacy.use.b": "Untuk menampilkan riwayat mood dan insight",
"privacy.use.c": "Untuk menjalankan fitur AI saat diminta",
"privacy.use.d": "Untuk keamanan dan pencegahan kecurangan",
"privacy.ai.title": "3. Pemrosesan AI",
"privacy.ai.body":
  "Sebagian input dapat diproses oleh penyedia layanan AI untuk menghasilkan respons. Hanya data yang diperlukan yang dikirim.",
"privacy.security.title": "4. Penyimpanan & Keamanan",
"privacy.security.body":
  "Data disimpan secara aman menggunakan infrastruktur Supabase. Tidak ada sistem yang bisa dijamin 100% aman.",
"privacy.sharing.title": "5. Pembagian Data",
"privacy.sharing.body":
  "Kami tidak menjual data pribadi. Kami hanya membagikan data dengan penyedia layanan penting (hosting, AI, pembayaran).",
"privacy.choices.title": "6. Pilihan Kamu",
"privacy.choices.a": "Edit atau hapus entri mood",
"privacy.choices.b": "Minta penghapusan akun",
"privacy.choices.c": "Nonaktifkan fitur AI kapan saja",
"privacy.children.title": "7. Anak-anak",
"privacy.children.body": "RasakuYa tidak ditujukan untuk anak di bawah 13 tahun.",
"privacy.changes.title": "8. Perubahan",
"privacy.changes.body":
  "Penggunaan setelah pembaruan berarti menerima perubahan.",
"privacy.contact.title": "9. Kontak",
"privacy.contact.body": "Kontak: {email}",

// Refund
"refund.title": "Kebijakan Refund",
"refund.overview.title": "1. Ringkasan",
"refund.overview.body":
  "RasakuYa adalah layanan langganan digital. Dengan membeli paket, kamu langsung mendapat akses ke fitur dan konten premium.",
"refund.subscriptions.title": "2. Pembayaran Langganan",
"refund.subscriptions.body":
  "Pembayaran ditagihkan di awal untuk periode bulanan. Setelah periode berjalan dimulai, tidak bisa dilakukan refund sebagian.",
"refund.eligibility.title": "3. Kelayakan Refund",
"refund.eligibility.body":
  "Karena RasakuYa memberi akses digital instan, refund umumnya tidak tersedia setelah langganan dimulai, kecuali diwajibkan oleh hukum.",
"refund.exceptions.title": "4. Kasus Pengecualian",
"refund.exceptions.body": "Kami dapat mempertimbangkan refund kasus-per-kasus untuk hal seperti:",
"refund.exceptions.a": "Tagihan ganda tidak sengaja",
"refund.exceptions.b": "Error teknis yang membuat fitur berbayar tidak bisa diakses",
"refund.exceptions.c": "Masalah billing dari penyedia pembayaran kami",
"refund.request.title": "5. Cara Mengajukan Refund",
"refund.request.body":
  "Untuk peninjauan refund, hubungi {email} dengan email akun dan detail pembayaranmu.",
"refund.cancel.title": "6. Pembatalan Langganan",
"refund.cancel.body":
  "Kamu bisa membatalkan langganan kapan saja. Pembatalan menghentikan tagihan berikutnya tapi tidak me-refund periode berjalan.",
"refund.changes.title": "7. Perubahan Kebijakan",
"refund.changes.body":
  "Kami dapat memperbarui Kebijakan Refund dari waktu ke waktu. Penggunaan RasakuYa setelah perubahan berarti kamu menerima kebijakan terbaru.",
"refund.contact.title": "8. Kontak",
"refund.contact.body": "Pertanyaan tentang refund? Hubungi {email}",

// Pricing page text (your custom pricing page)
"pricing.page_title": "Harga",
"pricing.page_subtitle": "Satu paket simpel — akses penuh insight + ARUNA.",
"pricing.back": "Kembali",
"pricing.links.terms": "Syarat",
"pricing.links.privacy": "Privasi",
"pricing.links.refund": "Refund",
"pricing.plan.name": "RasakuYa Premium",
"pricing.plan.desc": "Terbaik untuk tracking harian",
"pricing.plan.price": "Rp 40,000",
"pricing.plan.per_month": "/ bulan",
"pricing.features.1": "Akses ke Software RasakuYa",
"pricing.features.2": "ARUNA AI pendamping (100 chat per hari)",
"pricing.features.3": "Akses ke Mood Tracker dan Kalender Mood",
"pricing.features.4": "Akses ke Mood Predictor (1 per hari)",
"pricing.cta.pay": "Lanjut ke Pembayaran",
"pricing.notice":
  "Dengan melanjutkan, kamu setuju dengan Syarat dan Kebijakan Privasi kami.",
"pricing.side.title": "Yang akan kamu rasakan",
"pricing.side.a": "Pola jadi terlihat jelas (tidur, stres, pemicu)",
"pricing.side.b": "Kamu berhenti “menebak” apa yang terjadi hari itu",
"pricing.side.c": "ARUNA membantumu refleksi tanpa merasa dihakimi",
"pricing.side.d": "Kamu membangun kebiasaan yang tenang, bukan beban",

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
