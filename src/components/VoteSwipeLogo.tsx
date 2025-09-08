import foxIcon from "@/assets/foxIcon.png";

const VoteSwipeLogo = ({ className = "", isDarkMode = false }: { className?: string; isDarkMode?: boolean }) => {
  return (
    <div className={`flex items-center gap-1 xs:gap-2 ${className}`}>
      <div className="relative">
        <img 
          src={foxIcon} 
          alt="Fox Icon" 
          className="w-6 xs:w-7 md:w-8 h-6 xs:h-7 md:h-8" 
          style={{ imageRendering: 'pixelated' as any }}
        />
      </div>
      <span className={`text-lg xs:text-xl md:text-2xl font-bold font-retro ${
        isDarkMode ? 'text-white' : 'text-foreground'
      }`}>
        <span className="hidden xs:inline">Grand Team</span>
        <span className="xs:hidden">Grand Team</span>
      </span>
    </div>
  );
};

export default VoteSwipeLogo;