import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { ChevronLeft, ChevronRight, Edit2, Battery, Clock } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MoodEntry {
  date: string;
  mood: string;
  emoji: string;
  description?: string;
  energy_level?: number;
  id?: string;
}

interface MoodCalendarProps {
  moodEntries: MoodEntry[];
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
  onMoodUpdate?: () => void;
}

const moodOptions: { [key: string]: { name: { en: string; id: string }; emoji: string; color: string } } = {
  'sangat-bahagia': { name: { en: 'Very Happy', id: 'Sangat Bahagia' }, emoji: '😄', color: 'bg-green-100' },
  'bahagia': { name: { en: 'Happy', id: 'Bahagia' }, emoji: '😊', color: 'bg-blue-100' },
  'netral': { name: { en: 'Neutral', id: 'Netral' }, emoji: '😐', color: 'bg-gray-100' },
  'cemas': { name: { en: 'Anxious', id: 'Cemas' }, emoji: '😰', color: 'bg-yellow-100' },
  'sedih': { name: { en: 'Sad', id: 'Sedih' }, emoji: '😔', color: 'bg-purple-100' },
  'marah': { name: { en: 'Angry', id: 'Marah' }, emoji: '😠', color: 'bg-red-100' },
};

export const MoodCalendar: React.FC<MoodCalendarProps> = ({ 
  moodEntries, 
  onDateSelect, 
  selectedDate,
  onMoodUpdate 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingMood, setEditingMood] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editEnergyLevel, setEditEnergyLevel] = useState(5);
  const [editMoodType, setEditMoodType] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const monthNames = language === 'en' 
    ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dayNames = language === 'en' 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  
  const days = [];
  const currentDay = new Date(startDate);
  
  // Generate 6 weeks of days
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }

  const getMoodForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return moodEntries.find(entry => entry.date === dateString);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const isEditableDate = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return date <= today; // Can edit today and past dates only
  };

  const handleMoodEdit = (moodEntry: MoodEntry, dateString: string) => {
    const date = new Date(dateString);
    if (!isEditableDate(date)) {
      toast({
        title: t('common.error'),
        description: language === 'en' ? "You can only edit today's mood or past moods, not future ones." : "Kamu hanya bisa mengedit mood hari ini atau yang sudah lewat, bukan mood masa depan.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingMood(dateString);
    setEditDescription(moodEntry.description || '');
    setEditEnergyLevel(moodEntry.energy_level || 5);
    setEditMoodType(moodEntry.mood);
    setShowEditDialog(true);
  };

  const saveMoodEdit = async () => {
    if (!editingMood || !editMoodType || !user) return;

    try {
      const loggedAt = new Date(editingMood + 'T12:00:00Z').toISOString();
      
      const { error } = await supabase
        .from('mood_logs')
        .upsert([
          {
            user_id: user.id,
            mood: editMoodType,
            logged_at: loggedAt,
            description: editDescription.trim() || null,
            energy_level: editEnergyLevel
          }
        ], { 
          onConflict: 'user_id,logged_at',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      setShowEditDialog(false);
      setEditingMood(null);
      onMoodUpdate?.();
      
      toast({
        title: t('mood.saved'),
        description: t('mood.saved_desc').replace('{date}', new Date(editingMood).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')),
      });
    } catch (error) {
      console.error('Error updating mood:', error);
      toast({
        title: t('common.error'),
        description: t('mood.save_error'),
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {monthNames[month]} {year}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === month;
              const dateString = day.toISOString().split('T')[0];
              const moodEntry = getMoodForDate(day);
              const isSelected = selectedDate === dateString;
              const isToday = day.toDateString() === new Date().toDateString();
              const isFuture = day > new Date();
              
              return (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                     <button
                       className={`
                         h-12 w-full rounded-md text-sm font-medium transition-all
                         ${!isCurrentMonth ? 'text-muted-foreground opacity-40' : ''}
                         ${isFuture && isCurrentMonth ? 'text-muted-foreground opacity-50 cursor-not-allowed' : ''}
                         ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                         ${isToday && !isSelected ? 'bg-accent border border-primary/50' : ''}
                         ${!isSelected && !isToday && !isFuture ? 'hover:bg-accent' : ''}
                         ${moodEntry ? moodOptions[moodEntry.mood]?.color + ' border-2 border-primary/30' : ''}
                         flex items-center justify-center relative
                       `}
                       onClick={() => !isFuture && onDateSelect(dateString)}
                       disabled={!isCurrentMonth || isFuture}
                    >
                      <span>{day.getDate()}</span>
                      {moodEntry && (
                        <span className="absolute -top-1 -right-1 text-xs">
                          {moodEntry.emoji}
                        </span>
                      )}
                    </button>
                  </DialogTrigger>
                  
                  {moodEntry && !isFuture && (
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                          <span>{new Date(dateString).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                          {isEditableDate(day) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoodEdit(moodEntry, dateString)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                          <span className="text-4xl">{moodEntry.emoji}</span>
                          <div>
                            <h3 className="font-semibold">
                              {moodOptions[moodEntry.mood]?.name[language] || moodEntry.mood}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Battery className="h-3 w-3" />
                              {language === 'en' ? 'Energy Level' : 'Tingkat Energi'}: {moodEntry.energy_level || 5}/10
                            </div>
                          </div>
                        </div>
                        
                        {moodEntry.description && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              {language === 'en' ? 'Description' : 'Deskripsi'}
                            </Label>
                            <div className="p-3 bg-muted/30 rounded-lg text-sm">
                              {moodEntry.description}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {isToday ? (language === 'en' ? 'Today' : 'Hari ini') : 
                           language === 'en' ? 'Logged' : 'Dicatat'}
                        </div>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Edit Mood Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Edit Mood' : 'Edit Mood'} - {editingMood && new Date(editingMood).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Mood Selection */}
            <div className="space-y-3">
              <Label>{language === 'en' ? 'How are you feeling?' : 'Bagaimana perasaanmu?'}</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(moodOptions).map(([moodId, moodData]) => (
                  <button
                    key={moodId}
                    onClick={() => setEditMoodType(moodId)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      editMoodType === moodId 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{moodData.emoji}</div>
                    <div className="text-xs font-medium">{moodData.name[language]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Level */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Battery className="h-4 w-4" />
                {language === 'en' ? 'Energy Level' : 'Tingkat Energi'}: {editEnergyLevel}/10
              </Label>
              <Slider
                value={[editEnergyLevel]}
                onValueChange={(value) => setEditEnergyLevel(value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{language === 'en' ? 'Very Tired' : 'Sangat Lelah'}</span>
                <span>{language === 'en' ? 'Very Energetic' : 'Sangat Energik'}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>
                {language === 'en' ? 'Description (optional)' : 'Deskripsi (opsional)'}
              </Label>
              <Textarea
                placeholder={language === 'en' ? 
                  "Tell us more about your feelings..." : 
                  "Ceritakan lebih detail tentang perasaanmu..."
                }
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={saveMoodEdit} className="flex-1">
                {language === 'en' ? 'Save Changes' : 'Simpan Perubahan'}
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                {language === 'en' ? 'Cancel' : 'Batal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};