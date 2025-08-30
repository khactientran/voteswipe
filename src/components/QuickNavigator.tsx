import { useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"

export interface QuickNavigatorItem {
  id: string
  url: string
  name: string
}

interface QuickNavigatorProps {
  items: QuickNavigatorItem[]
  currentIndex: number
  onSelect: (index: number) => void
  votes?: Record<string, 'like' | 'ok' | 'dislike'>
}

export default function QuickNavigator({ items, currentIndex, onSelect, votes }: QuickNavigatorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Keep current thumbnail centered when index changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const active = container.querySelector<HTMLDivElement>(`[data-qn-index="${currentIndex}"]`)
    if (active) {
      active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    }
  }, [currentIndex])

  const canScroll = items.length > 0

  const scrollBy = (delta: number) => {
    const container = containerRef.current
    if (!container) return
    container.scrollBy({ left: delta, behavior: "smooth" })
  }

  return (
    <div className="relative">
      {/* Horizontal thumbnails */}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-12 rounded-md bg-card/70"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain', touchAction: 'pan-x', cursor: 'grab' }}
        
        // Kinetic drag-to-scroll for mouse pointers; touch uses native momentum
        onPointerDown={(e) => {
          const el = containerRef.current
          if (!el || e.pointerType !== 'mouse') return
          ;(el as any)._qnPointerActive = true
          ;(el as any)._qnIsDragging = false
          ;(el as any)._qnStartX = e.clientX
          ;(el as any)._qnLastX = e.clientX
          ;(el as any)._qnVelocity = 0
          ;(el as any)._qnLastT = performance.now()
          el.style.cursor = 'grab'
          // stop ongoing inertia
          if ((el as any)._qnRaf) {
            cancelAnimationFrame((el as any)._qnRaf)
            ;(el as any)._qnRaf = null
          }
        }}
        onPointerMove={(e) => {
          const el = containerRef.current as any
          if (!el || !el._qnPointerActive) return
          const now = performance.now()
          const dx = e.clientX - el._qnLastX
          const totalDx = e.clientX - (el._qnStartX ?? e.clientX)
          if (!el._qnIsDragging && Math.abs(totalDx) > 5) {
            el._qnIsDragging = true
            // Start capturing once we confirm it's a drag, so clicks still work otherwise
            try { el.setPointerCapture(e.pointerId) } catch {}
            el.style.cursor = 'grabbing'
          }
          if (el._qnIsDragging) {
            e.preventDefault()
            el.scrollLeft -= dx
          }
          const dt = now - el._qnLastT
          if (dt > 0) {
            const v = dx / dt // px per ms
            el._qnVelocity = el._qnVelocity * 0.8 + v * 0.2
          }
          el._qnLastX = e.clientX
          el._qnLastT = now
        }}
        onPointerUp={(e) => {
          const el = containerRef.current as any
          if (!el || !el._qnPointerActive) return
          try { el.releasePointerCapture(e.pointerId) } catch {}
          const wasDragging = !!el._qnIsDragging
          el._qnPointerActive = false
          el._qnIsDragging = false
          el.style.cursor = 'grab'
          if (wasDragging) {
            let velocity = el._qnVelocity || 0
            const decay = 0.95
            const minVel = 0.02
            const step = () => {
              // 60fps ~16ms frame; use px/ms * ms/frame
              el.scrollLeft -= velocity * 16
              velocity *= decay
              if (Math.abs(velocity) < minVel) {
                el._qnRaf = null
                return
              }
              el._qnRaf = requestAnimationFrame(step)
            }
            if (Math.abs(velocity) >= minVel) {
              el._qnRaf = requestAnimationFrame(step)
            }
          }
        }}
        onPointerCancel={(e) => {
          const el = containerRef.current as any
          if (!el) return
          el._qnPointerActive = false
          el._qnIsDragging = false
          el.style.cursor = 'grab'
          if (el._qnRaf) {
            cancelAnimationFrame(el._qnRaf)
            el._qnRaf = null
          }
        }}
      >
        {items.map((item, idx) => {
          const isActive = idx === currentIndex
          const vote = votes?.[item.id]
          const voteColor = vote === 'like' ? 'bg-vote-like' : vote === 'ok' ? 'bg-vote-ok' : vote === 'dislike' ? 'bg-vote-dislike' : ''
          return (
            <div
              key={item.id}
              data-qn-index={idx}
              className={`shrink-0 w-24 h-16 rounded-md overflow-hidden border transition-all ${
                isActive ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
              }`}
              onClick={() => onSelect(idx)}
              role="button"
              aria-label={`Go to image ${idx + 1}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelect(idx)
                }
              }}
            >
              <div className="relative w-full h-full">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover select-none" loading="lazy" draggable={false} />
                {vote && (
                  <span
                    className={`absolute top-1 right-1 h-3 w-3 rounded-full shadow ring-2 ring-black ${voteColor}`}
                    title={`Voted: ${vote}`}
                    aria-label={`Voted: ${vote}`}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scroll controls */}
      <div className="pointer-events-none">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="pointer-events-auto absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 bg-card/90 text-black"
          onClick={() => scrollBy(-240)}
          aria-label="Scroll thumbnails left"
          disabled={!canScroll}
        >
          ◄
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 bg-card/90 text-black"
          onClick={() => scrollBy(240)}
          aria-label="Scroll thumbnails right"
          disabled={!canScroll}
        >
          ►
        </Button>
      </div>
    </div>
  )
}


