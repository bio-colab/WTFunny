// Solid Bodies Physics & High-Fidelity Vector World:
// Native 100% crisp typography, vector boxes/cards, full-resolution images,
// rigid-body physics, kinetic impulse, dislodging, and polygon/glyph fracturing.

import { ConfigManager } from './engineConfig'

export const CELL = 1
export const SKY_ROWS = 160

export const MAT_EMPTY = 0
export const MAT_SOLID = 1
export const MAT_BEDROCK = 3

export type ElementKind = 'glyph' | 'box' | 'image'
export type SolidBodyKind = 'word' | 'box' | 'image'
export type SemanticRole = 'portal' | 'structure' | 'trigger' | 'platform' | 'heavy' | 'decorative'

export type LevelElement = {
  id: number
  kind: ElementKind
  cells: number[]
  lost: number
  hp: number
  alive: boolean
  color?: number
  label?: string
  text?: string
  font?: string
  colorStr?: string
  isWord?: boolean
  w?: number
  h?: number
  image?: HTMLImageElement | null
  svgXml?: string
  href?: string
  tag?: string
  semanticRole?: SemanticRole
}

export interface ShardPiece {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  life: number
  maxLife: number
  kind: 'glyph' | 'polygon'
  material?: 'screen' | 'masonry' | 'beam' | 'pellet' | 'glyph'

  // Glyph shard (from shattered word):
  text?: string
  font?: string
  color?: string

  // Polygon shard (from shattered box / image):
  poly?: { x: number; y: number }[]
  colorStr?: string
  bgGrad?: { type: 'linear'; angle: number; stops: { c: string; p: number }[] } | null
  border?: { w: number; c: string } | null
  image?: HTMLImageElement | null
  uvX?: number
  uvY?: number
  uvW?: number
  uvH?: number

  settled: boolean
}

export interface SolidBody {
  id: number
  kind: SolidBodyKind
  tag?: string
  semanticRole?: SemanticRole
  href?: string

  // Spatial & Physics (World Coordinates)
  x: number        // Left (world px)
  y: number        // Top (world px)
  w: number        // Width (world px)
  h: number        // Height (world px)
  baseY?: number   // Baseline Y for typography

  vx: number       // Velocity X
  vy: number       // Velocity Y
  rot: number      // Angle in radians
  vrot: number     // Angular velocity (rad/s)
  mass: number     // Mass (based on area)
  hp: number       // Current health
  maxHp: number    // Initial max health
  anchored: boolean // True = attached to page layout; false = physical dynamic body
  settled: boolean  // True = stopped moving after falling
  settleT: number
  destroyed: boolean
  burning: number   // 0 = normal, >0 = burning timer

  // Typography (kind === 'word')
  text?: string
  font?: string
  color?: string
  underline?: boolean

  // Box Styling (kind === 'box')
  bg?: string | null
  grad?: { type: 'linear'; angle: number; stops: { c: string; p: number }[] } | null
  radius?: [number, number, number, number]
  border?: { w: number; c: string } | null
  shadow?: { color: string; x: number; y: number; blur: number } | null

  // Image Styling (kind === 'image')
  image?: HTMLImageElement | null
  imgFit?: string
  svgXml?: string

  // Visual damage decals: punctures & scorches
  damageDecals: { rx: number; ry: number; r: number }[]

  // Hierarchy
  parentId?: number
  children?: number[]
}

export type Chunk = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  gw: number
  gh: number
  pix: Uint32Array
  canvas: HTMLCanvasElement
  life: number
  settled: boolean
  settleT: number
  isVector?: boolean
  vectorText?: string
  vectorFont?: string
  vectorColor?: string
  vectorImage?: HTMLImageElement | null
  vectorW?: number
  vectorH?: number
}

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  kind: 'spark' | 'smoke' | 'ember' | 'debris' | 'shell' | 'flash' | 'paper' | 'star' | 'glow'
  color: string
  size: number
  rot?: number
  vrot?: number
  grav?: number
}

export type BurnCell = { idx: number; t: number; dur: number }

const FIRE_COLORS = ['#fff3a6', '#ffd23d', '#ff8a2a', '#f2561d']
const SMOKE_COLORS = ['#5b5566', '#3f3a4a', '#2a2633', '#6e6670']

export class World {
  GW = 0
  GH = 0
  W = 0
  H = 0

  // Spatial Buckets for O(1) Collision & Fast Multi-Body Lookups:
  BUCKET_SIZE = 32
  bucketCols = 0
  bucketRows = 0
  spatialBuckets: number[][] = []

  // Legacy compatibility grid arrays (allocated lazily on demand if legacy loader is called):
  mat: Uint8Array | null = null
  color: Uint32Array | null = null
  owner: Int32Array | null = null
  heat: Uint8Array | null = null
  pixBuf: Uint32Array | null = null
  imgData: ImageData | null = null
  levelCanvas: HTMLCanvasElement | null = null
  levelCtx: CanvasRenderingContext2D | null = null
  dirty = true

  // Solid Bodies Engine:
  bodies: SolidBody[] = []
  dynamicBodies: SolidBody[] = []
  settledBodies: SolidBody[] = []
  shards: ShardPiece[] = []
  particles: Particle[] = []
  burns: BurnCell[] = []
  burnAcc = 0

  elements = new Map<number, LevelElement>()
  totalMass = 1
  destroyedMass = 0
  totalCells = 1
  destroyedCells = 0
  blocksBroken = 0
  lettersPopped = 0
  explosions = 0
  chunks: Chunk[] = []

  onElementGone?: (el: LevelElement) => void
  onShatter?: (b: SolidBody, force: number) => void
  onCellDestroyed?: (wx: number, wy: number, colorABGR: number) => void

  init(W: number, H: number) {
    this.W = W
    this.H = H
    this.GW = Math.ceil(W / CELL)
    this.GH = Math.ceil(H / CELL)
    this.bucketCols = Math.ceil(W / this.BUCKET_SIZE)
    this.bucketRows = Math.ceil(H / this.BUCKET_SIZE)

    const nBuckets = this.bucketCols * this.bucketRows
    this.spatialBuckets = new Array(nBuckets)
    for (let i = 0; i < nBuckets; i++) {
      this.spatialBuckets[i] = []
    }

    // Modern SolidBody engine: lazy initialization for legacy voxel arrays to prevent 340MB+ RAM allocation
    this.mat = null
    this.color = null
    this.owner = null
    this.heat = null
    this.pixBuf = null
    this.imgData = null
    this.levelCanvas = null
    this.levelCtx = null

    this.bodies = []
    this.dynamicBodies = []
    this.settledBodies = []
    this.shards = []
    this.particles = []
    this.burns = []
    this.elements.clear()
    this.chunks = []
    this.destroyedCells = 0
    this.destroyedMass = 0
    this.blocksBroken = 0
    this.lettersPopped = 0
    this.explosions = 0
    this.totalCells = 1
    this.totalMass = 1
  }

  ensureLegacyBuffers() {
    if (this.mat) return
    const n = this.GW * this.GH
    this.mat = new Uint8Array(n)
    this.color = new Uint32Array(n)
    this.owner = new Int32Array(n).fill(-1)
    this.heat = new Uint8Array(n)
    this.pixBuf = new Uint32Array(n)
    this.imgData = new ImageData(this.GW, this.GH)
    new Uint32Array(this.imgData.data.buffer).set(this.pixBuf)
    this.levelCanvas = document.createElement('canvas')
    this.levelCanvas.width = Math.min(32, this.GW)
    this.levelCanvas.height = Math.min(32, this.GH)
    this.levelCtx = this.levelCanvas.getContext('2d')!

    const bedrockY0 = Math.max(0, this.H - 28)
    const bedCy0 = Math.floor(bedrockY0 / CELL)
    for (let cy = bedCy0; cy < this.GH; cy++) {
      const row = cy * this.GW
      for (let cx = 0; cx < this.GW; cx++) {
        this.mat[row + cx] = MAT_BEDROCK
      }
    }
  }

  idx(cx: number, cy: number) {
    return cy * this.GW + cx
  }

