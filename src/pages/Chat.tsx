import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// ✅ NEW: mic hook
import { useSpeech } from '@/hooks/useSpeech';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // ===== Mic setup =====
  // Toggle this if you want auto-send right after user stops speaking:
  const AUTO_SEND_ON_STOP = false;

  const {
    supported: micSupported,
    isListening,
    transcript,
    error: micError,
    start: startMic,
    stop: stopMic,
    reset: resetMic,
  } = useSpeech({ language: 'id-ID', continuous: true, interimResults: true });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm here to help you reflect on your feelings. How are you doing today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageIdCounter, setMessageIdCounter] = useState(2);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Show mic permission/other errors nicely
  useEffect(() => {
    if (micError) {
      toast({
        title: "Microphone error",
        description: micError,
        variant: "destructive",
      });
    }
  }, [micError, toast]);

  // When user stops speaking, place transcript into the input (and optionally auto-send)
  useEffect(() => {
    if (!isListening && transcript) {
      setCurrentMessage(prev => (prev ? (prev + " " + transcript).trim() : transcript));
      if (AUTO_SEND_ON_STOP) {
        // simulate pressing Send
        setTimeout(() => {
          const fakeEvt = { preventDefault: () => {} } as unknown as React.FormEvent;
          // only send if not loading and we still have content
          if (!isLoading) sendMessage(fakeEvt, transcript);
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const sendMessage = async (e: React.FormEvent, override?: string) => {
    e.preventDefault();
    const toSend = (override ?? currentMessage).trim();
    if (!toSend || isLoading) return;

    const userMessage: Message = {
      id: messageIdCounter,
      role: 'user',
      content: toSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageIdCounter(prev => prev + 1);
    if (!override) setCurrentMessage('');
    setIsLoading(true);

    try {
      const history = messages
        .slice(1) // Exclude the initial greeting
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('https://nkbgomndiyagxrlowrje.supabase.co/functions/v1/chat-openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: toSend, history })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: messageIdCounter + 1,
          role: 'assistant',
          content: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMessage]);
        setMessageIdCounter(prev => prev + 1);
      } else {
        const errorMessage: Message = {
          id: messageIdCounter + 1,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${data.error}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMessage]);
        setMessageIdCounter(prev => prev + 1);
        toast({ title: "Chat Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: messageIdCounter + 1,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
      setMessageIdCounter(prev => prev + 1);
      toast({
        title: "Connection Error",
        description: "Unable to connect to the chat service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // after sending from voice, clear transcript so it doesn't append next time
      if (override) resetMic();
    }
  };

  // Toggle mic handler (single button behavior)
  const onMicClick = () => {
    if (!micSupported) {
      toast({
        title: "Mic not supported",
        description: "Use Chrome/Edge, or we can switch to server STT (Whisper).",
        variant: "destructive",
      });
      return;
    }
    if (isListening) {
      stopMic(); // stopping triggers transcript->input via the useEffect above
    } else {
      resetMic();
      startMic();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="h-[80vh] flex flex-col">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Rasakuya Chat</CardTitle>
            <p className="text-blue-100">Your empathetic AI companion</p>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="border-t p-4">
              <form onSubmit={(e) => sendMessage(e)} className="flex gap-2 items-center">
                {/* MIC BUTTON */}
                <Button
                  type="button"
                  onClick={onMicClick}
                  variant={isListening ? 'destructive' : 'default'}
                  className={isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}
                  title={isListening ? 'Stop listening' : 'Start listening'}
                >
                  {isListening ? '⏹️' : '🎙️'}
                </Button>

                {/* TEXT INPUT */}
                <Input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={micSupported ? (isListening ? "Listening… speak now" : "Type your message or tap the mic") : "Type your message…"}
                  disabled={isLoading}
                  className="flex-1"
                />

                {/* SEND */}
                <Button
                  type="submit"
                  disabled={isLoading || !currentMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Send
                </Button>
              </form>

              {/* optional live transcript preview */}
              {transcript && (
                <p className="mt-2 text-xs text-gray-500">
                  🎧 Transcript: <span className="italic">{transcript}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;