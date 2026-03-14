import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')

const svgContent = readFileSync(join(publicDir, 'icon.svg'), 'utf-8')

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
]

for (const { name, size } of sizes) {
  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: size },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  writeFileSync(join(publicDir, name), pngBuffer)
  console.log(`✓ Generated ${name} (${size}x${size})`)
}

console.log('\nDone! PNG icons are ready in public/')