  // Load crisp Solid Bodies parsed by loader
  loadBodies(bodies: SolidBody[], W: number, H: number, skyOffset = 0) {
    this.bodies = bodies
    let totalM = 0

    // Clear existing bucket entries
    for (let i = 0; i < this.spatialBuckets.length; i++) {
      this.spatialBuckets[i].length = 0
    }

    for (let bIdx = 0; bIdx < bodies.length; bIdx++) {
      const b = bodies[bIdx]
      b.y += skyOffset
      if (b.baseY !== undefined) b.baseY += skyOffset
      b.id = bIdx
      totalM += b.mass

      // Stamp anchored body into spatial buckets for fast O(1) collision
      this.addBodyToBuckets(b, bIdx)

      // Also map to LevelElement for HUD / stats compatibility
      const el: LevelElement = {
        id: b.id,
        kind: b.kind === 'word' ? 'glyph' : b.kind,
        cells: [],
        lost: 0,
        hp: b.hp,
        alive: true,
        label: b.text || b.tag || 'SolidBody',
        text: b.text,
        font: b.font,
        colorStr: b.color,
        w: b.w,
        h: b.h,
        image: b.image,
        svgXml: b.svgXml,
        href: b.href,
        tag: b.tag,
        semanticRole: b.semanticRole,
      }
      this.elements.set(b.id, el)
    }

    // Build parent-child relationships for hierarchical collapsing:
    // Local UI cards/containers collapse their direct nested children when dislodged.
    // Huge page-level wrappers are excluded so they never cause a site-wide cascade.
    for (let j = 0; j < bodies.length; j++) {
      const child = bodies[j]
      let bestParent: SolidBody | null = null
      let bestArea = Infinity

      for (let i = 0; i < bodies.length; i++) {
        if (i === j) continue
        const parent = bodies[i]
        if (parent.kind !== 'box') continue

        // Skip massive structural page wrappers
        if (parent.w > W * 0.72 || parent.h > 520 || parent.mass > 2400) continue

        // Parent must be strictly larger than child
        if (parent.w * parent.h <= child.w * child.h) continue

        if (
          child.x >= parent.x - 2 &&
          child.x + child.w <= parent.x + parent.w + 2 &&
          child.y >= parent.y - 2 &&
          child.y + child.h <= parent.y + parent.h + 2
        ) {
          const area = parent.w * parent.h
          if (area < bestArea) {
            bestArea = area
            bestParent = parent
          }
        }
      }

      if (bestParent) {
        child.parentId = bestParent.id
        if (!bestParent.children) bestParent.children = []
        bestParent.children.push(child.id)
      }
    }

    this.totalMass = Math.max(1, totalM)
    this.totalCells = Math.max(1, totalM)
    this.dirty = true
  }

  // Fallback / legacy bridge loader
  loadFromLoader(
    colors: Uint32Array,
    owners: Int32Array,
    elements: Map<number, LevelElement>,
    pageGW: number,
    pageGH: number
  ) {
    this.ensureLegacyBuffers()
    const mat = this.mat!
    const color = this.color!
    const owner = this.owner!
    const pixBuf = this.pixBuf!

    color.fill(0)
    owner.fill(-1)
    mat.fill(MAT_EMPTY)
    this.elements = elements
    for (let cy = 0; cy < pageGH; cy++) {
      const dstRow = (cy + SKY_ROWS) * this.GW
      const srcRow = cy * pageGW
      for (let cx = 0; cx < pageGW; cx++) {
        const c = colors[srcRow + cx]
        const own = owners[srcRow + cx]
        if (c !== 0 && own >= 0) {
          const i = dstRow + cx
          mat[i] = MAT_SOLID
          color[i] = c
          pixBuf[i] = c
          owner[i] = own
        }
      }
    }
    const bed = packColor('#1e1e1e')
    for (let cy = this.GH - 28; cy < this.GH; cy++) {
      for (let cx = 0; cx < this.GW; cx++) {
        const i = this.idx(cx, cy)
        mat[i] = MAT_BEDROCK
        color[i] = bed
        pixBuf[i] = bed
      }
    }
    this.totalCells = Math.max(1, elements.size * 100)
    this.dirty = true
  }

  addBodyToBuckets(b: SolidBody, bIdx: number) {
    const bx0 = Math.max(0, Math.floor(b.x / this.BUCKET_SIZE))
    const by0 = Math.max(0, Math.floor(b.y / this.BUCKET_SIZE))
    const bx1 = Math.min(this.bucketCols - 1, Math.floor((b.x + b.w) / this.BUCKET_SIZE))
    const by1 = Math.min(this.bucketRows - 1, Math.floor((b.y + b.h) / this.BUCKET_SIZE))

    for (let by = by0; by <= by1; by++) {
      const row = by * this.bucketCols
      for (let bx = bx0; bx <= bx1; bx++) {
        const list = this.spatialBuckets[row + bx]
        if (list && !list.includes(bIdx)) {
          list.push(bIdx)
        }
      }
    }
  }

  removeBodyFromBuckets(b: SolidBody, bIdx: number) {
    const bx0 = Math.max(0, Math.floor(b.x / this.BUCKET_SIZE))
    const by0 = Math.max(0, Math.floor(b.y / this.BUCKET_SIZE))
    const bx1 = Math.min(this.bucketCols - 1, Math.floor((b.x + b.w) / this.BUCKET_SIZE))
    const by1 = Math.min(this.bucketRows - 1, Math.floor((b.y + b.h) / this.BUCKET_SIZE))

    for (let by = by0; by <= by1; by++) {
      const row = by * this.bucketCols
      for (let bx = bx0; bx <= bx1; bx++) {
        const list = this.spatialBuckets[row + bx]
        if (list) {
          const idx = list.indexOf(bIdx)
          if (idx >= 0) {
            list[idx] = list[list.length - 1]
            list.pop()
          }
        }
      }
    }
  }

  getBodiesInAABB(minX: number, minY: number, maxX: number, maxY: number): SolidBody[] {
    const bx0 = Math.max(0, Math.floor(minX / this.BUCKET_SIZE))
    const by0 = Math.max(0, Math.floor(minY / this.BUCKET_SIZE))
    const bx1 = Math.min(this.bucketCols - 1, Math.floor(maxX / this.BUCKET_SIZE))
    const by1 = Math.min(this.bucketRows - 1, Math.floor(maxY / this.BUCKET_SIZE))

    const visited = new Set<number>()
    const result: SolidBody[] = []

    for (let by = by0; by <= by1; by++) {
      const row = by * this.bucketCols
      for (let bx = bx0; bx <= bx1; bx++) {
        const list = this.spatialBuckets[row + bx]
        if (!list) continue
        for (let i = 0; i < list.length; i++) {
          const id = list[i]
          if (!visited.has(id)) {
            visited.add(id)
            const b = this.bodies[id]
            if (b && !b.destroyed) {
              result.push(b)
            }
          }
        }
      }
    }

    // Also include dynamic & settled bodies overlapping the AABB
    for (let i = 0; i < this.dynamicBodies.length; i++) {
      const b = this.dynamicBodies[i]
      if (!b.destroyed && !visited.has(b.id)) {
        if (b.x + b.w >= minX && b.x <= maxX && b.y + b.h >= minY && b.y <= maxY) {
          visited.add(b.id)
          result.push(b)
        }
      }
    }
    for (let i = 0; i < this.settledBodies.length; i++) {
      const b = this.settledBodies[i]
      if (!b.destroyed && !visited.has(b.id)) {
        if (b.x + b.w >= minX && b.x <= maxX && b.y + b.h >= minY && b.y <= maxY) {
          visited.add(b.id)
          result.push(b)
        }
      }
    }

    return result
  }

  // --- O(1) Collision Check using Spatial Buckets ---
  solidAtWorld(wx: number, wy: number): boolean {
    if (wx < 0 || wx >= this.W) return true
    if (wy < 0) return false
    if (wy >= this.H - 24) return true // Bedrock floor

    // 1) Spatial buckets check (anchored solid bodies: words & images are solid blocks)
    const bx = Math.floor(wx / this.BUCKET_SIZE)
    const by = Math.floor(wy / this.BUCKET_SIZE)
    if (bx >= 0 && bx < this.bucketCols && by >= 0 && by < this.bucketRows) {
      const list = this.spatialBuckets[by * this.bucketCols + bx]
      if (list) {
        for (let i = 0; i < list.length; i++) {
          const b = this.bodies[list[i]]
          if (b && b.anchored && !b.destroyed) {
            // Words and images are solid physical obstacles (containers are open scenery/platforms)
            if (b.kind === 'word' || b.kind === 'image') {
              if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
                return true
              }
            }
          }
        }
      }
    }

    // 2) Check settled fallen bodies (rubble on the ground)
    for (let i = 0; i < this.settledBodies.length; i++) {
      const b = this.settledBodies[i]
      if (!b.destroyed && wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
        return true
      }
    }

    // 3) Legacy mat fallback check
    if (this.mat) {
      const cx = Math.floor(wx / CELL)
      const cy = Math.floor(wy / CELL)
      if (cx >= 0 && cx < this.GW && cy >= 0 && cy < this.GH) {
        const m = this.mat[cy * this.GW + cx]
        if (m === MAT_SOLID || m === MAT_BEDROCK) return true
      }
    }

