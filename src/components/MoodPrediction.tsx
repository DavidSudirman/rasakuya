import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { TrendingUp, TrendingDown, Minus, Brain, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MoodEntry {
  date: string;
  mood: string;
  emoji: string;
  description?: string;
}

interface MoodPredictionProps {
  moodEntries: MoodEntry[];
}

export const MoodPrediction: React.FC<MoodPredictionProps> = ({ moodEntries }) => {
  const [aiReasoning, setAiReasoning] = useState<string>('');
  const [loadingReasoning, setLoadingReasoning] = useState(false);
  const { toast } = useToast();

  // Simple prediction logic based on recent trends
  const getRecentTrend = () => {
    if (moodEntries.length < 3) {
      return { 
        prediction: '😊', 
        confidence: 'Rendah', 
        message: 'Butuh lebih banyak data untuk prediksi akurat',
        trend: 'stable'
      };
    }

    const recent = moodEntries.slice(-7); // Last 7 days
    const moodScores = recent.map(entry => {
      switch (entry.mood) {
        case 'sangat-bahagia': return 5;
        case 'bahagia': return 4;
        case 'netral': return 3;
        case 'cemas': return 2.5;
        case 'sedih': return 2;
        case 'marah': return 1;
        default: return 3;
      }
    });

    const average = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    const recentAvg = moodScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = moodScores.slice(0, -3).reduce((a, b) => a + b, 0) / (moodScores.length - 3) || recentAvg;
    
    let prediction = '😊';
    let confidence = 'Sedang';
    let message = 'Mood kamu cenderung stabil';
    let trend = 'stable';

    // Determine trend
    if (recentAvg > olderAvg + 0.5) {
      trend = 'improving';
    } else if (recentAvg < olderAvg - 0.5) {
      trend = 'declining';
    }

    if (recentAvg > 4) {
      prediction = '😄';
      message = 'Mood kamu akan tetap positif! Pertahankan rutinitas baik ini.';
      confidence = 'Tinggi';
    } else if (recentAvg > 3.5) {
      prediction = '😊';
      message = trend === 'improving' ? 'Mood kamu membaik! Hari-hari bahagia menanti.' : 'Hari-hari bahagia menanti!';
    } else if (recentAvg < 2.5) {
      prediction = '😔';
      message = trend === 'declining' ? 'Mood kamu menurun. Saatnya fokus self-care dan istirahat.' : 'Saatnya self-care lebih banyak';
      confidence = 'Sedang';
    } else if (recentAvg < 3) {
      prediction = '😐';
      message = 'Mood kamu akan netral. Coba aktivitas yang menyenangkan hari ini.';
    }

    return { prediction, confidence, message, trend, average: recentAvg };
  };

  const generateAIReasoning = async () => {
    if (moodEntries.length < 3) {
      setAiReasoning('Belum cukup data untuk analisis mendalam. Catat mood lebih sering untuk insights yang lebih baik.');
      return;
    }

    setLoadingReasoning(true);
    try {
      const recentEntries = moodEntries.slice(-7);
      const moodContext = recentEntries.map(entry => 
        `${entry.date}: ${entry.mood}${entry.description ? ` - ${entry.description}` : ''}`
      ).join('\n');

      const { data, error } = await supabase.functions.invoke('chat-openrouter', {
        body: {
          message: `Analyze these mood entries and provide reasoning for mood prediction in Indonesian language. Keep it concise (max 3 sentences) and supportive:

${moodContext}

Based on these patterns, explain why the predicted mood trend makes sense and give one helpful suggestion.`,
          history: []
        }
      });

      if (error) throw error;

      if (data.success) {
        setAiReasoning(data.answer);
      } else {
        setAiReasoning('Analisis sedang tidak tersedia. Coba lagi nanti.');
      }
    } catch (error) {
      console.error('Error generating AI reasoning:', error);
      setAiReasoning('Tidak dapat menghasilkan analisis saat ini. Silakan coba lagi.');
    } finally {
      setLoadingReasoning(false);
    }
  };

  // Generate reasoning when component mounts or mood entries change
  useEffect(() => {
    if (moodEntries.length >= 3) {
      generateAIReasoning();
    } else {
      setAiReasoning('Belum cukup data untuk analisis mendalam. Catat mood lebih sering untuk insights yang lebih baik.');
    }
  }, [moodEntries]);

  const { prediction, confidence, message, trend, average } = getRecentTrend();

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Minus className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <Card className="p-6 bg-gradient-calm text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/20 rounded-full">
          <Brain className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">Prediksi AI RasakuYa!</h3>
        <Sparkles className="h-4 w-4 text-yellow-300" />
      </div>
      
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">{prediction}</div>
          <p className="text-sm opacity-90">Prediksi mood besok</p>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tingkat Kepercayaan</span>
            <span className="text-sm">{confidence}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all"
              style={{ 
                width: confidence === 'Tinggi' ? '80%' : confidence === 'Sedang' ? '60%' : '30%' 
              }}
            />
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          {getTrendIcon()}
          <p className="text-sm opacity-90">{message}</p>
        </div>

        {/* AI Reasoning Section */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Analisis AI
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateAIReasoning}
              disabled={loadingReasoning}
              className="text-white hover:bg-white/20 h-6 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${loadingReasoning ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-sm opacity-90 leading-relaxed">
            {loadingReasoning ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                Menganalisis pola mood...
              </span>
            ) : (
              aiReasoning
            )}
          </p>
        </div>
        
        <div className="text-xs opacity-75 text-center">
          Berdasarkan {moodEntries.length} entri mood • Skor rata-rata: {average.toFixed(1)}/5
        </div>
      </div>
    </Card>
  );
};