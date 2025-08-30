-- Make voter_name optional/display-only and keep uniqueness by voter_id

-- Allow NULL voter_name and enforce reasonable length
ALTER TABLE public.votes
  ALTER COLUMN voter_name DROP NOT NULL,
  ALTER COLUMN voter_name TYPE VARCHAR(64);

-- Replace the safety check to allow NULL and block control chars / formula-leading chars
ALTER TABLE public.votes
  DROP CONSTRAINT IF EXISTS votes_voter_name_safe_check;

ALTER TABLE public.votes
  ADD CONSTRAINT votes_voter_name_safe_check
  CHECK (
    voter_name IS NULL OR (
      voter_name !~ '^[=+\-@]' AND
      voter_name !~ '[[:cntrl:]]'
    )
  );

-- Normalize whitespace only when voter_name is provided
CREATE OR REPLACE FUNCTION public.trim_voter_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.voter_name IS NOT NULL THEN
    NEW.voter_name := regexp_replace(NEW.voter_name, '\\s+', ' ', 'g');
    NEW.voter_name := btrim(NEW.voter_name);
  END IF;
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

-- Refresh PostgREST schema cache in case this is applied outside CLI
NOTIFY pgrst, 'reload schema';

