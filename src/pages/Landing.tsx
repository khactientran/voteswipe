import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import VoteSwipeLogo from "@/components/VoteSwipeLogo";
import FallingLeaves from "@/components/FallingLeaves";
import FloatingClouds from "@/components/FloatingClouds";
import FoxRunner from "@/components/FoxRunner";
import BonfireAnimation from "@/components/BonfireAnimation";
import heroImage from "@/assets/hero-image.jpeg";
import { ArrowRight, Users, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeVoterName } from "@/lib/utils";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";

const Landing = () => {
  const [voterName, setVoterName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { isMusicEnabled, isTransitioning, toggleMusic } = useBackgroundMusic(isDarkMode);



  useEffect(() => {
    const existingName = localStorage.getItem("voterName");
    if (existingName) setVoterName(existingName);
    // Create stable voterId if not present
    if (!localStorage.getItem("voterId")) {
      const voterId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("voterId", voterId);
    }
  }, []);

  const handleStartVoting = async () => {
    const cleaned = sanitizeVoterName(voterName);
    if (cleaned) {
      localStorage.setItem("voterName", cleaned);
    } else {
      localStorage.removeItem("voterName");
    }

    setLoading(true);
    try {
      // Fetch the latest created session
      const { data, error } = await supabase
        .from('voting_sessions')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate("/");
        return;
      }
      navigate(`/vote/${data.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background touch-manipulation">
      {/* Hero Section */}
      <section className="relative min-h-screen touch-manipulation overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated' as any }}
        />
        {/* Dark mode dimming overlay */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-500 ease-in-out pointer-events-none touch-none ${
            isDarkMode ? 'opacity-70' : 'opacity-0'
          }`}
          style={{ zIndex: 2, touchAction: 'none' }}
        />
        
        <FoxRunner scale={2} groundOffset="15%" isVisible={!isDarkMode} />
        {/* Clouds using images in top half */}
        <FloatingClouds count={6} isDarkMode={isDarkMode} />
        <FallingLeaves count={10} isDarkMode={isDarkMode} />
        {/* Bonfire animation - only active in dark mode */}
        <BonfireAnimation 
          isActive={isDarkMode} 
          scale={3} 
          verticalPosition="15%"
          horizontalPosition="10%"
        />
        <div className="relative min-h-screen" style={{ zIndex: 3 }}>
          <div className="container mx-auto px-3 xs:px-4 py-16 xs:py-20 md:py-24 lg:py-28 min-h-screen flex flex-col">
            {/* Admin Button - Top Left */}
            <div className="absolute top-2 xs:top-4 left-2 xs:left-4 z-20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/login")}
                className="text-sm px-3 py-1.5 h-8"
              >
                Admin
              </Button>
            </div>

            {/* Dark Mode & Audio Buttons - Top Right */}
            <div className="absolute top-2 xs:top-4 right-2 xs:right-4 z-20 flex flex-col gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className={`relative flex items-center gap-1.5 transition-all duration-300 overflow-hidden text-sm px-3 py-1.5 h-8 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-white to-gray-50 border-gray-200 text-gray-800 hover:from-gray-50 hover:to-white hover:border-gray-300 hover:text-gray-800 shadow-lg shadow-gray-100/80' 
                    : 'bg-gradient-to-r from-gray-900 to-black border-gray-700 text-white hover:from-gray-800 hover:to-gray-900 hover:border-gray-600 hover:text-white shadow-lg shadow-black/50'
                }`}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-3 h-3 text-amber-500 animate-pulse" />
                    <span className="font-medium">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3 h-3 text-blue-400" />
                    <span className="font-medium">Dark</span>
                  </>
                )}
                
                {/* Visual indicator dot */}
                <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-amber-400 shadow-sm shadow-amber-200' 
                    : 'bg-blue-400 shadow-sm shadow-blue-300'
                }`} />
              </Button>
              
              {/* Music Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMusic}
                disabled={isTransitioning}
                className={`relative flex items-center gap-1.5 transition-all duration-300 overflow-hidden text-sm px-3 py-1.5 h-8 ${
                  isMusicEnabled
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 shadow-lg shadow-green-100/80'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800 hover:from-red-100 hover:to-rose-100 hover:border-red-300 shadow-lg shadow-red-100/80'
                }`}
              >
                {isMusicEnabled ? (
                  <>
                    <Volume2 className={`w-3 h-3 text-green-600 ${isTransitioning ? 'animate-pulse' : ''}`} />
                    <span className="font-medium">On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3 h-3 text-red-600" />
                    <span className="font-medium">Off</span>
                  </>
                )}
                
                {/* Visual indicator dot */}
                <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isMusicEnabled
                    ? 'bg-green-400 shadow-sm shadow-green-200'
                    : 'bg-red-400 shadow-sm shadow-red-200'
                }`} />
              </Button>
            </div>
            <div className="relative text-center space-y-6 flex-1 flex flex-col justify-center -mt-12">
              <VoteSwipeLogo className="justify-center animate-float" isDarkMode={isDarkMode} />

              {/* Floating reaction icons removed per request */}
              
              <div className="space-y-4 font-retro">
                <h1 className={`text-4xl md:text-6xl font-bold drop-shadow-lg ${
                  isDarkMode ? 'text-white' : 'text-foreground'
                }`}>
                  Photo Contest
                </h1>
              </div>

              <Card className="max-w-md mx-auto p-6 bg-card/90 backdrop-blur-sm border-black/60 shadow-glow hover:shadow-medium transition-shadow">
                <div className="space-y-4">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="text-sm font-semibold">Ready? Enter your name!</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <Input
                      placeholder="Your name"
                      value={voterName}
                      onChange={(e) => setVoterName(e.target.value)}
                      className="text-center"
                    />
                    <Button 
                      onClick={handleStartVoting}
                      disabled={loading}
                      variant="hero"
                      size="lg"
                      className="w-full"
                    >
                      {loading ? 'Loading...' : 'Start Voting'} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Bottom text - Safe area for mobile navigation */}
            <div className="absolute bottom-6 pb-safe left-1/2 transform -translate-x-1/2 z-20" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <p className="text-xs xs:text-sm text-center retro-crt text-white/90 whitespace-nowrap">
                {isDarkMode ? 'The bonfire is dancing.' : 'The fox is running.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;