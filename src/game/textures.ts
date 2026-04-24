import * as THREE from 'three'
import type { ObjectType } from '../editor/editorStore'

// ── Types ─────────────────────────────────────────────────────────────────────

export type TextureKey =
  | 'concrete'
  | 'concrete_worn'
  | 'brick'
  | 'wood'
  | 'wood_dark'
  | 'metal'
  | 'metal_grid'
  | 'stone_dark'
  | 'tiles'

export interface TextureMeta {
  label:     string
  tileWorld: number   // world units one texture tile covers
}

export const TEXTURE_META: Record<TextureKey, TextureMeta> = {
  concrete:      { label: 'Beton',          tileWorld: 2   },
  concrete_worn: { label: 'Beton (verwittert)', tileWorld: 2 },
  brick:         { label: 'Ziegel',         tileWorld: 1.5 },
  wood:          { label: 'Holz',           tileWorld: 1   },
  wood_dark:     { label: 'Dunkles Holz',   tileWorld: 1   },
  metal:         { label: 'Metall',         tileWorld: 1   },
  metal_grid:    { label: 'Metallgitter',   tileWorld: 1   },
  stone_dark:    { label: 'Dunkelstein',    tileWorld: 1.5 },
  tiles:         { label: 'Fliesen',        tileWorld: 1   },
}

export const DEFAULT_TEXTURE: Record<ObjectType, TextureKey> = {
  wall:   'concrete',
  cover:  'concrete',
  crate:  'wood',
  pillar: 'metal',
  spawn:  'concrete',
}

// ── Noise helpers ─────────────────────────────────────────────────────────────

function hash(x: number, y: number, s = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.3) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number, s = 0): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix,        fy = y - iy
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
  return [c, ctx, ctx.createImageData(sz, sz)]
}

function toTex(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}

// ── Concrete ──────────────────────────────────────────────────────────────────

