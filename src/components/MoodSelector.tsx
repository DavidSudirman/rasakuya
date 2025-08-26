import React, { useState } from 'react';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Battery } from 'lucide-react';

interface MoodOption {
  id: string;
  emoji: string;
  name: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  { id: 'sangat-bahagia', emoji: '😄', name: 'Sangat Bahagia', color: 'mood-happy' },
  { id: 'bahagia', emoji: '😊', name: 'Bahagia', color: 'mood-good' },
  { id: 'netral', emoji: '😐', name: 'Netral', color: 'mood-neutral' },
  { id: 'cemas', emoji: '😰', name: 'Cemas', color: 'mood-anxious' },
  { id: 'sedih', emoji: '😔', name: 'Sedih', color: 'mood-sad' },
  { id: 'marah', emoji: '😠', name: 'Marah', color: 'mood-angry' },
];

interface MoodSelectorProps {
  selectedMood: string | null;
  onMoodSelect: (moodId: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  energyLevel: number;
  onEnergyLevelChange: (level: number) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ 
  selectedMood, 
  onMoodSelect, 
  description, 
  onDescriptionChange,
  energyLevel,
  onEnergyLevelChange
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-center">Bagaimana perasaanmu hari ini?</h3>
      
      {/* Mood Selection */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {moodOptions.map((mood) => (
          <Card
            key={mood.id}
            className={`
              p-4 cursor-pointer transition-all duration-300 hover:scale-105 border-2
              ${selectedMood === mood.id 
                ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20' 
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }
            `}
            onClick={() => onMoodSelect(mood.id)}
          >
            <div className="text-center">
              <div className={`text-3xl mb-2 transition-all duration-300 ${
                selectedMood === mood.id ? 'scale-110' : ''
              }`}>
                {mood.emoji}
              </div>
              <p className={`text-xs font-medium transition-colors duration-300 ${
                selectedMood === mood.id ? 'text-primary font-semibold' : ''
              }`}>
                {mood.name}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Energy Level */}
      {selectedMood && (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Battery className="h-4 w-4" />
              Tingkat Energi: {energyLevel}/10
            </Label>
            <div className="px-2">
              <Slider
                value={[energyLevel]}
                onValueChange={(value) => onEnergyLevelChange(value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Sangat Lelah</span>
                <span>Sangat Energik</span>
              </div>
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="mood-description">
              Ceritakan lebih detail tentang perasaanmu (opsional)
            </Label>
            <Textarea
              id="mood-description"
              placeholder="Apa yang membuatmu merasa seperti ini? Ceritakan aktivitas atau kejadian hari ini..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};