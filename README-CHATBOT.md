# Rasakuya Chatbot

A secure, production-ready chatbot powered by OpenRouter's free openai model.

## Features

- **Secure**: API key stored in Supabase Function Secrets, never exposed to client
- **Rate Limited**: 10 requests per minute per IP
- **Empathetic**: Designed to help users reflect on their feelings
- **Responsive**: Works on both desktop and mobile

## Architecture

- **Backend**: Supabase Edge Function (`chat-openrouter`)
- **Frontend**: React Chat page + Standalone HTML widget
- **AI Model**: 'openai/gpt-oss-20b:free' via OpenRouter

## Usage

### Chat Pages
- Main app: `/chat` - Integrated React component
- Standalone widget: `/chat/widget.html` - Embeddable HTML widget

### API Endpoint
```
POST https://nkbgomndiyagxrlowrje.supabase.co/functions/v1/chat-openrouter
```

Request body:
```json
{
  "message": "How are you feeling today?",
  "history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ]
}
```

Response:
```json
{
  "success": true,
  "answer": "AI response"
}
```

## Configuration

### Secrets Management
API keys are stored in Supabase Function Secrets:

1. **OPENROUTER_API_KEY**: Your OpenRouter API key
   - Navigate to: https://supabase.com/dashboard/project/nkbgomndiyagxrlowrje/settings/functions
   - Update the `OPENROUTER_API_KEY` secret

### System Prompt
To change the AI's personality, edit the system message in:
`supabase/functions/chat-openrouter/index.ts` line ~50:

```typescript
const systemMessage = {
  role: 'system',
  content: 'You are an empathetic, friendly assistant who helps users reflect on their feelings. Use a warm, concise tone.'
};
```

### Rate Limits
Current limits: 10 requests per minute per IP
To adjust, modify these constants in the edge function:
```typescript
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute
```

## Security

- ✅ API key never exposed to client
- ✅ CORS headers properly configured
- ✅ Rate limiting implemented
- ✅ Input validation
- ✅ Error handling
- ✅ Public function (no JWT required)

## Development

### Testing the Chat
1. Visit `/chat` in the app or `/chat/widget.html`
2. Type a message and press Send
3. Check browser Network tab - requests should go to your Supabase function, not openrouter.ai

### Rotating API Keys
1. Get new OpenRouter API key from https://openrouter.ai/
2. Update Supabase Function Secret: https://supabase.com/dashboard/project/nkbgomndiyagxrlowrje/settings/functions
3. No client-side changes needed

### Monitoring
- Function logs: https://supabase.com/dashboard/project/nkbgomndiyagxrlowrje/functions/chat-openrouter/logs
- Error tracking built into the function

## Model Information

Using openai (free tier):
- **Model**: 'openai/gpt-oss-20b:free'
- **Provider**: OpenRouter
- **Cost**: Free
- **Context**: Supports conversation history (last 10 messages)
- **Temperature**: 0.7 (balanced creativity/consistency)