-- Constrain voter_name to safe length and characters, and strip control characters

-- Ensure a reasonable maximum length
ALTER TABLE public.votes
  ALTER COLUMN voter_name TYPE VARCHAR(64);

-- Create a check to prevent leading dangerous CSV formula characters and control chars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_voter_name_safe_check'
  ) THEN
    ALTER TABLE public.votes
      ADD CONSTRAINT votes_voter_name_safe_check
      CHECK (
        voter_name IS NOT NULL AND
        voter_name !~ '^[=+\-@]' AND
        voter_name !~ '[\u0000-\u001F\u007F]'
      );
  END IF;
END $$;

-- Optional: trim whitespace via trigger to standardize
CREATE OR REPLACE FUNCTION public.trim_voter_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.voter_name := regexp_replace(coalesce(NEW.voter_name, ''), '\s+', ' ', 'g');
  NEW.voter_name := btrim(NEW.voter_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'votes_trim_voter_name' 
  ) THEN
    CREATE TRIGGER votes_trim_voter_name
      BEFORE INSERT OR UPDATE ON public.votes
      FOR EACH ROW EXECUTE FUNCTION public.trim_voter_name();
  END IF;
END $$;

