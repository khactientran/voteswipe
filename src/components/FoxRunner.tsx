import { useEffect, useRef, useState } from "react";
import foxSprite from "@/assets/Fox Sprite Sheet.png";

const FRAME_WIDTH = 32;
const FRAME_HEIGHT = 32;
const SHEET_COLUMNS = 14;
const SHEET_ROWS = 7;

// 0-based index: third row is index 2
const RUN_ROW_INDEX = 2;
const RUN_FRAMES = 8; // 8 frames on the 3rd row
const FRAME_DURATION_MS = 100; // ~100ms per frame

// Cross screen roughly every 6 seconds; recomputed on resize
const getSpeedPxPerSecond = (viewportWidth: number) => viewportWidth / 6;

// Responsive scale for pixel-art (kept as transform scale to preserve crispness)
const computeScale = (viewportWidth: number) => {
	// Between ~2x on small screens and ~4x on large
	const scaled = viewportWidth / 480; // 480px → 1x baseline
	return Math.max(2, Math.min(4, scaled));
};

// Global multiplier to enlarge the fox sprite across the app
const SCALE_MULTIPLIER = 2;

type FoxRunnerProps = {
	scale?: number; // absolute scale; if provided, overrides responsive base
	groundOffset?: string | number; // CSS bottom value (e.g., '10%' or 24)
	isVisible?: boolean; // whether to show the fox
};

const FoxRunner = ({ scale, groundOffset = "15%", isVisible = true }: FoxRunnerProps) => {
	const runnerRef = useRef<HTMLDivElement | null>(null);
	const spriteRef = useRef<HTMLDivElement | null>(null);

	const computeEffectiveScale = (vw: number) => (typeof scale === "number" ? scale : computeScale(vw)) * SCALE_MULTIPLIER;

	const scaleRef = useRef<number>(computeEffectiveScale(typeof window !== "undefined" ? window.innerWidth : 1024));
	const speedRef = useRef<number>(getSpeedPxPerSecond(typeof window !== "undefined" ? window.innerWidth : 1024));
	const positionXRef = useRef<number>(-FRAME_WIDTH * scaleRef.current);
	const frameIndexRef = useRef<number>(0);
	const rafRef = useRef<number | null>(null);
	const frameTimerRef = useRef<number | null>(null);

	const [, forceRerender] = useState(0); // ensure first paint after mount for correct sizing

	useEffect(() => {
		// Kick a render to ensure refs are attached before anim starts
		forceRerender((v) => v + 1);
	}, []);

	useEffect(() => {
		let lastTime = performance.now();

		const updateSpriteFrame = () => {
			frameIndexRef.current = (frameIndexRef.current + 1) % RUN_FRAMES;
			const xOffset = -frameIndexRef.current * FRAME_WIDTH;
			const yOffset = -RUN_ROW_INDEX * FRAME_HEIGHT;
			if (spriteRef.current) {
				spriteRef.current.style.backgroundPosition = `${xOffset}px ${yOffset}px`;
			}
		};

		const onResize = () => {
			const vw = window.innerWidth;
			scaleRef.current = computeEffectiveScale(vw);
			speedRef.current = getSpeedPxPerSecond(vw);
			// Reset off-screen start so it adapts to new size
			positionXRef.current = -FRAME_WIDTH * scaleRef.current;
			// Apply scale immediately
			if (spriteRef.current) {
				spriteRef.current.style.transform = `scale(${scaleRef.current})`;
			}
		};

		const animate = (time: number) => {
			const dt = (time - lastTime) / 1000; // seconds
			lastTime = time;
			positionXRef.current += speedRef.current * dt;
			const viewportWidth = window.innerWidth;
			const renderWidth = FRAME_WIDTH * scaleRef.current;
			// Loop when passing the right edge
			if (positionXRef.current > viewportWidth + renderWidth) {
				positionXRef.current = -renderWidth;
			}
			if (runnerRef.current) {
				runnerRef.current.style.transform = `translate3d(${Math.round(positionXRef.current)}px, 0, 0)`;
			}
			rafRef.current = requestAnimationFrame(animate);
		};

		// Initialize sprite element styles
		if (spriteRef.current) {
			// Set background sheet sizing to real pixel size to align positions
			spriteRef.current.style.backgroundImage = `url(${foxSprite})`;
			spriteRef.current.style.backgroundRepeat = "no-repeat";
			spriteRef.current.style.backgroundSize = `${SHEET_COLUMNS * FRAME_WIDTH}px ${SHEET_ROWS * FRAME_HEIGHT}px`;
			spriteRef.current.style.imageRendering = "pixelated" as any;
			spriteRef.current.style.transform = `scale(${scaleRef.current})`;
			updateSpriteFrame();
		}

		// Start frame timer and raf
		frameTimerRef.current = window.setInterval(updateSpriteFrame, FRAME_DURATION_MS);
		rafRef.current = requestAnimationFrame(animate);
		window.addEventListener("resize", onResize);

		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			if (frameTimerRef.current) clearInterval(frameTimerRef.current);
			window.removeEventListener("resize", onResize);
		};
	}, [scale, isVisible]);

	if (!isVisible) {
		return null;
	}

	return (
		<div
			className="pointer-events-none select-none"
			style={{
				position: "absolute",
				left: 0,
				bottom: typeof groundOffset === "number" ? `${groundOffset}px` : groundOffset,
				willChange: "transform",
				zIndex: 5,
			}}
			ref={runnerRef}
		>
			<div
				ref={spriteRef}
				style={{
					width: `${FRAME_WIDTH}px`,
					height: `${FRAME_HEIGHT}px`,
					transformOrigin: "bottom left",
				}}
			/>
		</div>
	);
};

export default FoxRunner;


