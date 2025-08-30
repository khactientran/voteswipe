-- Create voting sessions table
CREATE TABLE public.voting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create images table
CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  oks INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  voter_name TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'ok', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(image_id, voter_name)
);

-- Enable RLS on all tables
ALTER TABLE public.voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a voting app)
CREATE POLICY "Anyone can view voting sessions" ON public.voting_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create voting sessions" ON public.voting_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update voting sessions" ON public.voting_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete voting sessions" ON public.voting_sessions FOR DELETE USING (true);

CREATE POLICY "Anyone can view images" ON public.images FOR SELECT USING (true);
CREATE POLICY "Anyone can create images" ON public.images FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update images" ON public.images FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete images" ON public.images FOR DELETE USING (true);

CREATE POLICY "Anyone can view votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Anyone can create votes" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update votes" ON public.votes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete votes" ON public.votes FOR DELETE USING (true);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('voting-images', 'voting-images', true);

-- Create storage policies
CREATE POLICY "Anyone can view voting images" ON storage.objects FOR SELECT USING (bucket_id = 'voting-images');
CREATE POLICY "Anyone can upload voting images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'voting-images');
CREATE POLICY "Anyone can update voting images" ON storage.objects FOR UPDATE USING (bucket_id = 'voting-images');
CREATE POLICY "Anyone can delete voting images" ON storage.objects FOR DELETE USING (bucket_id = 'voting-images');

-- Create function to update vote counts
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
$$ LANGUAGE plpgsql;

-- Create trigger for vote count updates
CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION update_image_vote_counts();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_voting_sessions_updated_at
  BEFORE UPDATE ON public.voting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();