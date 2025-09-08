import heroImage from "@/assets/hero-image.jpeg";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import VoteSwipeLogo from "@/components/VoteSwipeLogo";
import { useVoting } from "@/hooks/useVoting";
import { useSwipe } from "@/hooks/useSwipe";
import QuickNavigator from "@/components/QuickNavigator";
import ImageScrubber from "@/components/ImageScrubber";
import { ArrowLeft, ArrowRight, Home, Loader2 } from "lucide-react";

const VotingPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [voterName, setVoterName] = useState<string>("");
  
  const {
    session,
    currentImage,
    currentImageIndex,
    votes,
    loading,
    castVote,
    nextImage,
    previousImage,
    hasNextImage,
    hasPreviousImage,
    images,
    goToImage,
    totalImages,
    completedVotes
  } = useVoting(sessionId || "");

  // Swipe support
  const imageContainerRef = useSwipe<HTMLDivElement>({
    onSwipeLeft: () => nextImage(),
    onSwipeRight: () => previousImage(),
    threshold: 40,
    restraint: 100,
    allowedTime: 600,
  });

  useEffect(() => {
    const savedVoterName = localStorage.getItem("voterName") || "";
    setVoterName(savedVoterName);
  }, [navigate]);

  // Keyboard navigation: arrows, Home, End, PageUp/PageDown
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable = (target as any)?.isContentEditable;
      if (tag === 'input' || tag === 'textarea' || isEditable) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (hasPreviousImage) previousImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (hasNextImage) nextImage();
          break;
        case 'Home':
          e.preventDefault();
          goToImage(0);
          break;
        case 'End':
          e.preventDefault();
          goToImage(totalImages - 1);
          break;
        case 'PageUp':
          e.preventDefault();
          if (hasPreviousImage) previousImage();
          break;
        case 'PageDown':
          e.preventDefault();
          if (hasNextImage) nextImage();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasPreviousImage, hasNextImage, previousImage, nextImage, goToImage, totalImages]);

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated' as any }}
        />
        <div className="relative flex items-center gap-2 text-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading voting session...</span>
        </div>
      </div>
    );
  }

  if (!session || totalImages === 0) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated' as any }}
        />
        <Card className="p-8 text-center max-w-md relative">
          <h1 className="text-2xl font-bold mb-4">
            {!session ? "Session Not Found" : "No Images Yet"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {!session 
              ? "The voting session doesn't exist or has been deleted."
              : "This session doesn't have any images to vote on yet."
            }
          </p>
          <Button onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  const progressPercentage = totalImages > 0 ? (completedVotes / totalImages) * 100 : 0;
  const currentVote = votes[currentImage?.id];

  return (
    <div className="min-h-screen relative">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated' as any }}
      />
      <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-6 md:py-8 relative">
        {/* Header */}
        <div className="flex justify-end items-center mb-4 xs:mb-6 md:mb-8">
          <div className="text-right text-foreground">
            <p className="text-xs xs:text-sm font-semibold">
              <span className="opacity-90">Voting as </span>
              {voterName || 'Anonymous'}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="text-center mb-4 xs:mb-6 text-foreground">
          <Badge variant="secondary" className="text-xs xs:text-sm md:text-base px-2 xs:px-3 py-1 xs:py-1.5 mb-2 xs:mb-3">
            Image {currentImageIndex + 1} of {totalImages}
          </Badge>
          <div className="max-w-xs xs:max-w-sm md:max-w-md mx-auto">
            <Progress value={progressPercentage} className="h-1 xs:h-1.5" />
            <p className="text-foreground/80 text-xs mt-1 xs:mt-2">{completedVotes} votes cast</p>
          </div>
        </div>

        {/* Main Voting Interface */}
        <div className="max-w-6xl mx-auto">
          <Card className="p-3 xs:p-4 md:p-6 lg:p-8 shadow-glow bg-card/90 backdrop-blur-sm">
            {/* Image Container */}
            <div className="relative mb-4 xs:mb-6 md:mb-8" ref={imageContainerRef}>
              <div className="bg-muted rounded-lg overflow-hidden shadow-medium h-[40vh] xs:h-[45vh] md:h-[55vh] lg:h-[60vh]">
                {currentImage && (
                  <img
                    src={currentImage.url}
                    alt={currentImage.name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              
              {/* Navigation Arrows */}
              <Button
                variant="outline"
                size="icon"
                className="hidden absolute left-4 top-1/2 -translate-y-1/2 bg-card/90 hover:bg-card z-20"
                onClick={previousImage}
                disabled
                aria-label="Previous image"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="hidden absolute right-4 top-1/2 -translate-y-1/2 bg-card/90 hover:bg-card z-20"
                onClick={nextImage}
                disabled
                aria-label="Next image"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Image Info */}
            <div className="text-center mb-4 xs:mb-6">
              <h2 className="text-base xs:text-lg md:text-xl lg:text-2xl font-semibold mb-2 max-w-full truncate mx-auto px-2">{currentImage?.name}</h2>
            </div>

            {/* Voting Buttons - Mobile Optimized */}
            <div className="grid grid-cols-3 gap-2 xs:gap-3 md:gap-4">
              <Button
                onClick={() => currentImage && castVote(currentImage.id, 'like')}
                size="sm"
                variant={currentVote === 'like' ? 'default' : 'outline'}
                className={`h-10 xs:h-12 md:h-14 text-xs xs:text-sm md:text-base font-semibold px-2 xs:px-3 md:px-4 flex items-center justify-center gap-1 xs:gap-2 ${
                  currentVote === 'like' 
                    ? 'bg-vote-like hover:bg-vote-like text-white' 
                    : 'hover:bg-vote-like hover:text-white hover:border-vote-like'
                }`}
              >
                <span className="text-lg xs:text-xl md:text-2xl">❤️</span>
                <span className="hidden xs:inline">Like</span>
              </Button>
              
              <Button
                onClick={() => currentImage && castVote(currentImage.id, 'ok')}
                size="sm"
                variant={currentVote === 'ok' ? 'default' : 'outline'}
                className={`h-10 xs:h-12 md:h-14 text-xs xs:text-sm md:text-base font-semibold px-2 xs:px-3 md:px-4 flex items-center justify-center gap-1 xs:gap-2 ${
                  currentVote === 'ok' 
                    ? 'bg-vote-ok hover:bg-vote-ok text-white' 
                    : 'hover:bg-vote-ok hover:text-white hover:border-vote-ok'
                }`}
              >
                <span className="text-lg xs:text-xl md:text-2xl">🙂</span>
                <span className="hidden xs:inline">OK</span>
              </Button>
              
              <Button
                onClick={() => currentImage && castVote(currentImage.id, 'dislike')}
                size="sm"
                variant={currentVote === 'dislike' ? 'default' : 'outline'}
                className={`h-10 xs:h-12 md:h-14 text-xs xs:text-sm md:text-base font-semibold px-2 xs:px-3 md:px-4 flex items-center justify-center gap-1 xs:gap-2 ${
                  currentVote === 'dislike' 
                    ? 'bg-vote-dislike hover:bg-vote-dislike text-white' 
                    : 'hover:bg-vote-dislike hover:text-white hover:border-vote-dislike'
                }`}
              >
                <span className="text-lg xs:text-xl md:text-2xl">👎</span>
                <span className="hidden xs:inline">Don't Like</span>
              </Button>
            </div>

            {/* Image Scrubber for large sessions */}
            <div className="mt-8">
              <ImageScrubber
                count={totalImages}
                value={currentImageIndex}
                onChange={(idx) => goToImage(idx)}
              />
            </div>
          </Card>

          {/* Quick Navigator */}
          <div className="mt-6">
            <QuickNavigator
              items={images.map(img => ({ id: img.id, url: img.url, name: img.name }))}
              currentIndex={currentImageIndex}
              onSelect={(idx) => goToImage(idx)}
              votes={votes}
            />
          </div>

          {/* Completion Message */}
          {completedVotes === totalImages && (
            <Card className="mt-6 p-6 text-center bg-card/90 border-primary/20">
              <h3 className="text-xl font-semibold mb-2 text-foreground">🎉 All done!</h3>
              <p className="text-foreground mb-4">
                Thank you for voting on all {totalImages} images.
              </p>
              <Button onClick={() => navigate("/")}>Return Home</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingPage;