/**
 * Generates favicons from public/images/logo.png into public/favicons/.
 * Run: npm run favicons
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import pngToIco from "png-to-ico"
import sharp from "sharp"

import { buildSiteManifest } from "../lib/site-icons"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const source = path.join(root, "public", "images", "logo.png")
const outDir = path.join(root, "public", "favicons")

/** Solid black — matches logo background; avoids ICO alpha artifacts */
const LOGO_BG = "#000000"

async function renderSquare(size: number): Promise<Buffer> {
  return sharp(source)
    .flatten({ background: LOGO_BG })
    .resize(size, size, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()
}

async function main() {
  const meta = await sharp(source).metadata()
  console.log(`Source: ${path.relative(root, source)}`)
  console.log(`Output: ${path.relative(root, outDir)}/`)
  console.log(`Dimensions: ${meta.width}x${meta.height}`)

  await mkdir(outDir, { recursive: true })

  const [icon16, icon32, icon48, icon192, apple] = await Promise.all([
    renderSquare(16),
    renderSquare(32),
    renderSquare(48),
    renderSquare(192),
    renderSquare(180),
  ])

  const pngOutputs: [string, Buffer][] = [
    ["icon-16.png", icon16],
    ["icon-32.png", icon32],
    ["icon-48.png", icon48],
    ["icon-192.png", icon192],
    ["apple-icon.png", apple],
  ]

  await Promise.all(
    pngOutputs.map(([name, data]) => writeFile(path.join(outDir, name), data))
  )

  // ICO: 32 + 48 only (16px often causes line artifacts on fine logo details)
  const faviconIco = await pngToIco([
    path.join(outDir, "icon-32.png"),
    path.join(outDir, "icon-48.png"),
  ])
  await writeFile(path.join(outDir, "favicon.ico"), faviconIco)

  await writeFile(
    path.join(outDir, "site.webmanifest"),
    `${JSON.stringify(buildSiteManifest(), null, 2)}\n`,
    "utf8"
  )

  console.log("Generated:")
  console.log("  public/favicons/favicon.ico")
  console.log("  public/favicons/site.webmanifest")
  for (const [name] of pngOutputs) {
    console.log(`  public/favicons/${name}`)
  }
  console.log("\nNext.js serves app/manifest.ts at /manifest.webmanifest")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
