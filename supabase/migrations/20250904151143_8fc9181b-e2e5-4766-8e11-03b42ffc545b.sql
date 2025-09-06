-- Add aruna_preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN aruna_preferences TEXT;