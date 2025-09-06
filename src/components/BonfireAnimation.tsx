import { useEffect, useRef, useState } from "react";
import bonfire1 from "@/assets/Bonfire/Bonfire_1.png";
import bonfire2 from "@/assets/Bonfire/Bonfire_2.png";
import bonfire3 from "@/assets/Bonfire/Bonfire_3.png";
import bonfire4 from "@/assets/Bonfire/Bonfire_4.png";

const BONFIRE_FRAMES = [bonfire1, bonfire2, bonfire3, bonfire4];
const FRAME_DURATION_MS = 200; // ~200ms per frame for a nice fire flicker
const DEFAULT_SCALE = 3; // Default scale for pixel art

type BonfireAnimationProps = {
  isActive?: boolean;
  scale?: number;
  groundOffset?: string | number; // CSS bottom value (e.g., '10%' or 24)
  horizontalPosition?: string | number; // CSS right/left value (e.g., '2rem' or 50)
  verticalPosition?: string | number; // CSS bottom value (e.g., '5%' or 24) - alias for groundOffset
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'; // Preset positions
  className?: string;
};

const BonfireAnimation = ({ 
  isActive = false, 
  scale = DEFAULT_SCALE, 
  groundOffset = "5%",
  horizontalPosition="2rem",
  verticalPosition="5%",
  position = 'bottom-right',
  className = ""
}: BonfireAnimationProps) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Calculate position based on props
  const getPositionStyles = () => {
    // Use verticalPosition if provided, otherwise use groundOffset
    const bottom = typeof verticalPosition !== 'undefined' 
      ? (typeof verticalPosition === "number" ? `${verticalPosition}px` : verticalPosition)
      : (typeof groundOffset === "number" ? `${groundOffset}px` : groundOffset);

    // Handle preset positions
    if (position && !horizontalPosition) {
      switch (position) {
        case 'bottom-left':
          return {
            left: "2rem",
            bottom,
            transformOrigin: "bottom left",
          };
        case 'bottom-center':
          return {
            left: "50%",
            bottom,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "bottom center",
          };
        case 'bottom-right':
        default:
          return {
            right: "2rem",
            bottom,
            transformOrigin: "bottom right",
          };
      }
    }

    // Handle custom horizontal position
    if (horizontalPosition) {
      const isLeftPosition = typeof horizontalPosition === 'string' && horizontalPosition.includes('left');
      const horizontalValue = typeof horizontalPosition === "number" ? `${horizontalPosition}px` : horizontalPosition;
      
      if (isLeftPosition || (typeof horizontalPosition === 'number' && horizontalPosition < 0)) {
        return {
          left: typeof horizontalPosition === 'number' ? `${Math.abs(horizontalPosition)}px` : horizontalValue.replace('left:', ''),
          bottom,
          transformOrigin: "bottom left",
        };
      } else {
        return {
          right: horizontalValue,
          bottom,
          transformOrigin: "bottom right",
        };
      }
    }

    // Default to bottom-right
    return {
      right: "2rem",
      bottom,
      transformOrigin: "bottom right",
    };
  };

  useEffect(() => {
    if (isActive) {
      // Start animation
      intervalRef.current = window.setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % BONFIRE_FRAMES.length);
      }, FRAME_DURATION_MS);
    } else {
      // Stop animation and reset to first frame
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentFrame(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  const positionStyles = getPositionStyles();
  const baseTransform = positionStyles.transform || `scale(${scale})`;

  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{
        position: "absolute",
        zIndex: 10,
        transform: baseTransform,
        ...positionStyles,
      }}
    >
      {/* Realistic flickering fire halo */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle, rgba(255, 140, 0, 0.5) 0%, rgba(255, 69, 0, 0.4) 25%, rgba(255, 0, 0, 0.25) 45%, transparent 65%)",
          transform: "scale(2.8) translateY(25%)",
          transformOrigin: "center bottom",
          filter: "blur(12px)",
          zIndex: -1,
          animation: "fire-flicker-inner 0.4s ease-in-out infinite alternate",
        }}
      />
      
      {/* Medium glow layer */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle, rgba(255, 100, 0, 0.3) 0%, rgba(255, 50, 0, 0.2) 35%, transparent 70%)",
          transform: "scale(3.5) translateY(20%)",
          transformOrigin: "center bottom",
          filter: "blur(16px)",
          zIndex: -2,
          animation: "fire-flicker-medium 0.6s ease-in-out infinite alternate",
        }}
      />
      
      {/* Outer atmospheric glow */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle, rgba(255, 80, 0, 0.15) 0%, rgba(200, 50, 0, 0.1) 40%, transparent 80%)",
          transform: "scale(5) translateY(15%)",
          transformOrigin: "center bottom",
          filter: "blur(24px)",
          zIndex: -3,
          animation: "fire-flicker-outer 1s ease-in-out infinite alternate",
        }}
      />
      
      <img
        src={BONFIRE_FRAMES[currentFrame]}
        alt="Animated bonfire"
        style={{
          imageRendering: "pixelated" as any,
          display: "block",
          filter: "brightness(1.2) contrast(1.1)",
        }}
        className="drop-shadow-lg relative z-10"
      />
    </div>
  );
};

export default BonfireAnimation;