    return false
  }

  // Check if (wx, wy) is touching the top platform surface of an anchored container box
  platformAtWorld(wx: number, wy: number): boolean {
    if (wx < 0 || wx >= this.W || wy < 0 || wy >= this.H) return false

    const bx = Math.floor(wx / this.BUCKET_SIZE)
    const by = Math.floor(wy / this.BUCKET_SIZE)
    if (bx >= 0 && bx < this.bucketCols && by >= 0 && by < this.bucketRows) {
      const list = this.spatialBuckets[by * this.bucketCols + bx]
      if (list) {
        for (let i = 0; i < list.length; i++) {
          const b = this.bodies[list[i]]
          if (b && b.kind === 'box' && b.anchored && !b.destroyed) {
            // Top ledge platform: top 5px of the box
            if (wx >= b.x && wx <= b.x + b.w && wy >= b.y - 1 && wy <= b.y + 5) {
              return true
            }
          }
        }
      }
    }
    return false
  }

  destroyedPct() {
    if (this.totalMass <= 0) return 0
    return Math.min(1, this.destroyedMass / this.totalMass)
  }

  // Find solid body at world coords (prefers smallest overlapping body, so words inside cards are hit first)
  findBodyAt(wx: number, wy: number): SolidBody | null {
    let bestMatch: SolidBody | null = null
    let bestArea = Infinity

    // 1) Spatial bucket check
    const bx = Math.floor(wx / this.BUCKET_SIZE)
    const by = Math.floor(wy / this.BUCKET_SIZE)
    if (bx >= 0 && bx < this.bucketCols && by >= 0 && by < this.bucketRows) {
      const list = this.spatialBuckets[by * this.bucketCols + bx]
      if (list) {
        for (let i = 0; i < list.length; i++) {
          const b = this.bodies[list[i]]
          if (b && b.anchored && !b.destroyed && wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
            const area = b.w * b.h
            if (area < bestArea) {
              bestArea = area
              bestMatch = b
            }
          }
        }
      }
    }
    if (bestMatch) return bestMatch

    // 2) Check dynamic bodies
    for (let i = 0; i < this.dynamicBodies.length; i++) {
      const b = this.dynamicBodies[i]
      if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h && !b.destroyed) return b
    }

    // 3) Check settled bodies
    for (let i = 0; i < this.settledBodies.length; i++) {
      const b = this.settledBodies[i]
      if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h && !b.destroyed) return b
    }

    return null
  }

  // Direct weapon hit on a body
  hitBodyAt(wx: number, wy: number, dmg: number, impulseX = 0, impulseY = 0): SolidBody | null {
    const b = this.findBodyAt(wx, wy)
    if (!b || b.destroyed) return null

    b.hp -= dmg
    b.damageDecals.push({
      rx: Math.max(2, Math.min(b.w - 2, wx - b.x)),
      ry: Math.max(2, Math.min(b.h - 2, wy - b.y)),
      r: Math.min(8, 2 + dmg * 0.12),
    })

    // Guard large anchored bodies from overeager dislodging:
    const impulseMag = Math.hypot(impulseX, impulseY)
    const isLarge = b.mass > 1200
    const hpDislodgeThresh = isLarge ? b.maxHp * 0.45 : b.maxHp * 0.75
    const impulseDislodgeThresh = Math.max(90, Math.min(650, Math.sqrt(b.mass) * 14))

    if (b.anchored && (b.hp <= hpDislodgeThresh || impulseMag >= impulseDislodgeThresh)) {
      this.dislodgeBody(b, impulseX, impulseY)
    } else if (!b.anchored) {
      const pushFactor = Math.min(12, 180 / b.mass)
      b.vx += impulseX * pushFactor
      b.vy += impulseY * pushFactor
      b.vrot += (Math.random() - 0.5) * 4
    }

    if (b.hp <= 0) {
      this.shatterBody(b, wx, wy, Math.hypot(impulseX, impulseY) || 300, impulseX, impulseY)
    }

    return b
  }

  // Break anchor from layout: body becomes dynamic rigid body, and collapses children
  dislodgeBody(b: SolidBody, impulseX = 0, impulseY = 0) {
    if (!b.anchored || b.destroyed) return
    b.anchored = false
    this.removeBodyFromBuckets(b, b.id)

    const pushFactor = Math.min(14, 220 / b.mass)
    b.vx = impulseX * pushFactor + (Math.random() - 0.5) * 80
    b.vy = impulseY * pushFactor - 80 - Math.random() * 120
    b.vrot = (Math.random() - 0.5) * 8
    b.settled = false
    b.settleT = 0

    if (!this.dynamicBodies.includes(b)) {
      this.dynamicBodies.push(b)
    }

    if (b.kind === 'word') this.lettersPopped++
    else this.blocksBroken++

    const el = this.elements.get(b.id)
    if (el) {
      el.alive = false
      this.onElementGone?.(el)
    }

    // Cascade dislodge to all nested child bodies:
    if (b.children && b.children.length > 0) {
      for (let c = 0; c < b.children.length; c++) {
        const child = this.bodies[b.children[c]]
        if (child && child.anchored && !child.destroyed) {
          this.dislodgeBody(child, impulseX * 0.95, impulseY * 0.95)
        }
      }
    }
  }

  // Settled debris can be woken back up by blast impulses, explosions, or gravity wells
  wakeBody(b: SolidBody) {
    if (!b.settled || b.destroyed) return
    b.settled = false
    b.settleT = 0
    const at = this.settledBodies.indexOf(b)
    if (at >= 0) {
      const last = this.settledBodies.pop()!
      if (at < this.settledBodies.length) this.settledBodies[at] = last
    }
    if (!this.dynamicBodies.includes(b)) this.dynamicBodies.push(b)
  }

  // Fracture and shatter a body into vector shards
  shatterBody(b: SolidBody, hitX: number, hitY: number, force = 380, impulseX = 0, impulseY = 0) {
    if (b.destroyed) return
    b.destroyed = true
    b.hp = 0

    if (b.anchored) {
      this.removeBodyFromBuckets(b, b.id)
      b.anchored = false
    }

    // Remove from dynamic/settled arrays with O(1) swap-and-pop
    const dynIdx = this.dynamicBodies.indexOf(b)
    if (dynIdx >= 0) {
      const last = this.dynamicBodies.pop()!
      if (dynIdx < this.dynamicBodies.length) this.dynamicBodies[dynIdx] = last
    }
    const setIdx = this.settledBodies.indexOf(b)
    if (setIdx >= 0) {
      const last = this.settledBodies.pop()!
      if (setIdx < this.settledBodies.length) this.settledBodies[setIdx] = last
    }

    this.destroyedMass += b.mass
    this.destroyedCells += Math.round(b.mass * 2)

    // Trigger hit-stop and high-impact camera shake callback
    this.onShatter?.(b, force)

    // Generate physical shards based on material classification
    if (b.kind === 'word') {
      const wordShards = generateWordShards(b, hitX, hitY, force, impulseX, impulseY)
      this.shards.push(...wordShards)
      this.lettersPopped++

      // Paper / text confetti sparks
      for (let i = 0; i < 8; i++) {
        this.spawnParticle({
          x: b.x + Math.random() * b.w,
          y: b.y + Math.random() * b.h,
          vx: (Math.random() - 0.5) * 240 + impulseX * 0.2,
          vy: -80 - Math.random() * 200 + impulseY * 0.2,
          life: 0.6 + Math.random() * 0.6,
          max: 1.2,
          kind: 'paper',
          color: b.color || '#ffffff',
          size: 2.5 + Math.random() * 2.5,
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 12,
          grav: 1200,
        })
      }
    } else if (b.kind === 'image') {
      // 1) Digital Screen / Media Display: cracked LCD matrix quads
      const screenShards = generateDigitalScreenShards(b, hitX, hitY, force, impulseX, impulseY)
      this.shards.push(...screenShards)
      this.blocksBroken++

      // Digital screen glitch sparks & thin electrical smoke
      this.puffAt(b.x + b.w / 2, b.y + b.h / 2, Math.max(10, Math.min(32, b.w / 3)))
      const CYBER_SPARKS = ['#38bdf8', '#818cf8', '#c084fc', '#facc15', '#ffffff']
      for (let i = 0; i < 12; i++) {
        this.spawnParticle({
          x: b.x + Math.random() * b.w,
          y: b.y + Math.random() * b.h,
          vx: (Math.random() - 0.5) * 320 + impulseX * 0.3,
          vy: -100 - Math.random() * 220 + impulseY * 0.3,
          life: 0.4 + Math.random() * 0.4,
          max: 0.8,
          kind: 'spark',
          color: CYBER_SPARKS[(Math.random() * CYBER_SPARKS.length) | 0],
          size: 2.5 + Math.random() * 2,
          grav: 700,
        })
      }
    } else if (b.w / b.h >= 2.8 || b.h / b.w >= 2.8) {
      // 2) Structural Shear: elongated girders, navbars, and headers
      const beamShards = generateStructuralBeamShards(b, hitX, hitY, force, impulseX, impulseY)
      this.shards.push(...beamShards)
      this.blocksBroken++

      // Masonry / structural concrete dust clouds at shear points
      const dustPuffs = Math.min(5, Math.max(2, Math.round(b.w / 120)))
      for (let i = 0; i < dustPuffs; i++) {
        const px = b.x + (b.w / (dustPuffs + 1)) * (i + 1)
        this.puffAt(px, b.y + b.h / 2, 18)
      }
      for (let i = 0; i < 8; i++) {
        this.spawnParticle({
          x: b.x + Math.random() * b.w,
          y: b.y + Math.random() * b.h,
          vx: (Math.random() - 0.5) * 220,
          vy: -60 - Math.random() * 180,
          life: 0.6 + Math.random() * 0.5,
          max: 1.1,
          kind: 'debris',
          color: '#94a3b8',
          size: 3 + Math.random() * 3,
          grav: 1100,
        })
      }
    } else if (b.w <= 160 && b.h <= 52) {
      // 3) Compact Solid Pellets: buttons, badges, chips
      const pillShards = generateCompactPillShards(b, hitX, hitY, force, impulseX, impulseY)
      this.shards.push(...pillShards)
      this.blocksBroken++

      for (let i = 0; i < 6; i++) {
        this.spawnParticle({
          x: b.x + Math.random() * b.w,
          y: b.y + Math.random() * b.h,
          vx: (Math.random() - 0.5) * 260 + impulseX * 0.25,
          vy: -90 - Math.random() * 190 + impulseY * 0.25,
          life: 0.4 + Math.random() * 0.4,
          max: 0.8,
          kind: 'spark',
          color: FIRE_COLORS[(Math.random() * FIRE_COLORS.length) | 0],
          size: 2.5 + Math.random() * 1.5,
          grav: 900,
        })
      }
    } else {
      // 4) Dual-Scale Masonry Slabs: epicentral micro-gravel + heavy structural blocks
      const masonryShards = generateMasonrySlabs(b, hitX, hitY, force, impulseX, impulseY)
      this.shards.push(...masonryShards)
      this.blocksBroken++

      // Epicenter blast puff and stone rubble debris
      this.puffAt(hitX, hitY, Math.max(16, Math.min(45, b.w / 2.5)))
      for (let i = 0; i < 10; i++) {
        this.spawnParticle({
          x: hitX + (Math.random() - 0.5) * 30,
          y: hitY + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 300 + impulseX * 0.35,
          vy: -120 - Math.random() * 240 + impulseY * 0.35,
          life: 0.5 + Math.random() * 0.5,
          max: 1.0,
          kind: 'debris',
          color: '#64748b',
          size: 2.5 + Math.random() * 3,
          grav: 1200,
        })
      }
    }

    const el = this.elements.get(b.id)
    if (el) {
      el.alive = false
      this.onElementGone?.(el)
    }

    // Limit active shards
    if (this.shards.length > 400) {
      this.shards.splice(0, this.shards.length - 400)
    }
  }

  popElement(target: LevelElement | SolidBody, fromX: number, fromY: number, impulse = 300) {
    const id = target.id
    const b = this.bodies[id] || (target as SolidBody)
    if (b && !b.destroyed) {
      if (b.anchored) {
        this.dislodgeBody(b, b.x - fromX, b.y - fromY)
      } else {
        this.shatterBody(b, fromX, fromY, impulse, b.x - fromX, b.y - fromY)
      }
    }
  }

  // Blast circle damage (for rockets, grenades, nukes, and shotgun)
  damageCircle(
    wx: number,
    wy: number,
    r: number,
    opts: { debris?: boolean; scorch?: boolean; impulse?: number; countAsDestroy?: boolean; full?: boolean } = {}
  ) {
    const imp = opts.impulse ?? 360
    const hitBodies = this.getBodiesInAABB(wx - r, wy - r, wx + r, wy + r)

    for (let i = 0; i < hitBodies.length; i++) {
      const b = hitBodies[i]
      if (b.destroyed) continue

      // Clamped closest distance to body rectangle:
      const closeX = Math.max(b.x, Math.min(b.x + b.w, wx))
      const closeY = Math.max(b.y, Math.min(b.y + b.h, wy))
      const d = Math.hypot(closeX - wx, closeY - wy)
      if (d > r) continue

      let dx = (b.x + b.w / 2) - wx
      let dy = (b.y + b.h / 2) - wy
      const dirLen = Math.hypot(dx, dy) || 1
      dx /= dirLen
      dy /= dirLen

      const falloff = Math.max(0.2, 1 - d / (r * 1.25))
      const dmg = (opts.full ? 220 : 45 + r * 1.2) * falloff
      b.hp -= dmg

      // Add scorch decal
      if (opts.scorch) {
        b.damageDecals.push({
          rx: Math.max(2, Math.min(b.w - 2, closeX - b.x)),
          ry: Math.max(2, Math.min(b.h - 2, closeY - b.y)),
          r: Math.min(16, 4 + r * 0.15),
        })
      }

      if (b.hp <= 0) {
        this.shatterBody(b, wx, wy, imp * falloff, dx * imp * falloff, dy * imp * falloff)
      } else {
        const blastImpulse = imp * falloff
        const isLarge = b.mass > 1200
        const hpDislodgeThresh = isLarge ? b.maxHp * 0.45 : b.maxHp * 0.75
        const impulseDislodgeThresh = Math.max(90, Math.min(650, Math.sqrt(b.mass) * 14))

        if (b.anchored && (b.hp <= hpDislodgeThresh || blastImpulse >= impulseDislodgeThresh)) {
          this.dislodgeBody(b, dx * blastImpulse, dy * blastImpulse - 120)
        } else if (!b.anchored) {
          this.wakeBody(b)
          const pushFactor = Math.min(12, 180 / b.mass)
          b.vx += dx * blastImpulse * pushFactor
          b.vy += (dy * blastImpulse - 120) * pushFactor
          b.vrot += (Math.random() - 0.5) * 4
        }
      }
    }

    if (opts.debris !== false && this.particles.length < 18000) {
      for (let i = 0; i < Math.min(16, Math.floor(r * 0.4)); i++) {
        this.spawnParticle({
          x: wx + (Math.random() - 0.5) * r * 0.7,
          y: wy + (Math.random() - 0.5) * r * 0.7,
          vx: (Math.random() - 0.5) * 320,
          vy: -120 - Math.random() * 260,
          life: 0.5 + Math.random() * 0.6,
          max: 1.1,
          kind: 'debris',
          color: FIRE_COLORS[(Math.random() * FIRE_COLORS.length) | 0],
          size: 2.5 + Math.random() * 3,
          grav: 1500,
        })
      }
    }
  }

  // Knock elements near blast outward
  blastImpulse(wx: number, wy: number, r: number, power: number) {
    const hitBodies = this.getBodiesInAABB(wx - r, wy - r, wx + r, wy + r)

    for (let i = 0; i < hitBodies.length; i++) {
      const b = hitBodies[i]
      if (b.destroyed) continue

      const closeX = Math.max(b.x, Math.min(b.x + b.w, wx))
      const closeY = Math.max(b.y, Math.min(b.y + b.h, wy))
      const d = Math.hypot(closeX - wx, closeY - wy)
      if (d > r) continue

      let dx = (b.x + b.w / 2) - wx
      let dy = (b.y + b.h / 2) - wy
      const dirLen = Math.hypot(dx, dy) || 1
      dx /= dirLen
      dy /= dirLen

      const falloff = Math.max(0.15, 1 - d / r)
      const applied = power * falloff

      b.hp -= applied * 0.4
      if (b.hp <= 0) {
        this.shatterBody(b, wx, wy, applied, dx * applied, dy * applied)
      } else if (b.anchored) {
        this.dislodgeBody(b, dx * applied, dy * applied - 100)
      } else {
        this.wakeBody(b)
        const pushFactor = Math.min(12, 180 / b.mass)
        b.vx += dx * applied * pushFactor
        b.vy += dy * applied * pushFactor - 60
        b.vrot += (Math.random() - 0.5) * 6
      }
    }
  }

  igniteCell(i: number, strength = 220) {
    if (!this.mat || !this.heat || this.mat[i] !== MAT_SOLID || this.heat[i] > 0) return
    if (this.burns.length > 9000) return
    this.heat[i] = Math.min(255, strength)
    this.burns.push({ idx: i, t: 0, dur: 1.1 + Math.random() * 1.3 })
    this.dirty = true
  }

  igniteWorld(wx: number, wy: number, r: number) {
    const candidates = this.getBodiesInAABB(wx - r, wy - r, wx + r, wy + r)
    for (let i = 0; i < candidates.length; i++) {
      const b = candidates[i]
      if (b.destroyed) continue
      const closeX = Math.max(b.x, Math.min(b.x + b.w, wx))
      const closeY = Math.max(b.y, Math.min(b.y + b.h, wy))
      if (Math.hypot(closeX - wx, closeY - wy) <= r) {
        b.burning = 3.8
      }
    }
  }

  puffAt(wx: number, wy: number, r: number) {
    for (let k = 0; k < 6; k++) {
      this.spawnParticle({
        x: wx + (Math.random() - 0.5) * r,
        y: wy + (Math.random() - 0.5) * r,
        vx: (Math.random() - 0.5) * 80,
        vy: -40 - Math.random() * 80,
        life: 0.8,
        max: 0.8,
        kind: 'smoke',
        color: SMOKE_COLORS[(Math.random() * SMOKE_COLORS.length) | 0],
        size: 3 + Math.random() * 4,
      })
    }
  }

  spawnParticle(p: Particle) {
    if (this.particles.length > 24000) return
    p.max = p.max || p.life
    this.particles.push(p)
  }

  raycast(x: number, y: number, dx: number, dy: number, maxDist: number): { x: number; y: number; hit: boolean } {
    const step = 4
    let cx = x
    let cy = y
    for (let d = 0; d < maxDist; d += step) {
      cx += dx * step
      cy += dy * step
      if (cx < 0 || cx >= this.W || cy >= this.H) return { x: cx, y: cy, hit: true }
      if (cy < 0) continue
      if (this.solidAtWorld(cx, cy)) {
        return { x: cx, y: cy, hit: true }
      }
    }
    return { x: cx, y: cy, hit: false }
  }

  step(dt: number) {
    // 1) Process burning for anchored bodies and fire spread
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i]
      if (b.destroyed || b.burning <= 0) continue
      b.burning -= dt
      b.hp -= 28 * dt

      if (Math.random() < 0.25) {
        this.spawnParticle({
          x: b.x + Math.random() * b.w,
          y: b.y + Math.random() * b.h,
          vx: (Math.random() - 0.5) * 40,
          vy: -40 - Math.random() * 50,
          life: 0.45,
          max: 0.45,
          kind: 'ember',
          color: FIRE_COLORS[(Math.random() * FIRE_COLORS.length) | 0],
          size: 2,
          grav: -80,
        })
      }

      // Fire spread to adjacent bodies in spatial buckets
      if (Math.random() < 0.05) {
        const neighbors = this.getBodiesInAABB(b.x - 8, b.y - 8, b.x + b.w + 8, b.y + b.h + 8)
        for (let n = 0; n < neighbors.length; n++) {
          const nb = neighbors[n]
          if (!nb.destroyed && nb.burning <= 0 && nb.id !== b.id) {
            nb.burning = 3.2
          }
        }
      }

      if (b.hp <= 0) {
        this.shatterBody(b, b.x + b.w / 2, b.y + b.h / 2, 180)
      }
    }

    // 2) Dynamic Bodies Physics (Falling, tumbling, bouncing on settled bodies & floor)
    const floorY = this.H - 24
    for (let i = this.dynamicBodies.length - 1; i >= 0; i--) {
      const b = this.dynamicBodies[i]
      if (b.destroyed) {
        const last = this.dynamicBodies.pop()!
        if (i < this.dynamicBodies.length) {
          this.dynamicBodies[i] = last
        }
        continue
      }

      // Burning
      if (b.burning > 0) {
        b.burning -= dt
        b.hp -= 28 * dt
        if (Math.random() < 0.25) {
          this.spawnParticle({
            x: b.x + Math.random() * b.w,
            y: b.y + Math.random() * b.h,
            vx: (Math.random() - 0.5) * 50,
            vy: -60 - Math.random() * 60,
            life: 0.5,
            max: 0.5,
            kind: 'ember',
            color: FIRE_COLORS[(Math.random() * FIRE_COLORS.length) | 0],
            size: 2,
            grav: -120,
          })
        }
        if (b.hp <= 0) {
          this.shatterBody(b, b.x + b.w / 2, b.y + b.h / 2, 220)
          continue
        }
      }

      if (!b.settled) {
        b.vy += 2200 * dt
        b.vx *= 1 - 0.4 * dt
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.rot += b.vrot * dt
        b.vrot *= 1 - 0.8 * dt

        // Boundaries
        if (b.x < 0) {
          b.x = 0
          b.vx = -b.vx * 0.4
          b.vrot *= 0.6
        } else if (b.x + b.w > this.W) {
          b.x = this.W - b.w
          b.vx = -b.vx * 0.4
          b.vrot *= 0.6
        }

        // Settled-body ground check with ignore list
        let landSurfaceY = floorY
        const testBottomY = b.y + b.h
        for (let sIdx = 0; sIdx < this.settledBodies.length; sIdx++) {
          const s = this.settledBodies[sIdx]
          // Ignore list: skip self, parent, or child
          if (s.id === b.id || s.parentId === b.id || s.id === b.parentId) continue
          if (b.x + b.w > s.x + 2 && b.x < s.x + s.w - 2) {
            if (testBottomY >= s.y && testBottomY <= s.y + 16 && b.y < s.y) {
              if (s.y < landSurfaceY) {
                landSurfaceY = s.y
              }
            }
          }
        }

        // Collision with floor or settled body
        if (b.y + b.h >= landSurfaceY) {
          b.y = landSurfaceY - b.h
          const impact = Math.abs(b.vy)
          if (impact > 130) {
            // High-velocity impact damage from hard drops
            if (impact > 650 && b.kind !== 'image') {
              b.hp -= (impact - 650) * 0.06 * Math.sqrt(b.mass)
              if (b.hp <= 0) {
                this.shatterBody(b, b.x + b.w / 2, b.y + b.h, impact)
                continue
              }
            }
            b.vy = -b.vy * 0.32
            b.vx *= 0.65
            b.vrot *= 0.5
          } else {
            b.vy = 0
            b.settleT += dt
            // Smooth ease-to-flat rotation instead of abrupt snapping pop
            b.rot -= Math.round(b.rot / (Math.PI * 2)) * Math.PI * 2
            b.rot += (0 - b.rot) * Math.min(1, dt * 14)
            if (b.settleT > 0.35) {
              b.settled = true
              b.vx = 0
              b.vrot = 0
              b.rot = 0
              const last = this.dynamicBodies.pop()!
              if (i < this.dynamicBodies.length) {
                this.dynamicBodies[i] = last
              }
              this.settledBodies.push(b)
            }
          }
        }
      }
    }

    // 3) Shards Physics (Fractured glyphs and polygon shards)
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i]
      s.life -= dt
      if (s.life <= 0) {
        const last = this.shards.pop()!
        if (i < this.shards.length) {
          this.shards[i] = last
        }
        continue
      }

      if (!s.settled) {
        s.vy += 2300 * dt
        s.vx *= 1 - 0.45 * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.rot += s.vrot * dt

        // Floor / settled bounce
        let shardLandY = floorY
        for (let sIdx = 0; sIdx < this.settledBodies.length; sIdx++) {
          const sb = this.settledBodies[sIdx]
          if (s.x >= sb.x && s.x <= sb.x + sb.w && s.y >= sb.y && s.y <= sb.y + 12) {
            if (sb.y < shardLandY) shardLandY = sb.y
          }
        }

        if (s.y >= shardLandY) {
          s.y = shardLandY
          if (Math.abs(s.vy) > 140) {
            s.vy = -s.vy * 0.3
            s.vx *= 0.65
            s.vrot *= 0.55
          } else {
            s.settled = true
            s.vy = 0
            s.vx *= 0.4
            s.vrot = 0
          }
        }
      }
    }

    // 4) Particles with O(1) swap-and-pop cleanup
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt
      if (p.life <= 0) {
        const last = this.particles.pop()!
        if (i < this.particles.length) {
          this.particles[i] = last
        }
        continue
      }
      if (p.grav) p.vy += p.grav * dt
      if (p.kind === 'smoke') {
        p.vx *= 1 - 0.6 * dt
        p.vy *= 1 - 0.6 * dt
        p.size += 14 * dt
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.rot !== undefined && p.vrot) p.rot += p.vrot * dt
    }
  }

  // --- Rendering Orchestration ---
  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number, viewW: number, viewH: number) {
    const isHd = ConfigManager.get().getConfig().visual.hdVectorMode

    // Viewport boundaries for culling
    const vLeft = camX - 80
    const vRight = camX + viewW + 80
    const vTop = camY - 80
    const vBottom = camY + viewH + 80

    // 1) Bedrock Floor (Sleek dark foundation slab at bottom)
    const floorY = this.H - 28
    if (floorY < vBottom) {
      ctx.save()
      const scrY = floorY - camY
      ctx.fillStyle = '#111319'
      ctx.fillRect(-camX, scrY, this.W, 140)
      // Glowing neon edge line
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-camX, scrY)
      ctx.lineTo(-camX + this.W, scrY)
      ctx.stroke()
      // Hazard pattern accent
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)'
      for (let hx = 0; hx < this.W; hx += 40) {
        ctx.fillRect(hx - camX, scrY + 2, 20, 6)
      }
      ctx.restore()
    }

    // 2) Anchored Solid Bodies (100% Crisp Native Vector Typography & Shapes)
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i]
      if (!b.anchored || b.destroyed) continue
      // Viewport culling
      if (b.x + b.w < vLeft || b.x > vRight || b.y + b.h < vTop || b.y > vBottom) continue

      const scrX = b.x - camX
      const scrY = b.y - camY

      if (b.kind === 'word') {
        ctx.save()
        ctx.font = b.font || '16px sans-serif'
        ctx.fillStyle = b.color || '#ffffff'
        ctx.textBaseline = 'top'
        ctx.fillText(b.text || '', scrX, scrY)
        if (b.underline) {
          ctx.fillRect(scrX, scrY + b.h - 1, b.w, 1.5)
        }
        // Draw bullet hole / damage decals
        if (b.damageDecals.length > 0) {
          ctx.fillStyle = 'rgba(25, 25, 25, 0.8)'
          for (const d of b.damageDecals) {
            ctx.beginPath()
            ctx.arc(scrX + d.rx, scrY + d.ry, d.r, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        ctx.restore()
      } else if (b.kind === 'box') {
        drawVectorBox(ctx, scrX, scrY, b.w, b.h, b.radius, b.bg, b.grad, b.border, b.shadow)
        // Decals
        if (b.damageDecals.length > 0) {
          ctx.fillStyle = 'rgba(20, 20, 20, 0.75)'
          for (const d of b.damageDecals) {
            ctx.beginPath()
            ctx.arc(scrX + d.rx, scrY + d.ry, d.r, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      } else if (b.kind === 'image') {
        if (b.image && b.image.complete && b.image.naturalWidth > 0) {
          ctx.save()
          if (b.radius) {
            applyRadiusPath(ctx, scrX, scrY, b.w, b.h, b.radius)
            ctx.clip()
          }
          ctx.drawImage(b.image, scrX, scrY, b.w, b.h)
          // Scorch / Decals
          if (b.damageDecals.length > 0) {
            ctx.fillStyle = 'rgba(20, 20, 20, 0.82)'
            for (const d of b.damageDecals) {
              ctx.beginPath()
              ctx.arc(scrX + d.rx, scrY + d.ry, d.r, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          ctx.restore()
        }
      }
    }

    // 3) Settled Bodies (Fallen words and cards at rest on the ground)
    for (let i = 0; i < this.settledBodies.length; i++) {
      const b = this.settledBodies[i]
      if (b.destroyed) continue
      if (b.x + b.w < vLeft || b.x > vRight || b.y + b.h < vTop || b.y > vBottom) continue

      const scrX = b.x - camX
      const scrY = b.y - camY
      if (b.kind === 'word') {
        ctx.save()
        ctx.font = b.font || '16px sans-serif'
        ctx.fillStyle = b.color || '#ffffff'
        ctx.textBaseline = 'top'
        ctx.fillText(b.text || '', scrX, scrY)
        ctx.restore()
      } else if (b.kind === 'box') {
        drawVectorBox(ctx, scrX, scrY, b.w, b.h, b.radius, b.bg, b.grad, b.border, null)
      } else if (b.kind === 'image' && b.image) {
        ctx.drawImage(b.image, scrX, scrY, b.w, b.h)
      }
    }

    // 4) Dynamic Dislodged Bodies (Tumbling through air under gravity)
    for (let i = 0; i < this.dynamicBodies.length; i++) {
      const b = this.dynamicBodies[i]
      if (b.destroyed) continue
      const cx = b.x + b.w / 2 - camX
      const cy = b.y + b.h / 2 - camY
      if (cx < -100 || cx > viewW + 100 || cy < -100 || cy > viewH + 100) continue

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(b.rot)

      if (b.kind === 'word') {
        ctx.font = b.font || '16px sans-serif'
        ctx.fillStyle = b.color || '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
        ctx.shadowBlur = 6
        ctx.fillText(b.text || '', 0, 0)
      } else if (b.kind === 'box') {
        drawVectorBox(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.radius, b.bg, b.grad, b.border, null)
      } else if (b.kind === 'image' && b.image) {
        ctx.drawImage(b.image, -b.w / 2, -b.h / 2, b.w, b.h)
      }
      ctx.restore()
    }

    // 5) Fractured Shards (Polygonal glass/rock shards & flying letter glyphs)
    for (let i = 0; i < this.shards.length; i++) {
      const s = this.shards[i]
      const sx = s.x - camX
      const sy = s.y - camY
      if (sx < -60 || sx > viewW + 60 || sy < -60 || sy > viewH + 60) continue

      const alpha = s.life < 0.8 ? Math.max(0, s.life / 0.8) : 1
      ctx.save()
      ctx.translate(sx, sy)
      ctx.rotate(s.rot)
      ctx.globalAlpha = alpha

      if (s.kind === 'glyph' && s.text) {
        ctx.font = s.font || '16px sans-serif'
        ctx.fillStyle = s.color || '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
        ctx.shadowBlur = 4
        ctx.fillText(s.text, 0, 0)
      } else if (s.kind === 'polygon' && s.poly && s.poly.length >= 3) {
        // 3D Extrusion bevel underneath for tangible slabs, beams, and pellets
        if (s.material !== 'glyph' && s.material !== 'screen') {
          ctx.save()
          ctx.translate(1.5, 2.2)
          ctx.beginPath()
          ctx.moveTo(s.poly[0].x, s.poly[0].y)
          for (let pIdx = 1; pIdx < s.poly.length; pIdx++) {
            ctx.lineTo(s.poly[pIdx].x, s.poly[pIdx].y)
          }
          ctx.closePath()
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
          ctx.fill()
          ctx.restore()
        }

        ctx.beginPath()
        ctx.moveTo(s.poly[0].x, s.poly[0].y)
        for (let pIdx = 1; pIdx < s.poly.length; pIdx++) {
          ctx.lineTo(s.poly[pIdx].x, s.poly[pIdx].y)
        }
        ctx.closePath()

        if (s.image && s.image.complete && s.image.naturalWidth > 0) {
          ctx.save()
          ctx.clip()
          ctx.drawImage(s.image, -(s.uvX ?? 0), -(s.uvY ?? 0), s.uvW ?? 100, s.uvH ?? 100)
          ctx.restore()

          // Screen / LCD dark border grid line
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)'
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          ctx.fillStyle = s.colorStr || '#718096'
          ctx.fill()

          if (s.material === 'masonry' || s.material === 'beam') {
            // Subtle tectonic edge giving masonry solid physical weight
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)'
            ctx.lineWidth = 1
            ctx.stroke()
          } else if (s.material === 'pellet') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.lineWidth = 1
            ctx.stroke()
          } else {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)'
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }
      ctx.restore()
    }

    ctx.globalAlpha = 1
  }

  drawParticles(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    for (const p of this.particles) {
      const t = p.life / p.max
      const px = p.x - camX
      const py = p.y - camY
      if (px < -30 || py < -30 || px > 4000 || py > 4000) continue
      switch (p.kind) {
        case 'smoke': {
          ctx.globalAlpha = Math.min(0.55, t * 0.8)
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(px, py, p.size, 0, Math.PI * 2)
          ctx.fill()
          break
        }
        case 'ember':
        case 'spark': {
          ctx.globalAlpha = t
          ctx.fillStyle = p.color
          const s2 = p.size
          ctx.fillRect(px - s2 / 2, py - s2 / 2, s2, s2)
          break
        }
        case 'debris':
        case 'paper':
        case 'shell': {
          ctx.globalAlpha = Math.min(1, t * 2)
          ctx.fillStyle = p.color
          ctx.save()
          ctx.translate(px, py)
          ctx.rotate(p.rot ?? 0)
          ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size)
          ctx.restore()
          break
        }
        case 'star': {
          ctx.globalAlpha = t
          ctx.fillStyle = p.color
          const s3 = p.size * t
          ctx.fillRect(px - s3, py - s3 / 6, s3 * 2, s3 / 3)
          ctx.fillRect(px - s3 / 6, py - s3, s3 / 3, s3 * 2)
          break
        }
        case 'glow': {
          ctx.globalAlpha = t * 0.5
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(px, py, p.size * (2 - t), 0, Math.PI * 2)
          ctx.fill()
          break
        }
      }
    }
    ctx.globalAlpha = 1
  }
}

// --- Vector Helpers ---
function applyRadiusPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: [number, number, number, number]
) {
  const maxr = Math.min(w, h) / 2
  const rtl = Math.min(rad[0], maxr)
  const rtr = Math.min(rad[1], maxr)
  const rbr = Math.min(rad[2], maxr)
  const rbl = Math.min(rad[3], maxr)

  ctx.beginPath()
  ctx.moveTo(x + rtl, y)
  ctx.lineTo(x + w - rtr, y)
  if (rtr > 0) ctx.quadraticCurveTo(x + w, y, x + w, y + rtr)
  ctx.lineTo(x + w, y + h - rbr)
  if (rbr > 0) ctx.quadraticCurveTo(x + w, y + h, x + w - rbr, y + h)
  ctx.lineTo(x + rbl, y + h)
  if (rbl > 0) ctx.quadraticCurveTo(x, y + h, x, y + h - rbl)
  ctx.lineTo(x, y + rtl)
  if (rtl > 0) ctx.quadraticCurveTo(x, y, x + rtl, y)
  ctx.closePath()
}

function drawVectorBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius?: [number, number, number, number] | null,
  bg?: string | null,
  grad?: { type: 'linear'; angle: number; stops: { c: string; p: number }[] } | null,
  border?: { w: number; c: string } | null,
  shadow?: { color: string; x: number; y: number; blur: number } | null
) {
  ctx.save()
  if (shadow && shadow.blur > 0) {
    ctx.shadowColor = shadow.color
    ctx.shadowBlur = shadow.blur
    ctx.shadowOffsetX = shadow.x
    ctx.shadowOffsetY = shadow.y
  }

  const rad = radius || [0, 0, 0, 0]
  applyRadiusPath(ctx, x, y, w, h, rad)

  if (grad && grad.stops && grad.stops.length >= 2) {
    const radAngle = ((grad.angle - 90) * Math.PI) / 180
    const cx = x + w / 2
    const cy = y + h / 2
    const diag = Math.hypot(w, h) / 2
    const x0 = cx - Math.cos(radAngle) * diag
    const y0 = cy - Math.sin(radAngle) * diag
    const x1 = cx + Math.cos(radAngle) * diag
    const y1 = cy + Math.sin(radAngle) * diag
    const lg = ctx.createLinearGradient(x0, y0, x1, y1)
    for (const stop of grad.stops) {
      lg.addColorStop(Math.max(0, Math.min(1, stop.p)), stop.c)
    }
    ctx.fillStyle = lg
    ctx.fill()
  } else if (bg) {
    ctx.fillStyle = bg
    ctx.fill()
  }

  if (border && border.w > 0 && border.c) {
    ctx.strokeStyle = border.c
    ctx.lineWidth = border.w
    ctx.stroke()
  }
  ctx.restore()
}

// 1) Digital Screen / Media Display fracture: cracked LCD matrix quads with jittered fault lines
function generateDigitalScreenShards(
  body: SolidBody,
  hitX: number,
  hitY: number,
  force: number,
  impulseX = 0,
  impulseY = 0
): ShardPiece[] {
  const shards: ShardPiece[] = []
  const w = body.w
  const h = body.h
  const localHitX = Math.max(0, Math.min(w, hitX - body.x))
  const localHitY = Math.max(0, Math.min(h, hitY - body.y))

  const cols = w >= 240 ? 4 : w >= 110 ? 3 : 2
  const rows = h >= 180 ? 3 : 2

  const xSplits: number[] = [0]
  for (let c = 1; c < cols; c++) {
    const base = (w / cols) * c
    const jitter = (Math.random() - 0.5) * (w / cols) * 0.28
    xSplits.push(Math.max(xSplits[c - 1] + 12, Math.min(w - 12, base + jitter)))
  }
  xSplits.push(w)

  const ySplits: number[] = [0]
  for (let r = 1; r < rows; r++) {
    const base = (h / rows) * r
    const jitter = (Math.random() - 0.5) * (h / rows) * 0.28
    ySplits.push(Math.max(ySplits[r - 1] + 10, Math.min(h - 10, base + jitter)))
  }
  ySplits.push(h)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = xSplits[c]
      const x1 = xSplits[c + 1]
      const y0 = ySplits[r]
      const y1 = ySplits[r + 1]

      const cx = (x0 + x1) / 2
      const cy = (y0 + y1) / 2

      const poly = [
        { x: x0 - cx, y: y0 - cy },
        { x: x1 - cx, y: y0 - cy },
        { x: x1 - cx, y: y1 - cy },
        { x: x0 - cx, y: y1 - cy },
      ]

      const wx = body.x + cx
      const wy = body.y + cy
      let dx = cx - localHitX
      let dy = cy - localHitY
      const dist = Math.hypot(dx, dy) || 1
      dx /= dist
      dy /= dist

      const blastSpeed = force * (0.55 + Math.random() * 0.55)
      const pushX = dx * blastSpeed + impulseX * 0.35 + (Math.random() - 0.5) * 80
      const pushY = dy * blastSpeed + impulseY * 0.35 - 90 - Math.random() * 140

      shards.push({
        x: wx,
        y: wy,
        vx: body.vx * 0.35 + pushX,
        vy: body.vy * 0.35 + pushY,
        rot: 0,
        vrot: (Math.random() - 0.5) * (9 + force / 75),
        life: 3.2 + Math.random() * 1.8,
        maxLife: 5.0,
        kind: 'polygon',
        material: 'screen',
        poly,
        colorStr: body.bg || '#1e293b',
        border: body.border,
        image: body.image,
        uvX: cx,
        uvY: cy,
        uvW: w,
        uvH: h,
        settled: false,
      })
    }
  }

  return shards
}