function makeConcrete(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx()
  const d = img.data
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const n  = fbm(x / 70, y / 70, 0, 4)
      const n2 = fbm(x / 25, y / 25, 7, 3)
      const joint   = (y % 96) < 4  ? 0.72 : 1
      const shutter = (x % 192) < 3 ? 0.82 : 1
      const v = (28 + n * 28 + n2 * 6) * joint * shutter
      const i = (y * 512 + x) * 4
      d[i] = v * 0.52; d[i+1] = v * 0.62; d[i+2] = v * 1.05; d[i+3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTex(canvas)
}

// ── Concrete worn ─────────────────────────────────────────────────────────────

function makeConcreteWorn(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx()
  const d = img.data
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const n  = fbm(x / 55, y / 55, 1, 5)
      const crack = fbm(x / 20, y / 22, 9, 4)
      const stain = smoothNoise(x / 80, y / 80, 3) * 0.3
      const joint = (y % 80) < 3 ? 0.6 : 1
      const cr = crack < 0.3 ? 0.75 : 1
      const v  = (18 + n * 22 - stain * 8) * joint * cr
      const i  = (y * 512 + x) * 4
      d[i] = v * 0.55; d[i+1] = v * 0.58; d[i+2] = v * 0.75; d[i+3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTex(canvas)
}

// ── Brick ─────────────────────────────────────────────────────────────────────

function makeBrick(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx()
  const d = img.data
  const BH = 42, BW = 96
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const row    = Math.floor(y / BH)
      const offset = (row % 2) * (BW / 2)
      const bx     = Math.floor((x + offset) % 512 / BW)
      const px     = ((x + offset) % 512) % BW
      const py     = y % BH
      // mortar
      const mortar = px < 5 || py < 5 ? 0 : 1
      // per-brick color variation
      const bv = smoothNoise(bx * 1.3 + row * 0.7, row * 0.9 + bx * 0.5, 2) * 0.25
      // surface noise
      const sv = smoothNoise(x / 15, y / 15, bx + row) * 0.12
      const base = mortar === 0 ? 18 : (55 + bv * 40 + sv * 20)
      const i = (y * 512 + x) * 4
      if (mortar === 0) {
        d[i] = base * 0.9; d[i+1] = base * 0.85; d[i+2] = base * 0.7; d[i+3] = 255
      } else {
        d[i] = base * 1.1; d[i+1] = base * 0.45; d[i+2] = base * 0.28; d[i+3] = 255
      }
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTex(canvas)
}

// ── Wood ──────────────────────────────────────────────────────────────────────

function makeWood(dark = false): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx()
  const d = img.data
  const PW = 80
  const mult = dark ? 0.55 : 1
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const pi   = Math.floor(x / PW)
      const px   = (x % PW) / PW
      const grain = smoothNoise(x / 18, y / 18 + px + smoothNoise(x / 80, y / 90, pi) * 2, pi + 3) * 0.35
      const edge  = Math.min(1, Math.min(px, 1 - px) * 7)
      const base  = (55 + pi * 9 + grain * 40) * mult
      const v     = base * edge
      const i     = (y * 512 + x) * 4
      d[i] = v; d[i+1] = v * 0.72; d[i+2] = v * 0.32; d[i+3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  ctx.fillStyle = dark ? '#0d0500' : '#1a0a00'
  for (let x = 0; x < 512; x += PW) ctx.fillRect(x, 0, 2, 512)
  ctx.fillStyle = dark ? '#090300' : '#0f0600'
  for (let y = 0; y < 512; y += 256) ctx.fillRect(0, y, 512, 2)
  return toTex(canvas)
}

// ── Brushed metal ─────────────────────────────────────────────────────────────

function makeMetal(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx()
  const d = img.data
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const brush = (x % 6) / 6
      const bn    = smoothNoise(x / 5, y / 60, 0) * 0.4
      const sheen = brush * 0.4 + bn + 0.45
      const hy    = y / 512
      const hi    = Math.max(0, 1 - Math.abs(hy - 0.5) * 5) * 0.25
      const n     = smoothNoise(x / 50, y / 50, 2) * 0.12
      const v     = (20 + n * 20) * sheen * (1 + hi)
      const i     = (y * 512 + x) * 4
      d[i] = v * 0.48; d[i+1] = v * 0.52; d[i+2] = v * 0.92; d[i+3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  ctx.fillStyle = '#0a0a1e'
  for (let ry = 80; ry < 512; ry += 160)
    for (let rx = 48; rx < 512; rx += 64) {
      ctx.beginPath(); ctx.arc(rx, ry, 4, 0, Math.PI * 2); ctx.fill()
    }
  return toTex(canvas)
}

// ── Metal grid / grating ──────────────────────────────────────────────────────

function makeMetalGrid(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx()
  const d = img.data
  const CELL = 32
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const cx = x % CELL, cy = y % CELL
      const bar  = cx < 6 || cy < 6 ? 1 : 0
      const diag = Math.abs(cx - cy) < 3 || Math.abs(cx - (CELL - cy)) < 3 ? 0.5 : 0
      const n    = smoothNoise(x / 30, y / 30, 1) * 0.15
      const onBar = bar > 0 || diag > 0
      const v    = onBar ? (25 + n * 20) * Math.max(bar, diag) : 5
      const i    = (y * 512 + x) * 4
      d[i] = v * 0.4; d[i+1] = v * 0.45; d[i+2] = v * 0.85; d[i+3] = onBar ? 255 : 180
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTex(canvas)
}

// ── Dark stone ────────────────────────────────────────────────────────────────

function makestoneDark(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx()
  const d = img.data
  const BH = 56, BW = 110
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const row    = Math.floor(y / BH)
      const offset = (row % 2) * (BW / 2)
      const px     = ((x + offset) % 512) % BW
      const py     = y % BH
      const mortar = px < 6 || py < 6 ? 0 : 1
      const sv     = fbm(x / 30, y / 30, row + 1, 3) * 0.2
      const base   = mortar === 0 ? 8 : (12 + sv * 18)
      const i      = (y * 512 + x) * 4
      d[i] = base * 0.55; d[i+1] = base * 0.60; d[i+2] = base * 1.0; d[i+3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTex(canvas)
}

// ── Clean tiles ───────────────────────────────────────────────────────────────

function makeTiles(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx()
  const d = img.data
  const T = 128
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const px = x % T, py = y % T
      const grout = px < 6 || py < 6 ? 0 : 1
      const n     = smoothNoise(x / 60, y / 60, 5) * 0.08
      const base  = grout === 0 ? 14 : (44 + n * 20)
      const i     = (y * 512 + x) * 4
      d[i] = base * 0.8; d[i+1] = base * 0.85; d[i+2] = base * 1.1; d[i+3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTex(canvas)
}

// ── Floor (arena, not selectable per object) ──────────────────────────────────

function makeFloor(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx()
  const d = img.data
  const TILE = 128
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE)
      const px = x % TILE,              py = y % TILE
      const grout = px < 5 || py < 5 ? 0.35 : 1
      const tv    = smoothNoise(tx * 1.73, ty * 1.31, 7) * 0.18
      const sv    = smoothNoise(x / 35, y / 35, tx * 4 + ty) * 0.1
      const base  = 14 + (tv + sv) * 40
      const v     = base * grout
      const i     = (y * 512 + x) * 4
      d[i] = v * 0.65; d[i+1] = v * 0.70; d[i+2] = v * 1.25; d[i+3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#06060f'
  for (let x = 0; x < 512; x += TILE) ctx.fillRect(x, 0, 3, 512)
  for (let y = 0; y < 512; y += TILE) ctx.fillRect(0, y, 512, 3)
  ctx.globalAlpha = 1
  return toTex(canvas)
}

// ── Arena wall ────────────────────────────────────────────────────────────────

function makeArenaWall(): THREE.CanvasTexture {
  const [canvas, ctx, img] = makeCtx()
  const d = img.data
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const n     = fbm(x / 55, y / 55, 3, 3)
      const panel = (y % 128) < 5 ? 0.6 : 1
      const bolt  = (x % 128) < 3 ? 0.75 : 1
      const v     = (10 + n * 16) * panel * bolt
      const i     = (y * 512 + x) * 4
      d[i] = v * 0.48; d[i+1] = v * 0.52; d[i+2] = v * 1.1; d[i+3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTex(canvas)
}

// ── Singleton cache ───────────────────────────────────────────────────────────

type Cache = { [K in TextureKey]: THREE.CanvasTexture } & {
  floor:     THREE.CanvasTexture
  arenaWall: THREE.CanvasTexture
}

let _cache: Cache | null = null

export function getTextures(): Cache {
  if (!_cache) {
    _cache = {
      concrete:      makeConcrete(),
      concrete_worn: makeConcreteWorn(),
      brick:         makeBrick(),
      wood:          makeWood(false),
      wood_dark:     makeWood(true),
      metal:         makeMetal(),
      metal_grid:    makeMetalGrid(),
      stone_dark:    makestoneDark(),
      tiles:         makeTiles(),
      floor:         makeFloor(),
      arenaWall:     makeArenaWall(),
    }
  }
  return _cache
}

/** Clone a base texture with UV repeat sized to world dimensions. */
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

/** Get the THREE texture for a given TextureKey. */
export function getObjectTexture(key: TextureKey, sx: number, sz: number): THREE.CanvasTexture {
  const meta = TEXTURE_META[key]
  return cloneForObject(getTextures()[key], sx, sz, meta.tileWorld)
}

// ── Thumbnail data-URLs (48×48) for the editor UI ────────────────────────────

const _thumbCache = new Map<TextureKey, string>()

export function getThumbnail(key: TextureKey): string {
  if (_thumbCache.has(key)) return _thumbCache.get(key)!
  const src = getTextures()[key].image as HTMLCanvasElement
  const thumb = document.createElement('canvas')
  thumb.width = thumb.height = 48
  const ctx = thumb.getContext('2d')!
  ctx.drawImage(src, 0, 0, 48, 48)
  const url = thumb.toDataURL('image/jpeg', 0.85)
  _thumbCache.set(key, url)
  return url
}
