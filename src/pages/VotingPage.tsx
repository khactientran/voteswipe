import heroImage from "@/assets/hero-image.jpeg";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import VoteSwipeLogo from "@/components/VoteSwipeLogo";
import { useVoting } from "@/hooks/useVoting";
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
    hasNextImage,
    hasPreviousImage,
    castVote,
    nextImage,
    previousImage,
    totalImages,
    completedVotes
  } = useVoting(sessionId || "");

  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40;
    if (deltaX > threshold) previousImage();
    if (deltaX < -threshold) nextImage();
    touchStartX.current = null;
  };

  useEffect(() => {
    const savedVoterName = localStorage.getItem("voterName") || "";
    setVoterName(savedVoterName);
  }, [navigate]);

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
      <div className="container mx-auto px-4 py-8 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <VoteSwipeLogo />
          <div className="text-right text-foreground">
            <p className="text-sm opacity-90">Voting as</p>
            <p className="font-semibold">{voterName || 'Anonymous'}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="text-center mb-4 text-foreground">
          <Badge variant="secondary" className="text-lg px-4 py-2 mb-4">
            Image {currentImageIndex + 1} of {totalImages}
          </Badge>
          <div className="max-w-md mx-auto">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-foreground/80 text-sm mt-2">{completedVotes} votes cast</p>
          </div>
        </div>

        {/* Main Voting Interface */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 shadow-glow bg-card/90 backdrop-blur-sm">
            {/* Image Container */}
            <div className="relative mb-8">
              <div
                className="aspect-video bg-muted rounded-lg overflow-hidden shadow-medium"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {currentImage && (
                  <img
                    src={currentImage.url}
                    alt={currentImage.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {/* Click/tap overlay zones for previous/next */}
              <div
                className="absolute inset-y-0 left-0 w-1/2 z-10"
                onClick={previousImage}
                aria-label="Previous image"
                role="button"
              />
              <div
                className="absolute inset-y-0 right-0 w-1/2 z-10"
                onClick={nextImage}
                aria-label="Next image"
                role="button"
              />
              
              {/* Navigation Arrows */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-card/90 hover:bg-card z-20"
                onClick={previousImage}
                disabled={!hasPreviousImage}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-card/90 hover:bg-card z-20"
                onClick={nextImage}
                disabled={!hasNextImage}
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Image Info */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 max-w-full truncate mx-auto">{currentImage?.name}</h2>
              {currentVote && (
                <Badge variant="outline" className="text-sm">
                  Your vote: {currentVote === 'like' ? '❤️ Like' : currentVote === 'ok' ? '🙂 OK' : '👎 Don\'t Like'}
                </Badge>
              )}
            </div>

            {/* Voting Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => currentImage && castVote(currentImage.id, 'like')}
                size="lg"
                variant={currentVote === 'like' ? 'default' : 'outline'}
                className={`h-16 text-lg font-semibold ${
                  currentVote === 'like' 
                    ? 'bg-vote-like hover:bg-vote-like text-white' 
                    : 'hover:bg-vote-like hover:text-white hover:border-vote-like'
                }`}
              >
                <span className="mr-2 text-xl">❤️</span>
                Like
              </Button>
              
              <Button
                onClick={() => currentImage && castVote(currentImage.id, 'ok')}
                size="lg"
                variant={currentVote === 'ok' ? 'default' : 'outline'}
                className={`h-16 text-lg font-semibold ${
                  currentVote === 'ok' 
                    ? 'bg-vote-ok hover:bg-vote-ok text-white' 
                    : 'hover:bg-vote-ok hover:text-white hover:border-vote-ok'
                }`}
              >
                <span className="mr-2 text-xl">🙂</span>
                OK
              </Button>
              
              <Button
                onClick={() => currentImage && castVote(currentImage.id, 'dislike')}
                size="lg"
                variant={currentVote === 'dislike' ? 'default' : 'outline'}
                className={`h-16 text-lg font-semibold ${
                  currentVote === 'dislike' 
                    ? 'bg-vote-dislike hover:bg-vote-dislike text-white' 
                    : 'hover:bg-vote-dislike hover:text-white hover:border-vote-dislike'
                }`}
              >
                <span className="mr-2 text-xl">👎</span>
                Don't Like
              </Button>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.min(totalImages, 10) }, (_, i) => {
                const imageIndex = i;
                return (
                  <div
                    key={imageIndex}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      imageIndex === currentImageIndex
                        ? 'bg-primary scale-125'
                        : imageIndex < currentImageIndex
                        ? 'bg-accent'
                        : 'bg-muted'
                    }`}
                  />
                );
              })}
            </div>
          </Card>

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