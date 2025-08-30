import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VotingSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  image_count?: number;
  total_votes?: number;
}

export interface ImageWithVotes {
  id: string;
  session_id: string;
  name: string;
  url: string;
  likes: number;
  oks: number;
  dislikes: number;
  created_at: string;
  session_name?: string;
}

export const useVotingSessions = () => {
  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [images, setImages] = useState<ImageWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('voting_sessions')
        .select(`
          *,
          images(count)
        `)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      const sessionsWithCounts = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const [imagesResult, votesResult] = await Promise.all([
            supabase
              .from('images')
              .select('id')
              .eq('session_id', session.id),
            supabase
              .from('votes')
              .select('id')
              .in('image_id', 
                (await supabase
                  .from('images')
                  .select('id')
                  .eq('session_id', session.id)
                ).data?.map(img => img.id) || []
              )
          ]);

          return {
            ...session,
            image_count: imagesResult.data?.length || 0,
            total_votes: votesResult.data?.length || 0
          };
        })
      );

      setSessions(sessionsWithCounts);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch voting sessions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select(`
          *,
          voting_sessions(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const imagesWithSessionNames = (data || []).map(img => ({
        ...img,
        session_name: (img.voting_sessions as any)?.name || 'Unknown Session'
      }));

      setImages(imagesWithSessionNames);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch images',
        variant: 'destructive'
      });
    }
  };

  const createSession = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('voting_sessions')
        .insert([{ name }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Voting session created successfully'
      });

      fetchSessions();
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create voting session',
        variant: 'destructive'
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      // First delete all images from storage using full paths
      const { data: sessionImages } = await supabase
        .from('images')
        .select('url')
        .eq('session_id', sessionId);

      const getStoragePathFromPublicUrl = (publicUrl: string): string | null => {
        const marker = '/object/public/voting-images/';
        const idx = publicUrl.indexOf(marker);
        if (idx === -1) return null;
        const path = publicUrl.substring(idx + marker.length);
        return decodeURIComponent(path);
      };

      if (sessionImages && sessionImages.length > 0) {
        const paths = sessionImages
          .map((img) => getStoragePathFromPublicUrl(img.url))
          .filter((p): p is string => Boolean(p));
        if (paths.length > 0) {
          await supabase.storage
            .from('voting-images')
            .remove(paths);
        }
      }

      // Delete the session (cascades to images and votes)
      const { error } = await supabase
        .from('voting_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Session deleted successfully'
      });

      fetchSessions();
      fetchImages();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive'
      });
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      // Get image URL first
      const { data: imageData, error: fetchError } = await supabase
        .from('images')
        .select('url')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage using full path
      const getStoragePathFromPublicUrl = (publicUrl: string): string | null => {
        const marker = '/object/public/voting-images/';
        const idx = publicUrl.indexOf(marker);
        if (idx === -1) return null;
        const path = publicUrl.substring(idx + marker.length);
        return decodeURIComponent(path);
      };

      const storagePath = getStoragePathFromPublicUrl(imageData.url);
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('voting-images')
          .remove([storagePath]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Image deleted successfully'
      });

      fetchImages();
      fetchSessions();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive'
      });
    }
  };

  const uploadImages = async (sessionId: string, files: File[]) => {
    try {
      const uploadPromises = files.map(async (file) => {
        const fileName = `${sessionId}/${Date.now()}-${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('voting-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('voting-images')
          .getPublicUrl(fileName);

        const { data: imageData, error: imageError } = await supabase
          .from('images')
          .insert([{
            session_id: sessionId,
            name: file.name,
            url: publicUrl
          }])
          .select()
          .single();

        if (imageError) throw imageError;

        return imageData;
      });

      await Promise.all(uploadPromises);

      toast({
        title: 'Success',
        description: `${files.length} image(s) uploaded successfully`
      });

      fetchSessions();
      fetchImages();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload images',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchImages();

    // Set up real-time subscriptions
    const sessionsChannel = supabase
      .channel('voting_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voting_sessions' }, () => {
        fetchSessions();
      })
      .subscribe();

    const imagesChannel = supabase
      .channel('images_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'images' }, () => {
        fetchImages();
        fetchSessions();
      })
      .subscribe();

    const votesChannel = supabase
      .channel('votes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        fetchImages();
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(imagesChannel);
      supabase.removeChannel(votesChannel);
    };
  }, []);

  return {
    sessions,
    images,
    loading,
    createSession,
    deleteSession,
    deleteImage,
    uploadImages,
    refetch: () => {
      fetchSessions();
      fetchImages();
    }
  };
};