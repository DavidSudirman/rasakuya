import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MoodEntry {
  date: string;
  mood: string;
  emoji: string;
}

interface MoodCalendarProps {
  moodEntries: MoodEntry[];
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const MoodCalendar: React.FC<MoodCalendarProps> = ({ 
  moodEntries, 
  onDateSelect, 
  selectedDate 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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

  return (
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
            
            return (
              <button
                key={index}
                className={`
                  h-12 w-full rounded-md text-sm font-medium transition-all
                  ${!isCurrentMonth ? 'text-muted-foreground opacity-40' : ''}
                  ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                  ${isToday && !isSelected ? 'bg-accent border border-primary/50' : ''}
                  ${!isSelected && !isToday ? 'hover:bg-accent' : ''}
                  flex items-center justify-center relative
                `}
                onClick={() => onDateSelect(dateString)}
                disabled={!isCurrentMonth}
              >
                <span>{day.getDate()}</span>
                {moodEntry && (
                  <span className="absolute -top-1 -right-1 text-xs">
                    {moodEntry.emoji}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};