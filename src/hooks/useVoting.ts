import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VotingImage {
  id: string;
  session_id: string;
  name: string;
  url: string;
  likes: number;
  oks: number;
  dislikes: number;
}

export interface VotingSession {
  id: string;
  name: string;
  created_at: string;
}

export type VoteType = 'like' | 'ok' | 'dislike';

export const useVoting = (sessionId: string) => {
  const [session, setSession] = useState<VotingSession | null>(null);
  const [images, setImages] = useState<VotingImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, VoteType>>({});
  const { toast } = useToast();
  const autoAdvanceTimeoutRef = useRef<number | null>(null);

  const fetchSessionData = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      
      const [sessionResult, imagesResult] = await Promise.all([
        supabase
          .from('voting_sessions')
          .select('*')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('images')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
      ]);

      if (sessionResult.error && sessionResult.error.code !== 'PGRST116') {
        throw sessionResult.error;
      }

      if (imagesResult.error) {
        throw imagesResult.error;
      }

      setSession(sessionResult.data);
      setImages(imagesResult.data || []);

      // Load existing votes from localStorage with backward-compatible schema
      const voterId = localStorage.getItem('voterId');
      const voterName = localStorage.getItem('voterName');
      const imageIds = (imagesResult.data || []).map(img => img.id);
      if (voterId || voterName) {
        try {
          const { data, error } = await supabase
            .from('votes')
            .select('image_id, vote_type')
            .eq('voter_id', voterId as string)
            .in('image_id', imageIds);

          if (error && (error as any).code === 'PGRST204') {
            // Column voter_id not present yet; fallback to voter_name
            const { data: byName } = await supabase
              .from('votes')
              .select('image_id, vote_type')
              .eq('voter_name', voterName as string)
              .in('image_id', imageIds);
            const votesMap: Record<string, VoteType> = {};
            (byName || []).forEach(vote => {
              const vt = vote.vote_type as string;
              if (vt === 'like' || vt === 'ok' || vt === 'dislike') {
                votesMap[vote.image_id] = vt;
              }
            });
            setVotes(votesMap);
          } else {
            const votesMap: Record<string, VoteType> = {};
            (data || []).forEach(vote => {
              const vt = vote.vote_type as string;
              if (vt === 'like' || vt === 'ok' || vt === 'dislike') {
                votesMap[vote.image_id] = vt;
              }
            });
            setVotes(votesMap);
          }
        } catch (e) {
          // If anything unexpected, leave votes empty and continue
          console.warn('Failed to load existing votes', e);
        }
      }

    } catch (error) {
      console.error('Error fetching session data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load voting session',
        variant: 'destructive'
      });
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const castVote = async (imageId: string, voteType: VoteType) => {
    const voterId = localStorage.getItem('voterId');
    const voterName = localStorage.getItem('voterName') || '';
    if (!voterId) {
      toast({
        title: 'Error',
        description: 'Missing voter ID. Please return to the landing page to start.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // First, check if user has already voted for this image
      const existingVote = votes[imageId];
      
      if (existingVote === voteType) {
        // Same vote, do nothing
        return;
      }

      if (existingVote) {
        // Update existing vote (prefer voter_id; fallback to voter_name if column missing)
        const updateWithVoterId = async () => supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('image_id', imageId)
          .eq('voter_id', voterId);

        const { error: updateErr } = await updateWithVoterId();
        if (updateErr && (updateErr as any).code === 'PGRST204') {
          const { error: byNameErr } = await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('image_id', imageId)
            .eq('voter_name', voterName);
          if (byNameErr) throw byNameErr;
        } else if (updateErr) {
          throw updateErr;
        }
      } else {
        // Insert new vote (prefer voter_id; fallback to voter_name-only schema)
        const insertWithVoterId = async () => supabase
          .from('votes')
          .insert([{ image_id: imageId, voter_id: voterId, vote_type: voteType, voter_name: localStorage.getItem('voterName') || null as any }]);

        const { error: insertErr } = await insertWithVoterId();
        if (insertErr && (insertErr as any).code === 'PGRST204') {
          const { error: legacyInsertErr } = await supabase
            .from('votes')
            .insert([{ image_id: imageId, voter_name: localStorage.getItem('voterName') || '', vote_type: voteType }]);
          if (legacyInsertErr) throw legacyInsertErr;
        } else if (insertErr) {
          throw insertErr;
        }
      }

      // Update local state
      setVotes(prev => ({
        ...prev,
        [imageId]: voteType
      }));

      // Move to next image after a short delay (clear any prior pending advances)
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
      autoAdvanceTimeoutRef.current = window.setTimeout(() => {
        setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : prev));
        autoAdvanceTimeoutRef.current = null;
      }, 500);

      toast({
        title: 'Vote recorded!',
        description: `Your ${voteType} vote has been recorded.`,
      });

    } catch (error) {
      console.error('Error casting vote:', error);
      toast({
        title: 'Error',
        description: 'Failed to record your vote. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const nextImage = () => {
    // Clear any pending auto-advance so manual nav isn't overridden
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    // Non-looping: stop at the last image
    setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : prev));
  };

  const previousImage = () => {
    // Clear any pending auto-advance so manual nav isn't overridden
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    // Non-looping: stop at the first image
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const goToImage = (index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (sessionId && images.length > 0) {
      const votesChannel = supabase
        .channel('votes_realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'votes',
          filter: `image_id=in.(${images.map(img => img.id).join(',')})`
        }, () => {
          // Refetch images to get updated vote counts without blocking UI interactions
          fetchSessionData({ silent: true });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(votesChannel);
      };
    }
  }, [sessionId, images.length]);

  // Cleanup pending auto-advance on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    session,
    images,
    currentImageIndex,
    currentImage: images[currentImageIndex],
    votes,
    loading,
    hasNextImage: currentImageIndex < images.length - 1,
    hasPreviousImage: currentImageIndex > 0,
    castVote,
    nextImage,
    previousImage,
    goToImage,
    totalImages: images.length,
    completedVotes: Object.keys(votes).length
  };
};