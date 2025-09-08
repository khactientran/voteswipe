import { useState } from "react";
import heroImage from "@/assets/hero-image.jpeg";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import VoteSwipeLogo from "@/components/VoteSwipeLogo";
import { Lock, Mail } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Mock authentication - replace with real auth once Supabase is connected
    if (email === "admin" && password === "qwe@123") {
      localStorage.setItem("adminToken", "authenticated");
      navigate("/admin/dashboard");
    } else {
      setError("Invalid credentials");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-3 xs:p-4">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated' as any }}
      />
      <div className="w-full max-w-xs xs:max-w-sm md:max-w-md relative">
        <div className="text-center mb-6 xs:mb-8 font-retro">
          <VoteSwipeLogo className="justify-center mb-3 xs:mb-4 scale-75 xs:scale-100" />
          <h1 className="text-xl xs:text-2xl md:text-3xl font-bold text-foreground mb-2">Admin Portal</h1>
          <p className="text-sm xs:text-base text-foreground/80 retro-crt">Sign in to manage voting sessions</p>
        </div>

        <Card className="p-4 xs:p-6 md:p-8 shadow-glow bg-card/90 backdrop-blur-sm border-white/20">
          <form onSubmit={handleLogin} className="space-y-4 xs:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs xs:text-sm font-medium">
                Username
              </Label>
              <div className="relative">
                <Mail className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 w-3 xs:w-4 h-3 xs:h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-8 xs:pl-10 text-sm xs:text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs xs:text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 w-3 xs:w-4 h-3 xs:h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-8 xs:pl-10 text-sm xs:text-base"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-2 xs:p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs xs:text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full text-sm xs:text-base"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 xs:mt-6 text-center text-xs xs:text-sm text-muted-foreground">
            <p>Demo credentials:</p>
            <p className="font-mono text-xs mt-1">
              admin / qwe@123
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;