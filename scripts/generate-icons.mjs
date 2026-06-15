import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { deflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const buildDir = join(rootDir, 'build')
const iconsetDir = join(buildDir, 'icon.iconset')

mkdirSync(buildDir, { recursive: true })
mkdirSync(iconsetDir, { recursive: true })

const crcTable = new Uint32Array(256)
for (let index = 0; index < 256; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  crcTable[index] = value >>> 0
}

const crc32 = (buffer) => {
  let value = 0xffffffff
  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

const pngChunk = (type, data) => {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

const makePng = (width, height, rgba) => {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rows = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1)
    rows[rowOffset] = 0
    rgba.copy(rows, rowOffset + 1, y * width * 4, (y + 1) * width * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(rows, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

const hexToRgba = (hex) => {
  const normalized = hex.replace('#', '')
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
    255
  ]
}

const setPixel = (pixels, size, x, y, color) => {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return
  }
  const offset = (Math.floor(y) * size + Math.floor(x)) * 4
  pixels[offset] = color[0]
  pixels[offset + 1] = color[1]
  pixels[offset + 2] = color[2]
  pixels[offset + 3] = color[3]
}

const fillRoundedRect = (pixels, size, x, y, width, height, radius, color) => {
  const left = Math.round(x)
  const top = Math.round(y)
  const right = Math.round(x + width)
  const bottom = Math.round(y + height)
  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      const nearestX = Math.max(left + radius, Math.min(px, right - radius - 1))
      const nearestY = Math.max(top + radius, Math.min(py, bottom - radius - 1))
      if ((px - nearestX) ** 2 + (py - nearestY) ** 2 <= radius ** 2) {
        setPixel(pixels, size, px, py, color)
      }
    }
  }
}

const fillCircle = (pixels, size, cx, cy, radius, color) => {
  const left = Math.floor(cx - radius)
  const right = Math.ceil(cx + radius)
  const top = Math.floor(cy - radius)
  const bottom = Math.ceil(cy + radius)
  for (let py = top; py <= bottom; py += 1) {
    for (let px = left; px <= right; px += 1) {
      if ((px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2) {
        setPixel(pixels, size, px, py, color)
      }
    }
  }
}

const fillPill = (pixels, size, x, y, width, height, color) => {
  fillRoundedRect(pixels, size, x, y, width, height, height / 2, color)
}

const renderIcon = (size) => {
  const scale = size / 1024
  const pixels = Buffer.alloc(size * size * 4)
  const navy = hexToRgba('#0f172a')
  const white = hexToRgba('#ffffff')
  const blue = hexToRgba('#1d4ed8')
  const lightBlue = hexToRgba('#bfdbfe')
  const paleBlue = hexToRgba('#dbeafe')
  const slate = hexToRgba('#e2e8f0')

  const s = (value) => value * scale
  fillRoundedRect(pixels, size, 0, 0, size, size, s(220), navy)
  fillRoundedRect(pixels, size, s(168), s(190), s(688), s(644), s(64), white)
  fillRoundedRect(pixels, size, s(232), s(282), s(560), s(76), s(30), paleBlue)
  fillCircle(pixels, size, s(284), s(320), s(16), blue)
  fillCircle(pixels, size, s(366), s(320), s(16), blue)
  fillCircle(pixels, size, s(448), s(320), s(16), blue)
  fillRoundedRect(pixels, size, s(232), s(438), s(252), s(92), s(28), slate)
  fillRoundedRect(pixels, size, s(540), s(438), s(252), s(92), s(28), lightBlue)
  fillRoundedRect(pixels, size, s(232), s(594), s(252), s(92), s(28), lightBlue)
  fillRoundedRect(pixels, size, s(540), s(594), s(252), s(92), s(28), slate)
  fillPill(pixels, size, s(314), s(476), s(88), s(28), navy)
  fillPill(pixels, size, s(622), s(476), s(88), s(28), navy)
  fillPill(pixels, size, s(314), s(632), s(88), s(28), navy)
  fillPill(pixels, size, s(622), s(632), s(88), s(28), navy)
  fillPill(pixels, size, s(348), s(734), s(328), s(36), blue)

  return makePng(size, size, pixels)
}

const pngBySize = new Map()
for (const size of [16, 32, 48, 64, 128, 256, 512, 1024]) {
  const png = renderIcon(size)
  pngBySize.set(size, png)
  writeFileSync(join(buildDir, `icon-${size}.png`), png)
}
writeFileSync(join(buildDir, 'icon.png'), pngBySize.get(1024))

const iconsetFiles = [
  [16, 'icon_16x16.png'],
  [32, 'icon_16x16@2x.png'],
  [32, 'icon_32x32.png'],
  [64, 'icon_32x32@2x.png'],
  [128, 'icon_128x128.png'],
  [256, 'icon_128x128@2x.png'],
  [256, 'icon_256x256.png'],
  [512, 'icon_256x256@2x.png'],
  [512, 'icon_512x512.png'],
  [1024, 'icon_512x512@2x.png']
]
for (const [size, fileName] of iconsetFiles) {
  writeFileSync(join(iconsetDir, fileName), pngBySize.get(size))
}

const icoSizes = [16, 32, 48, 64, 128, 256]
const icoHeader = Buffer.alloc(6)
icoHeader.writeUInt16LE(0, 0)
icoHeader.writeUInt16LE(1, 2)
icoHeader.writeUInt16LE(icoSizes.length, 4)

let offset = 6 + icoSizes.length * 16
const icoEntries = []
const icoImages = []
for (const size of icoSizes) {
  const png = pngBySize.get(size)
  const entry = Buffer.alloc(16)
  entry[0] = size === 256 ? 0 : size
  entry[1] = size === 256 ? 0 : size
  entry[2] = 0
  entry[3] = 0
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(offset, 12)
  icoEntries.push(entry)
  icoImages.push(png)
  offset += png.length
}
writeFileSync(join(buildDir, 'icon.ico'), Buffer.concat([icoHeader, ...icoEntries, ...icoImages]))

if (process.platform === 'darwin') {
  const tiffPath = join(buildDir, 'icon.tiff')
  const sipsResult = spawnSync('sips', ['-s', 'format', 'tiff', join(buildDir, 'icon.png'), '--out', tiffPath], {
    stdio: 'inherit'
  })
  if (sipsResult.status !== 0) {
    process.exit(sipsResult.status ?? 1)
  }

  const result = spawnSync('tiff2icns', [tiffPath, join(buildDir, 'icon.icns')], {
    stdio: 'inherit'
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
