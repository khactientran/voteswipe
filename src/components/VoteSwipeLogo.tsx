import foxIcon from "@/assets/foxIcon.png";

const VoteSwipeLogo = ({ className = "", isDarkMode = false }: { className?: string; isDarkMode?: boolean }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <img 
          src={foxIcon} 
          alt="Fox Icon" 
          className="w-8 h-8 animate-pulse-glow" 
          style={{ imageRendering: 'pixelated' as any }}
        />
      </div>
      <span className={`text-2xl font-bold font-retro ${
        isDarkMode ? 'text-white' : 'text-foreground'
      }`}>
        Grand Team
      </span>
    </div>
  );
};

export default VoteSwipeLogo;