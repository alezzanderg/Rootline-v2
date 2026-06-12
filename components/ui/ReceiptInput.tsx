"use client"

import { useRef, useState } from "react"

/** Resize/compress an image file to a JPEG data URL (max 1280px, ~0.7 quality). */
async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("No se pudo leer la imagen"))
    image.src = dataUrl
  })

  const maxDim = 1280
  let { width, height } = img
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL("image/jpeg", 0.7)
}

export function ReceiptInput({
  name = "receiptUrl",
  defaultValue = "",
}: {
  name?: string
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      setValue(await compressImage(file))
    } catch {
      setError("No se pudo procesar la imagen.")
    } finally {
      setBusy(false)
    }
  }

  function clear() {
    setValue("")
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={value} />
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-foreground/15 bg-white/60 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Recibo" className="h-20 w-20 rounded-lg object-cover" />
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-foreground/70">Recibo adjunto</span>
            <button type="button" onClick={clear} className="w-fit text-rose-600 hover:underline">
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          className="block w-full text-sm text-foreground/60 file:mr-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-accent hover:file:bg-accent/25"
        />
      )}
      {busy ? <span className="text-xs text-foreground/45">Procesando imagen…</span> : null}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  )
}
