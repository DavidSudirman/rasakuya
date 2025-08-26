import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Send, Bot, User, Key, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from './ui/alert';

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
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const { toast } = useToast();

  const getMoodContext = () => {
    const recentMoods = moodEntries.slice(-7); // Last 7 days
    if (recentMoods.length === 0) return 'Pengguna belum mencatat mood apapun.';

    const moodCounts = recentMoods.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const moodTranslations = {
      'sangat-bahagia': 'sangat bahagia',
      'bahagia': 'bahagia',
      'netral': 'netral',
      'sedih': 'sedih',
      'marah': 'marah'
    };

    const moodSummary = Object.entries(moodCounts)
      .map(([mood, count]) => `${moodTranslations[mood as keyof typeof moodTranslations] || mood}: ${count} hari`)
      .join(', ');

    return `Dalam 7 hari terakhir, pengguna mencatat mood: ${moodSummary}. Mood terbaru: ${moodTranslations[recentMoods[recentMoods.length - 1]?.mood as keyof typeof moodTranslations] || recentMoods[recentMoods.length - 1]?.mood}.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || !apiKey.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const moodContext = getMoodContext();
      const systemPrompt = `Kamu adalah terapis AI yang membantu pengguna memahami dan mengelola emosi mereka. Berikan respons yang empati, mendukung, dan konstruktif dalam bahasa Indonesia. Gunakan pendekatan terapi kognitif-perilaku yang sederhana.

Konteks mood pengguna: ${moodContext}

Pedoman:
- Berikan dukungan emosional yang tulus
- Tawarkan teknik coping yang praktis
- Ajukan pertanyaan reflektif untuk membantu pemahaman diri
- Hindari diagnosis medis atau saran medis
- Gunakan bahasa yang hangat dan tidak menghakimi
- Jika situasi terlihat serius, sarankan untuk mencari bantuan profesional`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: input
            }
          ],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500,
          return_images: false,
          return_related_questions: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim pesan. Periksa API key dan koneksi internet.",
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

  if (showApiKeyInput && !apiKey) {
    return (
      <Card className="p-6">
        <div className="text-center mb-6">
          <Bot className="h-12 w-12 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-semibold mb-2">AI Therapist</h2>
          <p className="text-muted-foreground">Berbicara dengan AI untuk mendapatkan dukungan emosional</p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Untuk menggunakan fitur AI Therapist, Anda perlu memasukkan API key Perplexity AI. 
            <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              Dapatkan API key di sini
            </a>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Perplexity API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Masukkan API key Perplexity..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              API key disimpan sementara di browser dan tidak dikirim ke server kami
            </p>
          </div>
          <Button 
            onClick={() => {
              if (apiKey.trim()) {
                setShowApiKeyInput(false);
              } else {
                toast({
                  title: "Error",
                  description: "Silakan masukkan API key terlebih dahulu.",
                  variant: "destructive"
                });
              }
            }}
            className="w-full"
          >
            Mulai Chat dengan AI Therapist
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <Bot className="h-8 w-8 text-primary mx-auto mb-2" />
        <h2 className="text-xl font-semibold">AI Therapist</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowApiKeyInput(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Ganti API Key
        </Button>
      </div>

      <div className="space-y-4">
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Hai! Saya di sini untuk mendengarkan dan membantu. Ceritakan apa yang ada di pikiran Anda hari ini.</p>
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
                      {message.timestamp.toLocaleTimeString('id-ID', { 
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
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ceritakan perasaan atau pikiran Anda..."
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