// 2) Structural Shear: elongated girders, navbars, and headers
function generateStructuralBeamShards(
  body: SolidBody,
  hitX: number,
  hitY: number,
  force: number,
  impulseX = 0,
  impulseY = 0
): ShardPiece[] {
  const shards: ShardPiece[] = []
  const w = body.w
  const h = body.h
  const isHorizontal = w >= h

  if (isHorizontal) {
    const segCount = Math.min(8, Math.max(3, Math.round(w / 75)))
    const cuts: { topX: number; botX: number }[] = [{ topX: 0, botX: 0 }]

    for (let i = 1; i < segCount; i++) {
      const baseX = (w / segCount) * i
      const shearAngleOffset = (h * 0.38 + Math.random() * h * 0.3) * (i % 2 === 0 ? 1 : -1)
      const topX = Math.max(cuts[i - 1].topX + 8, Math.min(w - 8, baseX - shearAngleOffset / 2))
      const botX = Math.max(cuts[i - 1].botX + 8, Math.min(w - 8, baseX + shearAngleOffset / 2))
      cuts.push({ topX, botX })
    }
    cuts.push({ topX: w, botX: w })

    for (let i = 0; i < segCount; i++) {
      const p0 = { x: cuts[i].topX, y: 0 }
      const p1 = { x: cuts[i + 1].topX, y: 0 }
      const p2 = { x: cuts[i + 1].botX, y: h }
      const p3 = { x: cuts[i].botX, y: h }

      const cx = (p0.x + p1.x + p2.x + p3.x) / 4
      const cy = (p0.y + p1.y + p2.y + p3.y) / 4

      const poly = [
        { x: p0.x - cx, y: p0.y - cy },
        { x: p1.x - cx, y: p1.y - cy },
        { x: p2.x - cx, y: p2.y - cy },
        { x: p3.x - cx, y: p3.y - cy },
      ]

      const wx = body.x + cx
      const wy = body.y + cy
      const distFromHit = Math.abs(wx - hitX)
      const proximity = Math.max(0.25, 1 - distFromHit / (w * 0.75))
      const blastSpeed = force * (0.4 + proximity * 0.6)
      const pushX = Math.sign(wx - hitX || 1) * blastSpeed * 0.65 + impulseX * 0.25 + (Math.random() - 0.5) * 60
      const pushY = -60 * proximity - Math.random() * 120 + impulseY * 0.25

      shards.push({
        x: wx,
        y: wy,
        vx: body.vx * 0.3 + pushX,
        vy: body.vy * 0.3 + pushY,
        rot: 0,
        vrot: (Math.random() - 0.5) * (5 + 8 * proximity),
        life: 3.5 + Math.random() * 1.5,
        maxLife: 5.0,
        kind: 'polygon',
        material: 'beam',
        poly,
        colorStr: body.bg || '#94a3b8',
        border: body.border,
        image: body.image,
        uvX: cx,
        uvY: cy,
        uvW: w,
        uvH: h,
        settled: false,
      })
    }
  } else {
    const segCount = Math.min(8, Math.max(3, Math.round(h / 75)))
    const cuts: { leftY: number; rightY: number }[] = [{ leftY: 0, rightY: 0 }]

    for (let i = 1; i < segCount; i++) {
      const baseY = (h / segCount) * i
      const shearOffset = (w * 0.38 + Math.random() * w * 0.3) * (i % 2 === 0 ? 1 : -1)
      const leftY = Math.max(cuts[i - 1].leftY + 8, Math.min(h - 8, baseY - shearOffset / 2))
      const rightY = Math.max(cuts[i - 1].rightY + 8, Math.min(h - 8, baseY + shearOffset / 2))
      cuts.push({ leftY, rightY })
    }
    cuts.push({ leftY: h, rightY: h })

    for (let i = 0; i < segCount; i++) {
      const p0 = { x: 0, y: cuts[i].leftY }
      const p1 = { x: w, y: cuts[i].rightY }
      const p2 = { x: w, y: cuts[i + 1].rightY }
      const p3 = { x: 0, y: cuts[i + 1].leftY }

      const cx = (p0.x + p1.x + p2.x + p3.x) / 4
      const cy = (p0.y + p1.y + p2.y + p3.y) / 4

      const poly = [
        { x: p0.x - cx, y: p0.y - cy },
        { x: p1.x - cx, y: p1.y - cy },
        { x: p2.x - cx, y: p2.y - cy },
        { x: p3.x - cx, y: p3.y - cy },
      ]

      const wx = body.x + cx
      const wy = body.y + cy
      const distFromHit = Math.abs(wy - hitY)
      const proximity = Math.max(0.25, 1 - distFromHit / (h * 0.75))
      const blastSpeed = force * (0.4 + proximity * 0.6)
      const pushX = (Math.random() - 0.5) * 100 + impulseX * 0.25
      const pushY = Math.sign(wy - hitY || 1) * blastSpeed * 0.5 - 60 * proximity + impulseY * 0.25

      shards.push({
        x: wx,
        y: wy,
        vx: body.vx * 0.3 + pushX,
        vy: body.vy * 0.3 + pushY,
        rot: 0,
        vrot: (Math.random() - 0.5) * (5 + 8 * proximity),
        life: 3.5 + Math.random() * 1.5,
        maxLife: 5.0,
        kind: 'polygon',
        material: 'beam',
        poly,
        colorStr: body.bg || '#94a3b8',
        border: body.border,
        image: body.image,
        uvX: cx,
        uvY: cy,
        uvW: w,
        uvH: h,
        settled: false,
      })
    }
  }

  return shards
}

