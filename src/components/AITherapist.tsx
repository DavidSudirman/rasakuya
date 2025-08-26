import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      // Add mood context to the message
      const messageWithContext = `Context: ${moodContext}\n\nUser message: ${currentInput}`;

      const { data, error } = await supabase.functions.invoke('chat-openrouter', {
        body: {
          message: messageWithContext,
          history: history
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
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
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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
        <Bot className="h-8 w-8 text-primary mx-auto mb-2" />
        <h2 className="text-xl font-semibold">AI Therapist</h2>
        <p className="text-sm text-muted-foreground">Powered by secure AI - no API keys needed</p>
      </div>

      <div className="space-y-4">
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Hi! I'm here to listen and help. Tell me what's on your mind today.</p>
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
                      {message.timestamp.toLocaleTimeString('en-US', { 
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
            placeholder="Share your feelings or thoughts..."
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