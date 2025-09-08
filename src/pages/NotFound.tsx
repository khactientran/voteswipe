import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm xs:max-w-md">
        <h1 className="text-3xl xs:text-4xl md:text-5xl font-bold mb-3 xs:mb-4 text-foreground">404</h1>
        <p className="text-base xs:text-lg md:text-xl text-muted-foreground mb-4 xs:mb-6">Oops! Page not found</p>
        <a href="/" className="text-primary hover:text-primary/80 underline text-sm xs:text-base transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