// 3) Compact Solid Pellets: buttons, badges, chips
function generateCompactPillShards(
  body: SolidBody,
  hitX: number,
  hitY: number,
  force: number,
  impulseX = 0,
  impulseY = 0
): ShardPiece[] {
  const shards: ShardPiece[] = []
  const w = body.w
  const h = body.h

  const splitX = w * (0.42 + Math.random() * 0.16)
  const splitY = h * (0.42 + Math.random() * 0.16)

  const quads = [
    [
      { x: 0, y: 0 },
      { x: splitX, y: 0 },
      { x: splitX + (Math.random() - 0.5) * 6, y: splitY },
      { x: 0, y: splitY },
    ],
    [
      { x: splitX, y: 0 },
      { x: w, y: 0 },
      { x: w, y: splitY },
      { x: splitX + (Math.random() - 0.5) * 6, y: splitY },
    ],
    [
      { x: 0, y: splitY },
      { x: splitX + (Math.random() - 0.5) * 6, y: splitY },
      { x: splitX, y: h },
      { x: 0, y: h },
    ],
    [
      { x: splitX + (Math.random() - 0.5) * 6, y: splitY },
      { x: w, y: splitY },
      { x: w, y: h },
      { x: splitX, y: h },
    ],
  ]

  for (const q of quads) {
    const cx = (q[0].x + q[1].x + q[2].x + q[3].x) / 4
    const cy = (q[0].y + q[1].y + q[2].y + q[3].y) / 4

    const poly = q.map((pt) => ({ x: pt.x - cx, y: pt.y - cy }))
    const wx = body.x + cx
    const wy = body.y + cy

    let dx = wx - hitX
    let dy = wy - hitY
    const d = Math.hypot(dx, dy) || 1
    dx /= d
    dy /= d

    const blastSpeed = force * (0.65 + Math.random() * 0.5)
    shards.push({
      x: wx,
      y: wy,
      vx: body.vx * 0.35 + dx * blastSpeed + impulseX * 0.3 + (Math.random() - 0.5) * 90,
      vy: body.vy * 0.35 + dy * blastSpeed + impulseY * 0.3 - 100 - Math.random() * 150,
      rot: 0,
      vrot: (Math.random() - 0.5) * (12 + force / 50),
      life: 3.2 + Math.random() * 1.5,
      maxLife: 4.8,
      kind: 'polygon',
      material: 'pellet',
      poly,
      colorStr: body.bg || '#3b82f6',
      border: body.border,
      image: body.image,
      uvX: cx,
      uvY: cy,
      uvW: w,
      uvH: h,
      settled: false,
    })
  }

  return shards
}

