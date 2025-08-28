import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoodSelector } from '@/components/MoodSelector';
import { MoodCalendar } from '@/components/MoodCalendar';
import { MoodPrediction } from '@/components/MoodPrediction';
import { MoodStats } from '@/components/MoodStats';
import { AITherapist } from '@/components/AITherapist';
import { Heart, Sparkles, Calendar, BarChart3, LogOut, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MoodEntry {
  date: string;
  mood: string;
  emoji: string;
  description?: string;
}

const Index = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodDescription, setMoodDescription] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tracker' | 'calendar' | 'stats' | 'prediction' | 'therapist'>('tracker');
  const [loading, setLoading] = useState(true);
  const [isEditingToday, setIsEditingToday] = useState(false);
  const { toast } = useToast();
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check authentication and load mood entries
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    loadMoodEntries();
  }, [user, authLoading, navigate]);

  const loadMoodEntries = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true });

      if (error) throw error;

      const formattedEntries = data.map((entry: any) => ({
        date: new Date(entry.logged_at).toISOString().split('T')[0],
        mood: entry.mood,
        emoji: entry.emoji || getMoodEmoji(entry.mood),
        description: entry.description
      }));

      setMoodEntries(formattedEntries);
    } catch (error) {
      console.error('Error loading mood entries:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data mood.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: { [key: string]: string } = {
      'sangat-bahagia': '😄',
      'bahagia': '😊',
      'netral': '😐',
      'cemas': '😰',
      'sedih': '😔',
      'marah': '😠'
    };
    return moodEmojis[mood] || '😐';
  };

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
  };

  const saveMood = async () => {
    if (!selectedMood || !selectedDate || !user) return;

    try {
      const loggedAt = new Date(selectedDate + 'T12:00:00Z').toISOString();
      
      const { data, error } = await supabase
        .from('mood_logs')
        .upsert([
          {
            user_id: user.id,
            mood: selectedMood,
            logged_at: loggedAt,
            description: moodDescription.trim() || null,
            energy_level: energyLevel
          }
        ], { 
          onConflict: 'user_id,logged_at',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;

      // Reload mood entries to get the updated data
      await loadMoodEntries();
      setSelectedMood(null);
      setMoodDescription('');
      setEnergyLevel(5);
      setIsEditingToday(false);
      
      toast({
        title: "Mood tersimpan!",
        description: `Mood untuk ${new Date(selectedDate).toLocaleDateString('id-ID')} berhasil disimpan.`,
      });
    } catch (error) {
      console.error('Error saving mood:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan mood. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const getCurrentMoodForDate = (date: string) => {
    return moodEntries.find(entry => entry.date === date);
  };

  const currentMoodEntry = selectedDate ? getCurrentMoodForDate(selectedDate) : null;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Memuat RasakuYa!...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Header */}
      <div className="bg-gradient-calm text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-pink-300" />
              <div>
                <h1 className="text-3xl font-bold">RasakuYa!</h1>
                <p className="text-sm opacity-90">Lacak perasaanmu, prediksi hari esok</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Halo, {user.user_metadata?.display_name || user.email?.split('@')[0] || 'Pengguna'}!
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
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
              { id: 'prediction', label: 'Prediksi AI', icon: Sparkles },
              { id: 'therapist', label: 'AI Therapist', icon: Bot }
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

                {currentMoodEntry && !isEditingToday ? (
                  <div className="text-center space-y-4">
                    <div className="text-6xl">{currentMoodEntry.emoji}</div>
                    <p className="text-lg font-medium">Kamu sudah mencatat mood untuk hari ini!</p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedMood(currentMoodEntry.mood);
                          setMoodDescription(currentMoodEntry.description || '');
                          setIsEditingToday(true);
                        }}
                      >
                        Ubah Mood Hari Ini
                      </Button>
                      <Button onClick={() => setActiveTab('calendar')}>
                        Lihat Kalender Mood
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <MoodSelector 
                      selectedMood={selectedMood} 
                      onMoodSelect={handleMoodSelect}
                      description={moodDescription}
                      onDescriptionChange={setMoodDescription}
                      energyLevel={energyLevel}
                      onEnergyLevelChange={setEnergyLevel}
                    />
                    {selectedMood && (
                      <div className="text-center space-y-3">
                        <Button onClick={saveMood} size="lg" className="px-8">
                          {isEditingToday ? 'Update Mood' : 'Simpan Mood'}
                        </Button>
                        {isEditingToday && (
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedMood(null);
                              setMoodDescription('');
                              setEnergyLevel(5);
                              setIsEditingToday(false);
                            }}
                          >
                            Batal
                          </Button>
                        )}
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

          {activeTab === 'therapist' && (
            <div className="space-y-6">
              <AITherapist moodEntries={moodEntries} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
