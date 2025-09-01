import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple in-memory rate limiting
interface RateLimit {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimit>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(key);
  
  if (!limit || now > limit.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  limit.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Rate limiting
  const rateLimitKey = getRateLimitKey(req);
  if (!checkRateLimit(rateLimitKey)) {
    return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, history = [], language = 'id' } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      console.error('OpenRouter API key not found');
      return new Response(JSON.stringify({ success: false, error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build messages array - system prompt + last 10 history + current message
    const systemPrompt = language === 'en' 
      ? `You're ARUNA, like that friend who's always there for you 💙 You're straightforward, caring, and real - no fancy therapist talk, just genuine support.

How you chat:
- Keep it simple and honest, like texting a close friend
- Give practical advice that actually helps 
- Use casual language - be yourself, not robotic
- Throw in some emojis to keep it warm and friendly
- If someone's really struggling, gently suggest they talk to a professional too
- Focus on what they can do right now to feel better

You're not here to diagnose or be all clinical - you're here to listen, understand, and be that supportive friend who helps them figure things out.

Example: "Hey there! 😊 I'm ARUNA - think of me as that friend who's always got your back. What's going on with you today? I'm here to listen and help however I can."`
      : `Kamu adalah ARUNA, seperti teman yang selalu ada buat kamu 💙 Kamu straightforward, caring, dan real - nggak pakai bahasa terapis yang kaku, tapi dukungan yang tulus.

Cara kamu ngobrol:
- Santai dan jujur aja, kayak chat sama sahabat dekat
- Kasih saran praktis yang beneran bisa membantu
- Pakai bahasa sehari-hari - be yourself, jangan kaku
- Sesekali pakai emoji biar hangat dan friendly
- Kalau ada yang bener-bener butuh bantuan serius, pelan-pelan saranin untuk bicara sama profesional juga
- Fokus pada apa yang bisa mereka lakukan sekarang buat merasa lebih baik

Kamu bukan buat diagnosa atau sok klinis - kamu di sini buat dengerin, ngerti, dan jadi teman supportif yang bantu mereka mikir jernih.

Contoh: "Hai! 😊 Aku ARUNA - anggap aku kayak teman yang selalu ada buat kamu. Ada apa hari ini? Aku di sini buat dengerin dan bantu sebisaku."`;

    const systemMessage = {
      role: 'system',
      content: systemPrompt
    };

    const recentHistory = history.slice(-10); // Keep last 10 messages
    const messages = [systemMessage, ...recentHistory, { role: 'user', content: message }];

    console.log('Sending request to OpenRouter with model: deepseek/deepseek-chat');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://rasakuya.lovable.app/',
        'X-Title': 'Rasakuya! Chatbot',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'The AI service is temporarily busy. Please try again in a few moments.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `AI service temporarily unavailable. Please try again later.` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected response format from OpenRouter:', data);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unexpected response format from AI service' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const answer = data.choices[0].message.content;

    return new Response(JSON.stringify({ success: true, answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-openrouter function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});