// 4) Dual-Scale Masonry Slabs: epicentral micro-gravel + heavy structural blocks
function generateMasonrySlabs(
  body: SolidBody,
  hitX: number,
  hitY: number,
  force: number,
  impulseX = 0,
  impulseY = 0
): ShardPiece[] {
  const shards: ShardPiece[] = []
  const w = body.w
  const h = body.h
  const localX = Math.max(w * 0.15, Math.min(w * 0.85, hitX - body.x))
  const localY = Math.max(h * 0.15, Math.min(h * 0.85, hitY - body.y))

  // --- Scale 1: Epicenter Micro-Gravel (4-6 high-speed small debris chunks) ---
  const gravelCount = 5
  for (let g = 0; g < gravelCount; g++) {
    const angle = (Math.PI * 2 * g) / gravelCount + (Math.random() - 0.5) * 0.6
    const dist = 6 + Math.random() * 16
    const gx = localX + Math.cos(angle) * dist
    const gy = localY + Math.sin(angle) * dist

    const gSize = 4 + Math.random() * 6
    const poly = [
      { x: -gSize + (Math.random() - 0.5) * 2, y: -gSize },
      { x: gSize, y: -gSize + (Math.random() - 0.5) * 2 },
      { x: gSize + (Math.random() - 0.5) * 2, y: gSize },
      { x: -gSize, y: gSize + (Math.random() - 0.5) * 2 },
    ]

    const blastSpeed = force * (0.8 + Math.random() * 0.7)
    shards.push({
      x: body.x + gx,
      y: body.y + gy,
      vx: body.vx * 0.3 + Math.cos(angle) * blastSpeed + impulseX * 0.4 + (Math.random() - 0.5) * 120,
      vy: body.vy * 0.3 + Math.sin(angle) * blastSpeed + impulseY * 0.4 - 110 - Math.random() * 160,
      rot: 0,
      vrot: (Math.random() - 0.5) * (16 + force / 40),
      life: 2.2 + Math.random() * 1.4,
      maxLife: 3.6,
      kind: 'polygon',
      material: 'pellet',
      poly,
      colorStr: body.bg || '#718096',
      border: null,
      uvX: gx,
      uvY: gy,
      uvW: w,
      uvH: h,
      settled: false,
    })
  }

  // --- Scale 2: Heavy Structural Slabs (4-6 large polygonal slabs) ---
  const perimeterPts: { x: number; y: number }[] = [
    { x: 0, y: 0 },
    { x: w * (0.4 + Math.random() * 0.2), y: 0 },
    { x: w, y: 0 },
    { x: w, y: h * (0.4 + Math.random() * 0.2) },
    { x: w, y: h },
    { x: w * (0.4 + Math.random() * 0.2), y: h },
    { x: 0, y: h },
    { x: 0, y: h * (0.4 + Math.random() * 0.2) },
  ]

  const innerRingRadius = Math.max(14, Math.min(36, Math.min(w, h) * 0.22))
  const numSlabs = perimeterPts.length

  for (let i = 0; i < numSlabs; i++) {
    const p1 = perimeterPts[i]
    const p2 = perimeterPts[(i + 1) % numSlabs]

    const ang1 = Math.atan2(p1.y - localY, p1.x - localX)
    const ang2 = Math.atan2(p2.y - localY, p2.x - localX)

    const inP1 = {
      x: localX + Math.cos(ang1) * innerRingRadius * (0.8 + Math.random() * 0.4),
      y: localY + Math.sin(ang1) * innerRingRadius * (0.8 + Math.random() * 0.4),
    }
    const inP2 = {
      x: localX + Math.cos(ang2) * innerRingRadius * (0.8 + Math.random() * 0.4),
      y: localY + Math.sin(ang2) * innerRingRadius * (0.8 + Math.random() * 0.4),
    }

    const cx = (p1.x + p2.x + inP2.x + inP1.x) / 4
    const cy = (p1.y + p2.y + inP2.y + inP1.y) / 4

    const poly = [
      { x: p1.x - cx, y: p1.y - cy },
      { x: p2.x - cx, y: p2.y - cy },
      { x: inP2.x - cx, y: inP2.y - cy },
      { x: inP1.x - cx, y: inP1.y - cy },
    ]

    const wx = body.x + cx
    const wy = body.y + cy
    const dx = cx - localX
    const dy = cy - localY
    const d = Math.hypot(dx, dy) || 1
    const blastSpeed = force * (0.45 + Math.random() * 0.5)

    shards.push({
      x: wx,
      y: wy,
      vx: body.vx * 0.4 + (dx / d) * blastSpeed + impulseX * 0.25 + (Math.random() - 0.5) * 100,
      vy: body.vy * 0.4 + (dy / d) * blastSpeed + impulseY * 0.25 - 90 - Math.random() * 150,
      rot: 0,
      vrot: (Math.random() - 0.5) * (7 + force / 90),
      life: 3.5 + Math.random() * 1.5,
      maxLife: 5.0,
      kind: 'polygon',
      material: 'masonry',
      poly,
      colorStr: body.bg || '#7a828e',
      border: body.border,
      image: body.image,
      uvX: cx,
      uvY: cy,
      uvW: w,
      uvH: h,
      settled: false,
    })
  }

  return shards
}

