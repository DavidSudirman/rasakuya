-- Update mood_logs table to better fit RasakuYa! app
ALTER TABLE public.mood_logs 
DROP COLUMN IF EXISTS energy_level,
DROP COLUMN IF EXISTS activities,
DROP COLUMN IF EXISTS notes;

-- Add emoji column for mood display
ALTER TABLE public.mood_logs 
ADD COLUMN emoji text NOT NULL DEFAULT '😐';

-- Update existing mood entries to have emojis
UPDATE public.mood_logs 
SET emoji = CASE 
  WHEN mood = 'sangat-bahagia' THEN '😄'
  WHEN mood = 'bahagia' THEN '😊'
  WHEN mood = 'netral' THEN '😐'
  WHEN mood = 'sedih' THEN '😔'
  WHEN mood = 'marah' THEN '😠'
  ELSE '😐'
END;

-- Create a function to get mood emoji based on mood text
CREATE OR REPLACE FUNCTION public.get_mood_emoji(mood_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN mood_text = 'sangat-bahagia' THEN '😄'
    WHEN mood_text = 'bahagia' THEN '😊'
    WHEN mood_text = 'netral' THEN '😐'
    WHEN mood_text = 'sedih' THEN '😔'
    WHEN mood_text = 'marah' THEN '😠'
    ELSE '😐'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a trigger to automatically set emoji when mood is inserted/updated
CREATE OR REPLACE FUNCTION public.set_mood_emoji()
RETURNS TRIGGER AS $$
BEGIN
  NEW.emoji = public.get_mood_emoji(NEW.mood);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_mood_emoji_trigger
  BEFORE INSERT OR UPDATE ON public.mood_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mood_emoji();

-- Add unique constraint to prevent multiple mood entries per day per user
ALTER TABLE public.mood_logs 
ADD CONSTRAINT unique_user_date_mood 
UNIQUE (user_id, DATE(logged_at));

-- Update profiles table to include display_name for Indonesian users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS bio text;

-- Update the handle_new_user function for Indonesian defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, display_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'name', 'Pengguna Baru'),
    COALESCE(new.raw_user_meta_data ->> 'display_name', 'Pengguna RasakuYa!')
  );
  
  RETURN new;
END;
$$;