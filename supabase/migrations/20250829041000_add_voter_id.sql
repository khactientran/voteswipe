-- Add stable voter_id to votes and migrate uniqueness to (image_id, voter_id)

ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS voter_id TEXT;

-- Backfill voter_id from voter_name for existing records
UPDATE public.votes
SET voter_id = COALESCE(voter_id, voter_name)
WHERE voter_id IS NULL;

-- Make voter_id required
ALTER TABLE public.votes
  ALTER COLUMN voter_id SET NOT NULL;

-- Drop old unique constraint if it exists
ALTER TABLE public.votes
  DROP CONSTRAINT IF EXISTS votes_image_id_voter_name_key;

-- Ensure unique per image and voter_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'votes_image_id_voter_id_key'
  ) THEN
    ALTER TABLE public.votes
      ADD CONSTRAINT votes_image_id_voter_id_key UNIQUE (image_id, voter_id);
  END IF;
END $$;

-- Helpful index for lookups by voter_id
CREATE INDEX IF NOT EXISTS votes_voter_id_idx ON public.votes (voter_id);

