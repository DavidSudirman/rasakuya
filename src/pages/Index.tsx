import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoodSelector } from '@/components/MoodSelector';
import { MoodCalendar } from '@/components/MoodCalendar';
import { MoodPrediction } from '@/components/MoodPrediction';
import { MoodStats } from '@/components/MoodStats';
import { AITherapist } from '@/components/AITherapist';
import { LanguageSelector } from '@/components/LanguageSelector';
import { PricingPlans } from '@/components/PricingPlans';
import { AccountDropdown } from '@/components/AccountDropdown';
import { MoodVFX } from '@/components/MoodVFX';
import { Heart, Sparkles, Calendar, BarChart3, LogOut, User, Bot, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface MoodEntry {
  date: string;
  mood: string;
  emoji: string;
  description?: string;
  energy_level?: number;
  id?: string;
}

const Index = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodDescription, setMoodDescription] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tracker' | 'calendar' | 'stats' | 'prediction' | 'therapist'>('tracker');
  const [loading, setLoading] = useState(true);
  const [isEditingToday, setIsEditingToday] = useState(false);
  const [showVFX, setShowVFX] = useState(false);
  const { toast } = useToast();
  const { user, signOut, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
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
        description: entry.description,
        energy_level: entry.energy_level,
        id: entry.id
      }));

      setMoodEntries(formattedEntries);
    } catch (error) {
      console.error('Error loading mood entries:', error);
      toast({
        title: t('common.error'),
        description: t('mood.load_error'),
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
      const dateString = selectedDate.toISOString().split('T')[0];
      const loggedAt = new Date(dateString + 'T12:00:00Z').toISOString();
      const moodEmoji = getMoodEmoji(selectedMood); // Store emoji before clearing state
      
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
      
      // Trigger VFX effect
      setShowVFX(true);
      
      toast({
        title: t('mood.saved'),
        description: t('mood.saved_desc').replace('{date}', selectedDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')),
      });
    } catch (error) {
      console.error('Error saving mood:', error);
      toast({
        title: t('common.error'),
        description: t('mood.save_error'),
        variant: "destructive"
      });
    }
  };

  const getCurrentMoodForDate = (date: string) => {
    return moodEntries.find(entry => entry.date === date);
  };

  const selectedDateString = selectedDate.toISOString().split('T')[0];
  const currentMoodEntry = getCurrentMoodForDate(selectedDateString);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
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
                <p className="text-sm opacity-90">{t('header.tagline')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <AccountDropdown />
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-card rounded-lg p-1 shadow-sm">
            {[
              { id: 'tracker', label: t('nav.tracker'), icon: Heart },
              { id: 'calendar', label: t('nav.calendar'), icon: Calendar },
              { id: 'stats', label: t('nav.stats'), icon: BarChart3 },
              { id: 'prediction', label: t('nav.prediction'), icon: Sparkles },
              { id: 'therapist', label: t('nav.therapist'), icon: Bot }
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
                  <h2 className="text-2xl font-semibold mb-2">{t('tracker.title')}</h2>
                  
                  {/* Date Picker */}
                  <div className="flex justify-center mb-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <p className="text-muted-foreground">
                    {t('tracker.date').replace('{date}', selectedDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }))}
                  </p>
                </div>

                {currentMoodEntry && !isEditingToday ? (
                  <div className="text-center space-y-4">
                    <div className="text-6xl">{currentMoodEntry.emoji}</div>
                    <p className="text-lg font-medium">{t('tracker.already_logged')}</p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedMood(currentMoodEntry.mood);
                          setMoodDescription(currentMoodEntry.description || '');
                          setIsEditingToday(true);
                        }}
                      >
                        {t('tracker.edit_today')}
                      </Button>
                      <Button onClick={() => setActiveTab('calendar')}>
                        {t('tracker.view_calendar')}
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
                          {isEditingToday ? t('tracker.update_mood') : t('tracker.save_mood')}
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
                            {t('tracker.cancel')}
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
                onDateSelect={(dateString) => setSelectedDate(new Date(dateString))}
                selectedDate={selectedDateString}
                onMoodUpdate={loadMoodEntries}
              />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">{t('stats.title')}</h2>
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
                    {t('tracker.need_3_days')}
                  </p>
                  <Button onClick={() => setActiveTab('tracker')}>
                    {t('tracker.start_logging')}
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
      
      {/* VFX Effect */}
      <MoodVFX 
        trigger={showVFX}
        onComplete={() => setShowVFX(false)}
      />
    </div>
  );
};

export default Index;
