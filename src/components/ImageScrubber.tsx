import { useCallback } from "react"

interface ImageScrubberProps {
  count: number
  value: number // zero-based index
  onChange: (index: number) => void
}

// A11y-friendly large-count navigator using a range input
export default function ImageScrubber({ count, value, onChange }: ImageScrubberProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Number(e.target.value)
    onChange(idx)
  }, [onChange])

  const ariaLabel = `Image ${value + 1} of ${count}`

  return (
    <div className="w-full flex items-center gap-3">
      <span className="text-xs text-foreground/70 tabular-nums min-w-[3ch] text-right">{Math.min(value + 1, count)}</span>
      <input
        type="range"
        min={0}
        max={Math.max(0, count - 1)}
        value={Math.min(value, Math.max(0, count - 1))}
        aria-label={ariaLabel}
        className="w-full h-2 rounded bg-muted accent-primary"
        onChange={handleChange}
      />
      <span className="text-xs text-foreground/70 tabular-nums min-w-[3ch]">{count}</span>
    </div>
  )
}


