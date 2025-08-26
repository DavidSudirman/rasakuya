-- Add unique constraint on user_id and logged_at to allow upserts
-- This ensures each user can only have one mood entry per day
ALTER TABLE public.mood_logs 
ADD CONSTRAINT unique_user_daily_mood 
UNIQUE (user_id, logged_at);