import { Heart } from "lucide-react";

const VoteSwipeLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Heart className="w-8 h-8 text-accent fill-accent animate-pulse-glow" />
      </div>
      <span className="text-2xl font-bold text-foreground font-retro">
        VoteSwipe
      </span>
    </div>
  );
};

export default VoteSwipeLogo;