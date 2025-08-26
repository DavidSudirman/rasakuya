import React, { useState } from 'react';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

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
  { id: 'sedih', emoji: '😔', name: 'Sedih', color: 'mood-sad' },
  { id: 'marah', emoji: '😠', name: 'Marah', color: 'mood-angry' },
];

interface MoodSelectorProps {
  selectedMood: string | null;
  onMoodSelect: (moodId: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ 
  selectedMood, 
  onMoodSelect, 
  description, 
  onDescriptionChange 
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-center">Bagaimana perasaanmu hari ini?</h3>
      
      {/* Mood Selection */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {moodOptions.map((mood) => (
          <Card
            key={mood.id}
            className={`
              p-4 cursor-pointer transition-all duration-300 hover:scale-105 border-2
              ${selectedMood === mood.id 
                ? `border-${mood.color} shadow-lg shadow-${mood.color}/20` 
                : 'border-border hover:border-primary/50'
              }
            `}
            onClick={() => onMoodSelect(mood.id)}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{mood.emoji}</div>
              <p className="text-xs font-medium">{mood.name}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Description Input */}
      {selectedMood && (
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
      )}
    </div>
  );
};