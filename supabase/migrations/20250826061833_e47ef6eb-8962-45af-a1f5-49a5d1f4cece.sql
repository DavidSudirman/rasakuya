
-- Add description column to mood_logs table
ALTER TABLE public.mood_logs 
ADD COLUMN description TEXT;

-- Update the existing function to handle description
CREATE OR REPLACE FUNCTION public.set_mood_emoji_and_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set emoji based on mood
  NEW.emoji := CASE NEW.mood
    WHEN 'sangat-bahagia' THEN '😄'
    WHEN 'bahagia' THEN '😊'
    WHEN 'netral' THEN '😐'
    WHEN 'sedih' THEN '😔'
    WHEN 'marah' THEN '😠'
    ELSE '😐'
  END;
  
  -- Set mood_date from logged_at
  NEW.mood_date := DATE(NEW.logged_at);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