// Generate letter/syllable fragments from fractured words
function generateWordShards(
  body: SolidBody,
  hitX: number,
  hitY: number,
  force: number,
  impulseX = 0,
  impulseY = 0
): ShardPiece[] {
  const shards: ShardPiece[] = []
  const txt = body.text || ''
  if (!txt) return shards

  const clusters: { str: string; relX: number }[] = []
  if (txt.length <= 3) {
    for (let i = 0; i < txt.length; i++) {
      clusters.push({ str: txt[i], relX: (body.w / txt.length) * (i + 0.5) })
    }
  } else {
    for (let i = 0; i < txt.length; i += 2) {
      const sub = txt.slice(i, i + 2)
      clusters.push({ str: sub, relX: (body.w / txt.length) * (i + sub.length / 2) })
    }
  }

  for (const c of clusters) {
    const wx = body.x + c.relX
    const wy = body.y + body.h / 2
    let dx = wx - hitX
    let dy = wy - hitY
    const d = Math.hypot(dx, dy) || 1
    dx /= d
    dy /= d
    const mag = force * (0.65 + Math.random() * 0.65)

    shards.push({
      x: wx,
      y: wy,
      vx: body.vx * 0.35 + dx * mag + impulseX * 0.3 + (Math.random() - 0.5) * 160,
      vy: body.vy * 0.35 + dy * mag + impulseY * 0.3 - 140 - Math.random() * 180,
      rot: 0,
      vrot: (Math.random() - 0.5) * (14 + force / 40),
      life: 3.5 + Math.random() * 1.5,
      maxLife: 5.0,
      kind: 'glyph',
      material: 'glyph',
      text: c.str,
      font: body.font,
      color: body.color,
      settled: false,
    })
  }

  return shards
}

// Color helpers
export function packColor(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (255 << 24) | (b << 16) | (g << 8) | r
}

export function unpackColor(c: number): string {
  const r = c & 255
  const g = (c >>> 8) & 255
  const b = (c >>> 16) & 255
  return `rgb(${r},${g},${b})`
}

export function darken(c: number, f: number): number {
  const r = Math.floor((c & 255) * f)
  const g = Math.floor(((c >>> 8) & 255) * f)
  const b = Math.floor(((c >>> 16) & 255) * f)
  return (255 << 24) | (b << 16) | (g << 8) | r
}
