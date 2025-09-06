import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'id';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'header.tagline': 'Track your feelings, predict tomorrow',
    'header.greeting': 'Hello, {name}!',
    'header.logout': 'Logout',
    
    // Navigation
    'nav.tracker': 'Tracker',
    'nav.calendar': 'Calendar',
    'nav.stats': 'Statistics',
    'nav.prediction': 'AI Prediction',
    'nav.therapist': 'AI Therapist',
    
    // Mood Tracker
    'tracker.title': 'Record Your Feelings Today',
    'tracker.date': 'Date: {date}',
    'tracker.already_logged': "You've already logged your mood for today!",
    'tracker.edit_today': 'Edit Today\'s Mood',
    'tracker.view_calendar': 'View Mood Calendar',
    'tracker.save_mood': 'Save Mood',
    'tracker.update_mood': 'Update Mood',
    'tracker.cancel': 'Cancel',
    'tracker.start_logging': 'Start Logging Mood',
    'tracker.need_3_days': 'Log moods for at least 3 days to get more accurate predictions!',
    
    // AI Therapist
    'therapist.title': 'ARUNA',
    'therapist.subtitle': 'Your personal AI therapist',
    'therapist.greeting': 'Hi! I\'m ARUNA, your personal AI therapist. I\'m here to listen and help. Tell me what\'s on your mind today.',
    'therapist.placeholder': 'Share your feelings or thoughts...',
    'therapist.service_busy': 'Service Busy',
    'therapist.service_busy_desc': 'The AI service is temporarily busy. Please try again in a few moments.',
    'therapist.error': 'Error',
    'therapist.failed_send': 'Failed to send message. Please try again.',
    'therapist.rate_limit': 'Too many requests. Please wait a moment before trying again.',
    
    // Statistics
    'stats.title': 'Mood Statistics',
    
    // Common
    'common.loading': 'Loading RasakuYa!...',
    'common.error': 'Error',
    'common.success': 'Success',
    'mood.saved': 'Mood saved!',
    'mood.saved_desc': 'Mood for {date} has been saved successfully.',
    'mood.save_error': 'Failed to save mood. Please try again.',
    'mood.load_error': 'Failed to load mood data.',
    
    // Moods
    'mood.sangat-bahagia': 'Very Happy',
    'mood.bahagia': 'Happy', 
    'mood.netral': 'Neutral',
    'mood.cemas': 'Anxious',
    'mood.sedih': 'Sad',
    'mood.marah': 'Angry',
  },
  id: {
    // Header
    'header.tagline': 'Lacak perasaanmu, prediksi hari esok',
    'header.greeting': 'Halo, {name}!',
    'header.logout': 'Keluar',
    
    // Navigation
    'nav.tracker': 'Tracker',
    'nav.calendar': 'Kalender',
    'nav.stats': 'Statistik',
    'nav.prediction': 'Prediksi AI',
    'nav.therapist': 'AI Therapist',
    
    // Mood Tracker
    'tracker.title': 'Catat Perasaanmu Hari Ini',
    'tracker.date': 'Tanggal: {date}',
    'tracker.already_logged': 'Kamu sudah mencatat mood untuk hari ini!',
    'tracker.edit_today': 'Ubah Mood Hari Ini',
    'tracker.view_calendar': 'Lihat Kalender Mood',
    'tracker.save_mood': 'Simpan Mood',
    'tracker.update_mood': 'Update Mood',
    'tracker.cancel': 'Batal',
    'tracker.start_logging': 'Mulai Mencatat Mood',
    'tracker.need_3_days': 'Catat mood setidaknya 3 hari untuk mendapatkan prediksi yang lebih akurat!',
    
    // AI Therapist
    'therapist.title': 'ARUNA',
    'therapist.subtitle': 'Terapis AI pribadi kamu',
    'therapist.greeting': 'Hai! Aku ARUNA, terapis AI pribadi kamu. Aku di sini untuk mendengarkan dan membantu. Ceritakan apa yang sedang kamu rasakan hari ini.',
    'therapist.placeholder': 'Bagikan perasaan atau pikiranmu...',
    'therapist.service_busy': 'Layanan Sibuk',
    'therapist.service_busy_desc': 'Layanan AI sedang sibuk sementara. Silakan coba lagi dalam beberapa saat.',
    'therapist.error': 'Kesalahan',
    'therapist.failed_send': 'Gagal mengirim pesan. Silakan coba lagi.',
    'therapist.rate_limit': 'Terlalu banyak permintaan. Silakan tunggu sebentar sebelum mencoba lagi.',
    
    // Statistics
    'stats.title': 'Statistik Mood',
    
    // Common
    'common.loading': 'Memuat RasakuYa!...',
    'common.error': 'Error',
    'common.success': 'Berhasil',
    'mood.saved': 'Mood tersimpan!',
    'mood.saved_desc': 'Mood untuk {date} berhasil disimpan.',
    'mood.save_error': 'Gagal menyimpan mood. Silakan coba lagi.',
    'mood.load_error': 'Gagal memuat data mood.',
    
    // Moods
    'mood.sangat-bahagia': 'Sangat Bahagia',
    'mood.bahagia': 'Bahagia',
    'mood.netral': 'Netral', 
    'mood.cemas': 'Cemas',
    'mood.sedih': 'Sedih',
    'mood.marah': 'Marah',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved || 'id'; // Default to Indonesian
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string, params?: Record<string, string>) => {
    let translation = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, value);
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};