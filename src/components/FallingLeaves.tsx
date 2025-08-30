import { useEffect, useMemo, useRef } from "react";
import leafImg from "@/assets/Leaf.png";

type Leaf = {
  baseX: number;
  y: number;
  fallSpeed: number; // px per second
  swayAmplitude: number; // px
  swaySpeed: number; // radians per second
  swayPhase: number; // radians
  rotationDeg: number; // degrees
  rotationSpeed: number; // deg per second
  scale: number; // 0..1
  opacity: number; // 0..1
};

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createLeaf(viewportWidth: number, startAbove: boolean): Leaf {
  return {
    baseX: Math.max(0, Math.min(viewportWidth, Math.random() * viewportWidth)),
    y: startAbove ? -randomInRange(20, 200) : randomInRange(-200, window.innerHeight),
    fallSpeed: randomInRange(30, 95),
    swayAmplitude: randomInRange(10, 42),
    swaySpeed: randomInRange(0.4, 1.2),
    swayPhase: randomInRange(0, Math.PI * 2),
    rotationDeg: randomInRange(-45, 45),
    rotationSpeed: randomInRange(-30, 30),
    scale: randomInRange(0.55, 1.1),
    opacity: randomInRange(0.55, 0.95),
  };
}

export default function FallingLeaves({ count = 18 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leavesRef = useRef<Leaf[]>([]);
  const leafElsRef = useRef<HTMLDivElement[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  const initialCount = useMemo(() => Math.max(1, Math.min(64, count)), [count]);

  useEffect(() => {
    const width = window.innerWidth;
    leavesRef.current = Array.from({ length: initialCount }, () => createLeaf(width, false));

    // Ensure ref array length matches
    leafElsRef.current = Array(initialCount).fill(null as any);

    const tick = (now: number) => {
      const dt = Math.min(64, now - lastTimeRef.current) / 1000; // seconds, clamp for tab switches
      lastTimeRef.current = now;
      const height = window.innerHeight;
      const widthNow = window.innerWidth;

      for (let i = 0; i < leavesRef.current.length; i++) {
        const leaf = leavesRef.current[i];
        const el = leafElsRef.current[i];
        if (!el) continue;

        // Update physics
        leaf.y += leaf.fallSpeed * dt;
        const swayX = Math.sin(now / 1000 * leaf.swaySpeed + leaf.swayPhase) * leaf.swayAmplitude;
        leaf.rotationDeg += leaf.rotationSpeed * dt;

        // Reset when off-screen bottom
        if (leaf.y > height + 60) {
          leavesRef.current[i] = createLeaf(widthNow, true);
          // Use the newly created leaf for rendering this frame
          const n = leavesRef.current[i];
          const nx = n.baseX + Math.sin(now / 1000 * n.swaySpeed + n.swayPhase) * n.swayAmplitude;
          el.style.transform = `translate(${nx}px, ${n.y}px) rotate(${n.rotationDeg}deg) scale(${n.scale})`;
          el.style.opacity = `${n.opacity}`;
          continue;
        }

        const x = Math.max(-80, Math.min(widthNow + 80, leaf.baseX + swayX));
        el.style.transform = `translate(${x}px, ${leaf.y}px) rotate(${leaf.rotationDeg}deg) scale(${leaf.scale})`;
        el.style.opacity = `${leaf.opacity}`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame((t) => {
      lastTimeRef.current = t;
      rafRef.current = requestAnimationFrame(tick);
    });

    const onResize = () => {
      // Nudge leaves to fit new width bounds
      const widthNow = window.innerWidth;
      leavesRef.current.forEach((leaf) => {
        leaf.baseX = Math.max(0, Math.min(widthNow, leaf.baseX));
      });
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [initialCount]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: initialCount }).map((_, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          ref={(el) => {
            if (el) leafElsRef.current[i] = el;
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 48,
            height: 48,
            transform: "translate(0px, -100px)",
            willChange: "transform, opacity",
          }}
        >
          <img
            src={leafImg}
            alt="leaf"
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transformOrigin: "50% 50%",
              display: "block",
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.15))",
            }}
          />
        </div>
      ))}
    </div>
  );
}


