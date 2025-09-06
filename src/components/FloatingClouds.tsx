import { useEffect, useMemo, useRef } from "react";
import cloud1 from "@/assets/Clouds/1.png";
import cloud6 from "@/assets/Clouds/6.png";
import cloud7 from "@/assets/Clouds/7.png";
import cloud9 from "@/assets/Clouds/9.png";
import cloud10 from "@/assets/Clouds/10.png";
import cloud17 from "@/assets/Clouds/17.png";
import cloud19_1 from "@/assets/Clouds/19.1.png";
import cloud23 from "@/assets/Clouds/23.png";

const CLOUD_IMAGES = [
  cloud1,
  cloud6,
  cloud7,
  cloud9,
  cloud10,
  cloud17,
  cloud19_1,
  cloud23,
];

type Cloud = {
  x: number;
  y: number;
  speedX: number; // px per second
  bobAmplitude: number; // px
  bobSpeed: number; // radians per second
  bobPhase: number; // radians
  scale: number; // 0..1
  opacity: number; // 0..1
  src: string;
};

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createCloud(viewportWidth: number, viewportHeight: number): Cloud {
  const halfTop = Math.max(0, viewportHeight * 0.4);
  return {
    x: -randomInRange(80, 240),
    y: randomInRange(0, halfTop),
    speedX: randomInRange(8, 32),
    bobAmplitude: randomInRange(2, 10),
    bobSpeed: randomInRange(0.4, 1.2),
    bobPhase: randomInRange(0, Math.PI * 2),
    scale: randomInRange(1, 2),
    opacity: randomInRange(0.8, 1),
    src: CLOUD_IMAGES[Math.floor(Math.random() * CLOUD_IMAGES.length)] ?? CLOUD_IMAGES[0],
  };
}

export default function FloatingClouds({ count = 5, isDarkMode = false }: { count?: number; isDarkMode?: boolean }) {
  const cloudElsRef = useRef<HTMLDivElement[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const lastRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  const initialCount = useMemo(() => Math.max(1, Math.min(24, count)), [count]);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    cloudsRef.current = Array.from({ length: initialCount }, () => createCloud(w, h));
    cloudElsRef.current = Array(initialCount).fill(null as any);

    const tick = (now: number) => {
      const dt = Math.min(64, now - lastRef.current) / 1000;
      lastRef.current = now;
      const width = window.innerWidth;
      const height = window.innerHeight;

      for (let i = 0; i < cloudsRef.current.length; i++) {
        const c = cloudsRef.current[i];
        const el = cloudElsRef.current[i];
        if (!el) continue;

        c.x += c.speedX * dt;
        const bobY = Math.sin(now / 1000 * c.bobSpeed + c.bobPhase) * c.bobAmplitude;

        if (c.x > width + 200) {
          cloudsRef.current[i] = createCloud(width, height);
          const n = cloudsRef.current[i];
          const ny = n.y + Math.sin(now / 1000 * n.bobSpeed + n.bobPhase) * n.bobAmplitude;
          el.style.transform = `translate(${n.x}px, ${ny}px) scale(${n.scale})`;
          el.style.opacity = `${n.opacity}`;
          (el.firstChild as HTMLImageElement | null)?.setAttribute("src", n.src);
          continue;
        }

        el.style.transform = `translate(${c.x}px, ${c.y + bobY}px) scale(${c.scale})`;
        el.style.opacity = `${c.opacity}`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame((t) => {
      lastRef.current = t;
      rafRef.current = requestAnimationFrame(tick);
    });

    const onResize = () => {
      // Keep clouds in top half region
      const hNow = window.innerHeight;
      const halfTop = Math.max(0, hNow * 0.5);
      cloudsRef.current.forEach((c) => {
        c.y = Math.min(halfTop, Math.max(0, c.y));
      });
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [initialCount]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: initialCount }).map((_, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          ref={(el) => {
            if (el) cloudElsRef.current[i] = el;
          }}
          style={{ 
            position: "absolute", 
            left: 0, 
            top: 0, 
            width: 128, 
            height: 80, 
            transform: "translate(-100px, 0)",
            filter: isDarkMode ? "brightness(0.85) contrast(0.95)" : "none",
            transition: "filter 0.5s ease-in-out"
          }}
        >
          <img
            src={CLOUD_IMAGES[i % CLOUD_IMAGES.length]}
            alt="cloud"
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", imageRendering: "auto" }}
          />
        </div>
      ))}
    </div>
  );
}


