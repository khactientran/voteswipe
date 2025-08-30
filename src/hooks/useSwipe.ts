import { useRef, useEffect } from 'react'

export interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

export interface UseSwipeOptions extends SwipeHandlers {
  threshold?: number // Min px distance to count as a swipe
  restraint?: number // Max perpendicular movement allowed
  allowedTime?: number // Max time in ms to complete the swipe
}

// Attach to a container element to enable touch swipe gestures
// Returns a ref to spread onto the target element
export function useSwipe<T extends HTMLElement = HTMLDivElement>(options: UseSwipeOptions) {
  const { threshold = 50, restraint = 100, allowedTime = 500, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown } = options
  const targetRef = useRef<T | null>(null)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    let startX = 0
    let startY = 0
    let startTime = 0

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      startX = touch.pageX
      startY = touch.pageY
      startTime = Date.now()
    }

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      const distX = touch.pageX - startX
      const distY = touch.pageY - startY
      const elapsed = Date.now() - startTime

      if (elapsed <= allowedTime) {
        if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
          // Horizontal swipe
          if (distX < 0) onSwipeLeft && onSwipeLeft()
          else onSwipeRight && onSwipeRight()
        } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) {
          // Vertical swipe
          if (distY < 0) onSwipeUp && onSwipeUp()
          else onSwipeDown && onSwipeDown()
        }
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [threshold, restraint, allowedTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return targetRef
}


