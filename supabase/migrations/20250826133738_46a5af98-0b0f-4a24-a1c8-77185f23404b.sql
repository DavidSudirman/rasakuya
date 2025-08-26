-- Update function to handle anxious mood
CREATE OR REPLACE FUNCTION public.set_mood_emoji_and_date()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Set emoji based on mood
  NEW.emoji := CASE NEW.mood
    WHEN 'sangat-bahagia' THEN '😄'
    WHEN 'bahagia' THEN '😊'
    WHEN 'netral' THEN '😐'
    WHEN 'sedih' THEN '😔'
    WHEN 'marah' THEN '😠'
    WHEN 'cemas' THEN '😰'
    ELSE '😐'
  END;
  
  -- Set mood_date from logged_at
  NEW.mood_date := DATE(NEW.logged_at);
  
  RETURN NEW;
END;
$function$;