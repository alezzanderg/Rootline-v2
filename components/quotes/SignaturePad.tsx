"use client"

import { useEffect, useRef, useState } from "react"

type SignaturePadProps = {
  onChange: (dataUrl: string | null) => void
  disabled?: boolean
}

export function SignaturePad({ onChange, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [hasStroke, setHasStroke] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resizeCanvas() {
      const rect = canvas!.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas!.width = Math.floor(rect.width * ratio)
      canvas!.height = Math.floor(rect.height * ratio)
      const ctx = canvas!.getContext("2d")
      if (!ctx) return
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = "#1e2d23"
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  function getPoint(event: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if ("touches" in event) {
      const touch = event.touches[0] ?? event.changedTouches[0]
      if (!touch) return null
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function startDraw(event: React.MouseEvent | React.TouchEvent) {
    if (disabled) return
    event.preventDefault()
    const canvas = canvasRef.current
    const point = getPoint(event)
    if (!canvas || !point) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    drawingRef.current = true
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  function draw(event: React.MouseEvent | React.TouchEvent) {
    if (!drawingRef.current || disabled) return
    event.preventDefault()
    const canvas = canvasRef.current
    const point = getPoint(event)
    if (!canvas || !point) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  function endDraw() {
    if (!drawingRef.current) return
    drawingRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    const ink = canvasHasInk(canvas)
    setHasStroke(ink)
    onChange(ink ? canvas.toDataURL("image/png") : null)
  }

  function canvasHasInk(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext("2d")
    if (!ctx) return false
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) return true
    }
    return false
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas || disabled) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border border-foreground/15 bg-white">
        <canvas
          ref={canvasRef}
          className="h-36 w-full touch-none sm:h-40"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasStroke ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-foreground/35">
            Use your mouse or finger to sign above
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-foreground/45">Draw your signature</p>
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="text-xs font-medium text-foreground/55 underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
