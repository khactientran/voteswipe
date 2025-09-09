import { useCallback, useEffect, useRef, useState } from "react";

type ImageViewerOverlayProps = {
  src: string;
  alt?: string;
  onClose: () => void;
  maxScale?: number;
  minScale?: number; // optional override; otherwise computed from fit-to-screen
};

// A fullscreen overlay that supports pinch-zoom and panning without affecting page gestures
const ImageViewerOverlay = ({ src, alt = "", onClose, maxScale = 4, minScale }: ImageViewerOverlayProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState<number>(1);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const [computedMinScale, setComputedMinScale] = useState<number>(1);
  const HEADER_SAFE_PX = 56; // reserve space for top-right close button area

  // Gesture refs
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastTouchMidRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef<boolean>(false);
  const lastPanRef = useRef<{ x: number; y: number } | null>(null);

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const getContainerSize = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight - HEADER_SAFE_PX; // exclude header area so image avoids close button
    return { vw, vh: Math.max(0, vh) };
  }, [HEADER_SAFE_PX]);

  const getImageDisplaySize = useCallback((s: number) => {
    const w = imgRef.current?.naturalWidth || 1;
    const h = imgRef.current?.naturalHeight || 1;
    return { dw: w * s, dh: h * s };
  }, []);

  const clampTranslation = useCallback((s: number, tx: number, ty: number) => {
    const { vw, vh } = getContainerSize();
    const { dw, dh } = getImageDisplaySize(s);
    const maxOffsetX = Math.max(0, (dw - vw) / 2);
    const maxOffsetY = Math.max(0, (dh - vh) / 2);
    const clampedX = clamp(tx, -maxOffsetX, maxOffsetX);
    const clampedY = clamp(ty, -maxOffsetY, maxOffsetY);
    return { x: clampedX, y: clampedY };
  }, [getContainerSize, getImageDisplaySize]);

  type PointLike = { pageX: number; pageY: number };

  const getDistance = (t1: PointLike, t2: PointLike) => {
    const dx = t2.pageX - t1.pageX;
    const dy = t2.pageY - t1.pageY;
    return Math.hypot(dx, dy);
  };

  const getMidpoint = (t1: PointLike, t2: PointLike) => ({ x: (t1.pageX + t2.pageX) / 2, y: (t1.pageY + t2.pageY) / 2 });

  // Apply transform to the image element
  const applyTransform = useCallback((s: number, tx: number, ty: number) => {
    if (imgRef.current) {
      imgRef.current.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px) scale(${s})`;
    }
  }, []);

  useEffect(() => {
    applyTransform(scale, translateX, translateY);
  }, [scale, translateX, translateY, applyTransform]);

  // Prevent background scroll/gestures while open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Compute a fit-to-screen min scale based on natural image size and viewport
  const computeFitScale = useCallback(() => {
    const img = imgRef.current;
    if (!img) return 1;
    const naturalW = img.naturalWidth || 1;
    const naturalH = img.naturalHeight || 1;
    const { vw, vh } = getContainerSize();
    if (!vw || !vh) return 1;
    const fit = Math.min(vw / naturalW, vh / naturalH);
    return Math.min(1, fit);
  }, [getContainerSize]);

  const initializeScale = useCallback(() => {
    const fit = computeFitScale();
    setComputedMinScale(fit);
    // Start at fit scale if image is larger than viewport; otherwise start at 1
    const initial = fit < 1 ? fit : 1;
    setScale(initial);
    setTranslateX(0);
    setTranslateY(0);
  }, [computeFitScale]);

  // Recompute when image loads and on resize
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      initializeScale();
    } else {
      const onLoad = () => initializeScale();
      img.addEventListener('load', onLoad);
      return () => img.removeEventListener('load', onLoad);
    }
  }, [src, initializeScale]);

  useEffect(() => {
    const onResize = () => initializeScale();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [initializeScale]);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      lastTouchDistanceRef.current = getDistance(t1, t2);
      lastTouchMidRef.current = getMidpoint(t1, t2);
      isPanningRef.current = false;
    } else if (e.touches.length === 1) {
      e.preventDefault();
      isPanningRef.current = true;
      lastPanRef.current = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current != null) {
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const newDistance = getDistance(t1, t2);
      const mid = getMidpoint(t1, t2);
      const deltaScale = newDistance / lastTouchDistanceRef.current;
      const effectiveMin = minScale ?? computedMinScale;
      const nextScale = clamp(scale * deltaScale, effectiveMin, maxScale);

      // Adjust translation so zoom focuses around the midpoint
      const dx = mid.x - (lastTouchMidRef.current?.x ?? mid.x);
      const dy = mid.y - (lastTouchMidRef.current?.y ?? mid.y);

      const factor = nextScale / scale;
      const nextTranslateX = (translateX + dx) * factor;
      const nextTranslateY = (translateY + dy) * factor;

      const clamped = clampTranslation(nextScale, nextTranslateX, nextTranslateY);
      setScale(nextScale);
      setTranslateX(clamped.x);
      setTranslateY(clamped.y);

      lastTouchDistanceRef.current = newDistance;
      lastTouchMidRef.current = mid;
    } else if (e.touches.length === 1 && isPanningRef.current && lastPanRef.current) {
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.pageX - lastPanRef.current.x;
      const dy = touch.pageY - lastPanRef.current.y;
      lastPanRef.current = { x: touch.pageX, y: touch.pageY };
      const nextX = translateX + dx;
      const nextY = translateY + dy;
      const clamped = clampTranslation(scale, nextX, nextY);
      setTranslateX(clamped.x);
      setTranslateY(clamped.y);
    }
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      // End gestures
      lastTouchDistanceRef.current = null;
      lastTouchMidRef.current = null;
      isPanningRef.current = false;
      lastPanRef.current = null;
    }
  };

  // Wheel zoom for desktop
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = -e.deltaY; // up -> zoom in
    const zoomIntensity = 0.0015;
    const effectiveMin = minScale ?? computedMinScale;
    const nextScale = clamp(scale * (1 + delta * zoomIntensity), effectiveMin, maxScale);
    const factor = nextScale / scale;
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = (e.clientX - (rect?.left ?? 0)) - (rect ? rect.width / 2 : 0);
    const cy = (e.clientY - (rect?.top ?? 0)) - (rect ? rect.height / 2 : 0);
    const nextTranslateX = (translateX + cx) * factor - cx;
    const nextTranslateY = (translateY + cy) * factor - cy;
    const clamped = clampTranslation(nextScale, nextTranslateX, nextTranslateY);
    setScale(nextScale);
    setTranslateX(clamped.x);
    setTranslateY(clamped.y);
  };

  // Double-click to reset and close? Keep simple: close only with X button
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent closing when clicking the image
    if (e.target === containerRef.current) onClose();
  };

  // Keyboard: Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm touch-none"
      onClick={handleBackgroundClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
      role="dialog"
      aria-modal="true"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed top-3 right-3 z-[1010] h-10 w-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-md active:scale-95"
      >
        ✕
      </button>

      {/* Centered image */}
      <div className="absolute inset-0 flex items-center justify-center select-none" style={{ paddingTop: HEADER_SAFE_PX }}>
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          className="max-w-none max-h-none"
          style={{
            willChange: "transform",
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: "center center",
            userSelect: "none",
            touchAction: "none",
          }}
        />
      </div>
    </div>
  );
};

export default ImageViewerOverlay;


