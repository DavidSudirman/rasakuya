import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoodSelector } from '@/components/MoodSelector';
import { MoodCalendar } from '@/components/MoodCalendar';
import { MoodPrediction } from '@/components/MoodPrediction';
import { MoodStats } from '@/components/MoodStats';
import { Heart, Sparkles, Calendar, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MoodEntry {
  date: string;
  mood: string;
  emoji: string;
}

const Index = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tracker' | 'calendar' | 'stats' | 'prediction'>('tracker');
  const { toast } = useToast();

  // Load mood entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rasakuya-moods');
    if (saved) {
      try {
        setMoodEntries(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load mood entries:', error);
      }
    }
  }, []);

  // Save mood entries to localStorage
  useEffect(() => {
    localStorage.setItem('rasakuya-moods', JSON.stringify(moodEntries));
  }, [moodEntries]);

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
  };

  const saveMood = () => {
    if (!selectedMood || !selectedDate) return;

    const moodEmojis = {
      'sangat-bahagia': '😄',
      'bahagia': '😊',
      'netral': '😐',
      'sedih': '😔',
      'marah': '😠'
    };

    const newEntry: MoodEntry = {
      date: selectedDate,
      mood: selectedMood,
      emoji: moodEmojis[selectedMood as keyof typeof moodEmojis]
    };

    // Remove existing entry for the same date if any
    const updatedEntries = moodEntries.filter(entry => entry.date !== selectedDate);
    updatedEntries.push(newEntry);
    updatedEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setMoodEntries(updatedEntries);
    setSelectedMood(null);
    
    toast({
      title: "Mood tersimpan!",
      description: `Mood untuk ${new Date(selectedDate).toLocaleDateString('id-ID')} berhasil disimpan.`,
    });
  };

  const getCurrentMoodForDate = (date: string) => {
    return moodEntries.find(entry => entry.date === date);
  };

  const currentMoodEntry = selectedDate ? getCurrentMoodForDate(selectedDate) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Header */}
      <div className="bg-gradient-calm text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-pink-300" />
            <h1 className="text-3xl font-bold">RasakuYa!</h1>
            <Sparkles className="h-6 w-6 text-yellow-300" />
          </div>
          <p className="text-center text-lg opacity-90">Lacak perasaanmu, prediksi hari esok</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-card rounded-lg p-1 shadow-sm">
            {[
              { id: 'tracker', label: 'Tracker', icon: Heart },
              { id: 'calendar', label: 'Kalender', icon: Calendar },
              { id: 'stats', label: 'Statistik', icon: BarChart3 },
              { id: 'prediction', label: 'Prediksi AI', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${activeTab === tab.id 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {activeTab === 'tracker' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold mb-2">Catat Perasaanmu Hari Ini</h2>
                  <p className="text-muted-foreground">
                    Tanggal: {selectedDate ? new Date(selectedDate).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : ''}
                  </p>
                </div>

                {currentMoodEntry ? (
                  <div className="text-center space-y-4">
                    <div className="text-6xl">{currentMoodEntry.emoji}</div>
                    <p className="text-lg font-medium">Kamu sudah mencatat mood untuk hari ini!</p>
                    <Button onClick={() => setActiveTab('calendar')} className="mt-4">
                      Lihat Kalender Mood
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <MoodSelector selectedMood={selectedMood} onMoodSelect={handleMoodSelect} />
                    {selectedMood && (
                      <div className="text-center">
                        <Button onClick={saveMood} size="lg" className="px-8">
                          Simpan Mood
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <MoodCalendar 
                moodEntries={moodEntries}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Statistik Mood</h2>
                <MoodStats moodEntries={moodEntries} />
              </Card>
            </div>
          )}

          {activeTab === 'prediction' && (
            <div className="space-y-6">
              <MoodPrediction moodEntries={moodEntries} />
              {moodEntries.length < 3 && (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Catat mood setidaknya 3 hari untuk mendapatkan prediksi yang lebih akurat!
                  </p>
                  <Button onClick={() => setActiveTab('tracker')}>
                    Mulai Mencatat Mood
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
