-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION update_image_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.images 
    SET 
      likes = (SELECT COUNT(*) FROM public.votes WHERE image_id = NEW.image_id AND vote_type = 'like'),
      oks = (SELECT COUNT(*) FROM public.votes WHERE image_id = NEW.image_id AND vote_type = 'ok'),
      dislikes = (SELECT COUNT(*) FROM public.votes WHERE image_id = NEW.image_id AND vote_type = 'dislike'),
      updated_at = now()
    WHERE id = NEW.image_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.images 
    SET 
      likes = (SELECT COUNT(*) FROM public.votes WHERE image_id = NEW.image_id AND vote_type = 'like'),
      oks = (SELECT COUNT(*) FROM public.votes WHERE image_id = NEW.image_id AND vote_type = 'ok'),
      dislikes = (SELECT COUNT(*) FROM public.votes WHERE image_id = NEW.image_id AND vote_type = 'dislike'),
      updated_at = now()
    WHERE id = NEW.image_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.images 
    SET 
      likes = (SELECT COUNT(*) FROM public.votes WHERE image_id = OLD.image_id AND vote_type = 'like'),
      oks = (SELECT COUNT(*) FROM public.votes WHERE image_id = OLD.image_id AND vote_type = 'ok'),
      dislikes = (SELECT COUNT(*) FROM public.votes WHERE image_id = OLD.image_id AND vote_type = 'dislike'),
      updated_at = now()
    WHERE id = OLD.image_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;