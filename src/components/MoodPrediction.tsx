import React from 'react';
import { Card } from './ui/card';
import { TrendingUp, Brain, Sparkles } from 'lucide-react';

interface MoodEntry {
  date: string;
  mood: string;
  emoji: string;
}

interface MoodPredictionProps {
  moodEntries: MoodEntry[];
}

export const MoodPrediction: React.FC<MoodPredictionProps> = ({ moodEntries }) => {
  // Simple prediction logic based on recent trends
  const getRecentTrend = () => {
    if (moodEntries.length < 3) {
      return { prediction: '😊', confidence: 'Rendah', message: 'Butuh lebih banyak data untuk prediksi akurat' };
    }

    const recent = moodEntries.slice(-7); // Last 7 days
    const moodScores = recent.map(entry => {
      switch (entry.mood) {
        case 'sangat-bahagia': return 5;
        case 'bahagia': return 4;
        case 'netral': return 3;
        case 'sedih': return 2;
        case 'marah': return 1;
        default: return 3;
      }
    });

    const average = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    const trend = moodScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    
    let prediction = '😊';
    let confidence = 'Sedang';
    let message = 'Mood kamu cenderung stabil';

    if (trend > 4) {
      prediction = '😄';
      message = 'Mood kamu akan tetap positif!';
      confidence = 'Tinggi';
    } else if (trend > 3.5) {
      prediction = '😊';
      message = 'Hari-hari bahagia menanti!';
    } else if (trend < 2.5) {
      prediction = '😔';
      message = 'Saatnya self-care lebih banyak';
      confidence = 'Sedang';
    }

    return { prediction, confidence, message };
  };

  const { prediction, confidence, message } = getRecentTrend();

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
          <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm opacity-90">{message}</p>
        </div>
        
        <div className="text-xs opacity-75 text-center">
          Berdasarkan {moodEntries.length} entri mood terakhir
        </div>
      </div>
    </Card>
  );
};