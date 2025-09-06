import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Send, Bot, User, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArunaPreferences } from './ArunaPreferences';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AITherapistProps {
  moodEntries: Array<{ date: string; mood: string; emoji: string; description?: string }>;
}

export const AITherapist: React.FC<AITherapistProps> = ({ moodEntries }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [arunaPreferences, setArunaPreferences] = useState<string>('');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadArunaPreferences();
  }, [user]);

  const loadArunaPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('aruna_preferences')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.aruna_preferences) {
        setArunaPreferences(data.aruna_preferences);
      }
    } catch (error) {
      console.error('Error loading ARUNA preferences:', error);
    }
  };

  const getMoodContext = () => {
    const recentMoods = moodEntries.slice(-7); // Last 7 days
    if (recentMoods.length === 0) return 'User has not logged any moods yet.';

    const moodCounts = recentMoods.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const moodTranslations = {
      'sangat-bahagia': 'very happy',
      'bahagia': 'happy',
      'netral': 'neutral',
      'sedih': 'sad',
      'marah': 'angry'
    };

    const moodSummary = Object.entries(moodCounts)
      .map(([mood, count]) => `${moodTranslations[mood as keyof typeof moodTranslations] || mood}: ${count} days`)
      .join(', ');

    return `In the last 7 days, user logged moods: ${moodSummary}. Latest mood: ${moodTranslations[recentMoods[recentMoods.length - 1]?.mood as keyof typeof moodTranslations] || recentMoods[recentMoods.length - 1]?.mood}.`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

      try {
        const moodContext = getMoodContext();
        
        // Build history for the API call
        const history = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Add mood context and ARUNA preferences to the message
        let messageWithContext = `Context: ${moodContext}\n\nUser message: ${currentInput}`;
        
        if (arunaPreferences) {
          messageWithContext = `ARUNA Preferences: ${arunaPreferences}\n\n${messageWithContext}`;
        }

        const { data, error } = await supabase.functions.invoke('chat-openrouter', {
          body: {
            message: messageWithContext,
            history: history,
            language: language
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!data.success) {
          // Handle rate limiting specifically
          if (data.error.includes('temporarily busy')) {
            toast({
              title: t('therapist.service_busy'),
              description: t('therapist.service_busy_desc'),
              variant: "destructive"
            });
            return;
          }
          
          throw new Error(data.error || 'Unknown error occurred');
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.answer,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
      } catch (error) {
        console.error('Error sending message:', error);
        let errorMessage = t('therapist.failed_send');
        
        if (error.message.includes('temporarily busy')) {
          errorMessage = t('therapist.service_busy_desc');
        } else if (error.message.includes('rate limit')) {
          errorMessage = t('therapist.rate_limit');
        }
        
        toast({
          title: t('therapist.error'),
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Bot className="h-8 w-8 text-primary" />
          <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ArunaPreferences onClose={() => {
                setPreferencesOpen(false);
                loadArunaPreferences(); // Refresh preferences after closing
              }} />
            </DialogContent>
          </Dialog>
        </div>
        <h2 className="text-xl font-semibold">{t('therapist.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('therapist.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('therapist.greeting')}</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <User className="h-6 w-6 text-primary" />
                    ) : (
                      <Bot className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card border'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <div className="bg-card border p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('therapist.placeholder')}
            className="min-h-[80px] resize-none"
            disabled={loading}
          />
          <Button 
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="lg"
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};