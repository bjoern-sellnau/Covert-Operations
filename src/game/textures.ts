import * as THREE from 'three'

// ── Noise helpers ─────────────────────────────────────────────────────────────

function hash(x: number, y: number, s = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.3) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number, s = 0): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash(ix,     iy,     s)
  const b = hash(ix + 1, iy,     s)
  const c = hash(ix,     iy + 1, s)
  const d = hash(ix + 1, iy + 1, s)
  return a + (b - a) * ux + (c - a) * uy + (a + d - b - c) * ux * uy
}

function fbm(x: number, y: number, s = 0, oct = 4): number {
  let v = 0, a = 0.5, f = 1
  for (let i = 0; i < oct; i++) { v += smoothNoise(x * f, y * f, s + i) * a; a *= 0.5; f *= 2 }
  return v
}

function makeCtx(sz = 512): [HTMLCanvasElement, CanvasRenderingContext2D, ImageData] {
  const c = document.createElement('canvas')
  c.width = c.height = sz
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(sz, sz)
  return [c, ctx, img]
}

function toTex(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}

// ── Concrete — walls, cover ───────────────────────────────────────────────────

function makeConcrete(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx(512)
  const d = img.data
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const n  = fbm(x / 70, y / 70, 0, 4)
      const n2 = fbm(x / 25, y / 25, 7, 3)
      // horizontal formwork joint every 96px
      const joint = (y % 96) < 4 ? 0.72 : 1
      // subtle vertical shuttering every 192px
      const shutter = (x % 192) < 3 ? 0.82 : 1
      const v = (28 + n * 28 + n2 * 6) * joint * shutter
      const i = (y * 512 + x) * 4
      d[i]     = v * 0.52
      d[i + 1] = v * 0.62
      d[i + 2] = v * 1.05
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTex(canvas)
}

// ── Wood — crates ─────────────────────────────────────────────────────────────

function makeWood(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx(512)
  const d = img.data
  const PW = 80   // plank width in pixels
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const pi  = Math.floor(x / PW)
      const px  = (x % PW) / PW
      // wavy grain lines
      const grain = smoothNoise(x / 18, y / 18 + px + smoothNoise(x / 80, y / 90, pi) * 2, pi + 3) * 0.35
      // plank edge darkening
      const edge  = Math.min(px, 1 - px) * 7
      const em    = Math.min(1, edge)
      const base  = 55 + pi * 9 + grain * 40
      const v     = base * em
      const i     = (y * 512 + x) * 4
      d[i]     = v
      d[i + 1] = v * 0.72
      d[i + 2] = v * 0.32
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  // plank gaps
  ctx.fillStyle = '#1a0a00'
  for (let x = 0; x < 512; x += PW) ctx.fillRect(x, 0, 2, 512)
  // cross-cut lines
  ctx.fillStyle = '#0f0600'
  for (let y = 0; y < 512; y += 256) ctx.fillRect(0, y, 512, 2)
  return toTex(canvas)
}

// ── Brushed metal — pillars ───────────────────────────────────────────────────

function makeMetal(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx(512)
  const d = img.data
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      // vertical brushed lines
      const brush = (x % 6) / 6
      const bn    = smoothNoise(x / 5, y / 60, 0) * 0.4
      const sheen = (brush * 0.4 + bn + 0.45)
      // subtle highlight band at mid-height
      const hy    = y / 512
      const hi    = Math.max(0, 1 - Math.abs(hy - 0.5) * 5) * 0.25
      const n     = smoothNoise(x / 50, y / 50, 2) * 0.12
      const v     = (20 + n * 20) * sheen * (1 + hi)
      const i     = (y * 512 + x) * 4
      d[i]     = v * 0.48
      d[i + 1] = v * 0.52
      d[i + 2] = v * 0.92
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  // rivet pattern
  ctx.fillStyle = '#0a0a1e'
  for (let y = 80; y < 512; y += 160) {
    for (let x = 48; x < 512; x += 64) {
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
    }
  }
  return toTex(canvas)
}

// ── Stone tiles — floor ───────────────────────────────────────────────────────

function makeFloor(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx(512)
  const d = img.data
  const TILE = 128
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const tx = Math.floor(x / TILE)
      const ty = Math.floor(y / TILE)
      const px = x % TILE, py = y % TILE
      const grout = px < 5 || py < 5 ? 0.35 : 1
      const tv    = smoothNoise(tx * 1.73, ty * 1.31, 7) * 0.18
      const sv    = smoothNoise(x / 35, y / 35, tx * 4 + ty) * 0.1
      const base  = 14 + (tv + sv) * 40
      const v     = base * grout
      const i     = (y * 512 + x) * 4
      d[i]     = v * 0.65
      d[i + 1] = v * 0.70
      d[i + 2] = v * 1.25
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  // grout fill pass (anti-aliased look)
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#06060f'
  for (let x = 0; x < 512; x += TILE) ctx.fillRect(x, 0, 3, 512)
  for (let y = 0; y < 512; y += TILE) ctx.fillRect(0, y, 512, 3)
  ctx.globalAlpha = 1
  return toTex(canvas)
}

// ── Panel concrete — arena border walls ───────────────────────────────────────

function makeArenaWall(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx(512)
  const d = img.data
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const n     = fbm(x / 55, y / 55, 3, 3)
      const panel = (y % 128) < 5 ? 0.6 : 1
      const bolt  = (x % 128) < 3 ? 0.75 : 1
      const v     = (10 + n * 16) * panel * bolt
      const i     = (y * 512 + x) * 4
      d[i]     = v * 0.48
      d[i + 1] = v * 0.52
      d[i + 2] = v * 1.1
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTex(canvas)
}

// ── Singleton cache ───────────────────────────────────────────────────────────

let _cache: {
  concrete:  THREE.CanvasTexture
  wood:      THREE.CanvasTexture
  metal:     THREE.CanvasTexture
  floor:     THREE.CanvasTexture
  arenaWall: THREE.CanvasTexture
} | null = null

export function getTextures() {
  if (!_cache) {
    _cache = {
      concrete:  makeConcrete(),
      wood:      makeWood(),
      metal:     makeMetal(),
      floor:     makeFloor(),
      arenaWall: makeArenaWall(),
    }
  }
  return _cache
}

/** Clone a texture and set its UV repeat for an object of given world dimensions. */
export function cloneForObject(
  base: THREE.CanvasTexture,
  sx: number,
  sz: number,
  tileWorld = 2,
): THREE.CanvasTexture {
  const t = base.clone()
  t.needsUpdate = true
  t.repeat.set(sx / tileWorld, sz / tileWorld)
  return t
}
