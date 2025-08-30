import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import VoteSwipeLogo from "@/components/VoteSwipeLogo";
import FallingLeaves from "@/components/FallingLeaves";
import FloatingClouds from "@/components/FloatingClouds";
import FoxRunner from "@/components/FoxRunner";
import heroImage from "@/assets/hero-image.jpeg";
import { ArrowRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeVoterName } from "@/lib/utils";

const Landing = () => {
  const [voterName, setVoterName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated' as any }}
        />
        <FoxRunner scale={2} groundOffset="15%" />
        {/* Clouds using images in top half */}
        <FloatingClouds count={6} />
        <FallingLeaves count={10} />
        <div className="relative min-h-screen">
          <div className="container mx-auto px-4 py-24 md:py-28 min-h-screen flex flex-col">
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 z-10"
              onClick={() => navigate("/admin/login")}
            >
              Admin
            </Button>
            <div className="relative text-center space-y-8 flex-1 flex flex-col justify-center">
              <VoteSwipeLogo className="justify-center animate-float" />

              {/* Floating reaction icons removed per request */}
              
              <div className="space-y-4 font-retro">
                <h1 className="text-5xl md:text-7xl font-bold text-foreground drop-shadow-lg">
                  Swipe. Vote. Decide.
                </h1>
                <p className="text-xl md:text-2xl text-foreground/90 max-w-2xl mx-auto retro-crt">
                  The most engaging way to make group decisions. Upload images, share the link, and watch votes pour in real-time.
                </p>
              </div>

              <Card className="max-w-md mx-auto p-6 bg-card/90 backdrop-blur-sm border-black/60 shadow-glow hover:shadow-medium transition-shadow">
                <div className="space-y-4">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Ready to Vote?</h3>
                    <p className="text-foreground/70">Optionally enter your name and start</p>
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
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;