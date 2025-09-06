import { useEffect, useRef, useState } from 'react';
import LightBG from '@/assets/LightBG.mp3';
import DarkBG from '@/assets/DarkBG.mp3';

export const useBackgroundMusic = (isDarkMode: boolean) => {
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lightAudioRef = useRef<HTMLAudioElement | null>(null);
  const darkAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio elements
  useEffect(() => {
    lightAudioRef.current = new Audio(LightBG);
    darkAudioRef.current = new Audio(DarkBG);

    // Set audio properties
    [lightAudioRef.current, darkAudioRef.current].forEach(audio => {
      audio.loop = true;
      audio.volume = 0;
      audio.preload = 'auto';
    });

    return () => {
      // Cleanup
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      [lightAudioRef.current, darkAudioRef.current].forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  // Smooth fade function
  const fadeAudio = (audioFrom: HTMLAudioElement | null, audioTo: HTMLAudioElement | null, duration = 1000) => {
    if (!audioFrom || !audioTo) return;

    setIsTransitioning(true);
    const steps = 50;
    const stepTime = duration / steps;
    const volumeStep = 0.7 / steps; // Target volume is 0.7

    let currentStep = 0;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    // Start the new audio at volume 0
    audioTo.volume = 0;
    audioTo.play().catch(console.error);

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      
      // Fade out current audio
      if (audioFrom.volume > 0) {
        audioFrom.volume = Math.max(0, audioFrom.volume - volumeStep);
      }
      
      // Fade in new audio
      if (audioTo.volume < 0.7) {
        audioTo.volume = Math.min(0.7, audioTo.volume + volumeStep);
      }

      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }
        audioFrom.pause();
        audioFrom.currentTime = 0;
        audioTo.volume = 0.7;
        setIsTransitioning(false);
      }
    }, stepTime);
  };

  // Handle mode changes
  useEffect(() => {
    if (!isMusicEnabled || !lightAudioRef.current || !darkAudioRef.current) return;

    const currentAudio = isDarkMode ? lightAudioRef.current : darkAudioRef.current;
    const targetAudio = isDarkMode ? darkAudioRef.current : lightAudioRef.current;

    // If no audio is currently playing, start the target audio
    if (currentAudio.paused && targetAudio.paused) {
      targetAudio.volume = 0.7;
      targetAudio.play().catch(console.error);
    } else if (!currentAudio.paused) {
      // Smooth transition between audios
      fadeAudio(currentAudio, targetAudio);
    }
  }, [isDarkMode, isMusicEnabled]);

  // Handle music enable/disable
  useEffect(() => {
    if (!lightAudioRef.current || !darkAudioRef.current) return;

    if (isMusicEnabled) {
      const targetAudio = isDarkMode ? darkAudioRef.current : lightAudioRef.current;
      targetAudio.volume = 0.7;
      targetAudio.play().catch(console.error);
    } else {
      // Fade out and stop all audio
      [lightAudioRef.current, darkAudioRef.current].forEach(audio => {
        if (!audio.paused) {
          const fadeOut = () => {
            if (audio.volume > 0.1) {
              audio.volume = Math.max(0, audio.volume - 0.1);
              setTimeout(fadeOut, 50);
            } else {
              audio.pause();
              audio.currentTime = 0;
              audio.volume = 0;
            }
          };
          fadeOut();
        }
      });
    }
  }, [isMusicEnabled, isDarkMode]);

  const toggleMusic = () => {
    setIsMusicEnabled(!isMusicEnabled);
  };

  return {
    isMusicEnabled,
    isTransitioning,
    toggleMusic
  };
};
