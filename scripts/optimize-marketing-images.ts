/**
 * Compress marketing images for web. Run: npm run optimize-images
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const outDir = path.join(root, "public", "images", "optimized")

type Job = {
  input: string
  output: string
  width: number
  quality?: number
}

const jobs: Job[] = [
  { input: "public/images/logo.png", output: "logo-nav.webp", width: 280, quality: 85 },
  { input: "public/images/logoFooter.png", output: "logo-footer.webp", width: 360, quality: 85 },
  { input: "public/images/hero-lawn.jpg", output: "hero-lawn.webp", width: 1200, quality: 80 },
  { input: "public/images/hero-lawn.jpg", output: "hero-lawn-mobile.webp", width: 640, quality: 78 },
  { input: "public/images/lawn-mowing.jpg", output: "lawn-mowing.webp", width: 600, quality: 80 },
  { input: "public/images/lawn-trimmed.jpg", output: "lawn-trimmed.webp", width: 600, quality: 80 },
  { input: "public/images/backyard-lawn.jpg", output: "backyard-lawn.webp", width: 600, quality: 80 },
  { input: "public/images/nj-home.jpg", output: "nj-home.webp", width: 600, quality: 80 },
]

async function main() {
  await mkdir(outDir, { recursive: true })

  for (const job of jobs) {
    const inputPath = path.join(root, job.input)
    const outputPath = path.join(outDir, job.output)

    const buffer = await sharp(inputPath)
      .rotate()
      .resize(job.width, undefined, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: job.quality ?? 80 })
      .toBuffer()

    await writeFile(outputPath, buffer)
    const kb = Math.round(buffer.length / 1024)
    console.log(`  public/images/optimized/${job.output} (${kb} KB)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
