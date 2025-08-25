import React from 'react';
import { Card } from './ui/card';
import { BarChart3, Calendar, TrendingUp } from 'lucide-react';

interface MoodEntry {
  date: string;
  mood: string;
  emoji: string;
}

interface MoodStatsProps {
  moodEntries: MoodEntry[];
}

export const MoodStats: React.FC<MoodStatsProps> = ({ moodEntries }) => {
  const getMoodStats = () => {
    if (moodEntries.length === 0) {
      return { mostCommon: null, streak: 0, weekAverage: 0 };
    }

    // Count mood frequencies
    const moodCounts = moodEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find most common mood
    const mostCommon = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    // Calculate positive streak (happy or good moods)
    let currentStreak = 0;
    for (let i = moodEntries.length - 1; i >= 0; i--) {
      if (moodEntries[i].mood === 'sangat-bahagia' || moodEntries[i].mood === 'bahagia') {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate this week's average (simplified)
    const recentEntries = moodEntries.slice(-7);
    const moodValues = recentEntries.map(entry => {
      switch (entry.mood) {
        case 'sangat-bahagia': return 5;
        case 'bahagia': return 4;
        case 'netral': return 3;
        case 'sedih': return 2;
        case 'marah': return 1;
        default: return 3;
      }
    });
    
    const weekAverage = recentEntries.length > 0 
      ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length 
      : 0;

    return { mostCommon, streak: currentStreak, weekAverage };
  };

  const { mostCommon, streak, weekAverage } = getMoodStats();

  const getMoodEmoji = (mood: string | null) => {
    switch (mood) {
      case 'sangat-bahagia': return '😄';
      case 'bahagia': return '😊';
      case 'netral': return '😐';
      case 'sedih': return '😔';
      case 'marah': return '😠';
      default: return '😊';
    }
  };

  const getMoodName = (mood: string | null) => {
    switch (mood) {
      case 'sangat-bahagia': return 'Sangat Bahagia';
      case 'bahagia': return 'Bahagia';
      case 'netral': return 'Netral';
      case 'sedih': return 'Sedih';
      case 'marah': return 'Marah';
      default: return 'Belum ada data';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mood Paling Sering</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getMoodEmoji(mostCommon)}</span>
              <span className="font-semibold text-sm">{getMoodName(mostCommon)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-mood-good/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-mood-good" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Streak Positif</p>
            <p className="font-semibold">{streak} hari</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rata-rata Minggu Ini</p>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(weekAverage / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {weekAverage > 0 ? `${weekAverage.toFixed(1)}/5` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};