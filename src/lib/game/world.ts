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

  // Spatial Grid for O(1) Collision:
  // cell size 4px
  GRID_CELL = 4
  gridW = 0
  gridH = 0
  spatialGrid!: Int32Array // maps cell -> bodyIndex (-1 = empty, -2 = bedrock)

  // Legacy compatibility grid arrays (still kept synchronized for raycasts/HUD):
  mat!: Uint8Array
  color!: Uint32Array
  owner!: Int32Array
  heat!: Uint8Array
  pixBuf!: Uint32Array
  imgData!: ImageData
  levelCanvas!: HTMLCanvasElement
  levelCtx!: CanvasRenderingContext2D
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
  onCellDestroyed?: (wx: number, wy: number, colorABGR: number) => void

  init(W: number, H: number) {
    this.W = W
    this.H = H
    this.GW = Math.ceil(W / CELL)
    this.GH = Math.ceil(H / CELL)
    this.gridW = Math.ceil(W / this.GRID_CELL)
    this.gridH = Math.ceil(H / this.GRID_CELL)

    const nGrid = this.gridW * this.gridH
    this.spatialGrid = new Int32Array(nGrid).fill(-1)

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

    // Bedrock floor: bottom 28px
    const bedrockY0 = Math.max(0, H - 28)
    const gy0 = Math.floor(bedrockY0 / this.GRID_CELL)
    for (let gy = gy0; gy < this.gridH; gy++) {
      for (let gx = 0; gx < this.gridW; gx++) {
        this.spatialGrid[gy * this.gridW + gx] = -2 // Bedrock marker
      }
    }

    const bedCy0 = Math.floor(bedrockY0 / CELL)
    for (let cy = bedCy0; cy < this.GH; cy++) {
      for (let cx = 0; cx < this.GW; cx++) {
        this.mat[cy * this.GW + cx] = MAT_BEDROCK
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

    for (let bIdx = 0; bIdx < bodies.length; bIdx++) {
      const b = bodies[bIdx]
      b.y += skyOffset
      if (b.baseY !== undefined) b.baseY += skyOffset
      b.id = bIdx
      totalM += b.mass

      // Stamp anchored body into spatialGrid for fast O(1) collision
      this.stampBodyToGrid(b, bIdx)

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
    this.color.fill(0)
    this.owner.fill(-1)
    this.mat.fill(MAT_EMPTY)
    this.elements = elements
    for (let cy = 0; cy < pageGH; cy++) {
      const dstRow = (cy + SKY_ROWS) * this.GW
      const srcRow = cy * pageGW
      for (let cx = 0; cx < pageGW; cx++) {
        const c = colors[srcRow + cx]
        const own = owners[srcRow + cx]
        if (c !== 0 && own >= 0) {
          const i = dstRow + cx
          this.mat[i] = MAT_SOLID
          this.color[i] = c
          this.pixBuf[i] = c
          this.owner[i] = own
        }
      }
    }
    const bed = packColor('#1e1e1e')
    for (let cy = this.GH - 28; cy < this.GH; cy++) {
      for (let cx = 0; cx < this.GW; cx++) {
        const i = this.idx(cx, cy)
        this.mat[i] = MAT_BEDROCK
        this.color[i] = bed
        this.pixBuf[i] = bed
      }
    }
    this.totalCells = Math.max(1, elements.size * 100)
    this.dirty = true
  }

  private stampBodyToGrid(b: SolidBody, bIdx: number) {
    const gx0 = Math.max(0, Math.floor(b.x / this.GRID_CELL))
    const gy0 = Math.max(0, Math.floor(b.y / this.GRID_CELL))
    const gx1 = Math.min(this.gridW - 1, Math.floor((b.x + b.w) / this.GRID_CELL))
    const gy1 = Math.min(this.gridH - 1, Math.floor((b.y + b.h) / this.GRID_CELL))

    for (let gy = gy0; gy <= gy1; gy++) {
      const row = gy * this.gridW
      for (let gx = gx0; gx <= gx1; gx++) {
        if (this.spatialGrid[row + gx] === -1) {
          this.spatialGrid[row + gx] = bIdx
        }
      }
    }

    // Mirror to legacy mat
    const cx0 = Math.max(0, Math.floor(b.x / CELL))
    const cy0 = Math.max(0, Math.floor(b.y / CELL))
    const cx1 = Math.min(this.GW - 1, Math.floor((b.x + b.w) / CELL))
    const cy1 = Math.min(this.GH - 1, Math.floor((b.y + b.h) / CELL))
    for (let cy = cy0; cy <= cy1; cy++) {
      const row = cy * this.GW
      for (let cx = cx0; cx <= cx1; cx++) {
        if (this.mat[row + cx] === MAT_EMPTY) {
          this.mat[row + cx] = MAT_SOLID
          this.owner[row + cx] = b.id
        }
      }
    }
  }

  private clearBodyFromGrid(b: SolidBody, bIdx: number) {
    const gx0 = Math.max(0, Math.floor(b.x / this.GRID_CELL))
    const gy0 = Math.max(0, Math.floor(b.y / this.GRID_CELL))
    const gx1 = Math.min(this.gridW - 1, Math.floor((b.x + b.w) / this.GRID_CELL))
    const gy1 = Math.min(this.gridH - 1, Math.floor((b.y + b.h) / this.GRID_CELL))

    for (let gy = gy0; gy <= gy1; gy++) {
      const row = gy * this.gridW
      for (let gx = gx0; gx <= gx1; gx++) {
        if (this.spatialGrid[row + gx] === bIdx) {
          this.spatialGrid[row + gx] = -1
        }
      }
    }

    const cx0 = Math.max(0, Math.floor(b.x / CELL))
    const cy0 = Math.max(0, Math.floor(b.y / CELL))
    const cx1 = Math.min(this.GW - 1, Math.floor((b.x + b.w) / CELL))
    const cy1 = Math.min(this.GH - 1, Math.floor((b.y + b.h) / CELL))
    for (let cy = cy0; cy <= cy1; cy++) {
      const row = cy * this.GW
      for (let cx = cx0; cx <= cx1; cx++) {
        if (this.owner[row + cx] === b.id) {
          this.mat[row + cx] = MAT_EMPTY
          this.owner[row + cx] = -1
        }
      }
    }
  }

  // --- O(1) Collision Check ---
  solidAtWorld(wx: number, wy: number): boolean {
    if (wx < 0 || wx >= this.W) return true
    if (wy < 0) return false
    if (wy >= this.H - 24) return true // Bedrock floor

    // 1) Spatial grid check (anchored solid bodies)
    const gx = Math.floor(wx / this.GRID_CELL)
    const gy = Math.floor(wy / this.GRID_CELL)
    if (gx >= 0 && gx < this.gridW && gy >= 0 && gy < this.gridH) {
      const val = this.spatialGrid[gy * this.gridW + gx]
      if (val === -2) return true // Bedrock
      if (val >= 0) {
        const b = this.bodies[val]
        if (b && b.anchored && !b.destroyed) {
          return true
        }
      }
    }

    // 2) Check settled fallen bodies (words and cards on the floor)
    for (let i = 0; i < this.settledBodies.length; i++) {
      const b = this.settledBodies[i]
      if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
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

  destroyedPct() {
    if (this.totalMass <= 0) return 0
    return Math.min(1, this.destroyedMass / this.totalMass)
  }

  // Find solid body at world coords
  findBodyAt(wx: number, wy: number): SolidBody | null {
    const gx = Math.floor(wx / this.GRID_CELL)
    const gy = Math.floor(wy / this.GRID_CELL)
    if (gx >= 0 && gx < this.gridW && gy >= 0 && gy < this.gridH) {
      const idx = this.spatialGrid[gy * this.gridW + gx]
      if (idx >= 0 && this.bodies[idx] && !this.bodies[idx].destroyed) {
        return this.bodies[idx]
      }
    }
    // Check dynamic / settled bodies
    for (const b of this.dynamicBodies) {
      if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h && !b.destroyed) return b
    }
    for (const b of this.settledBodies) {
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

    // Dislodge condition: damage high or anchor broken
    const dislodgeThresh = b.maxHp * 0.75
    if (b.anchored && (b.hp <= dislodgeThresh || Math.hypot(impulseX, impulseY) > 80)) {
      this.dislodgeBody(b, impulseX, impulseY)
    } else if (!b.anchored) {
      const pushFactor = Math.min(12, 180 / b.mass)
      b.vx += impulseX * pushFactor
      b.vy += impulseY * pushFactor
      b.vrot += (Math.random() - 0.5) * 4
    }

    if (b.hp <= 0) {
      this.shatterBody(b, wx, wy, Math.hypot(impulseX, impulseY) || 300)
    }

    return b
  }

  // Break anchor from layout: body becomes dynamic rigid body
  dislodgeBody(b: SolidBody, impulseX = 0, impulseY = 0) {
    if (!b.anchored || b.destroyed) return
    b.anchored = false
    this.clearBodyFromGrid(b, b.id)

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
  }

  // Fracture and shatter a body into vector shards
  shatterBody(b: SolidBody, hitX: number, hitY: number, force = 380) {
    if (b.destroyed) return
    b.destroyed = true
    b.hp = 0

    if (b.anchored) {
      this.clearBodyFromGrid(b, b.id)
      b.anchored = false
    }

    // Remove from dynamic/settled arrays
    const dynIdx = this.dynamicBodies.indexOf(b)
    if (dynIdx >= 0) this.dynamicBodies.splice(dynIdx, 1)
    const setIdx = this.settledBodies.indexOf(b)
    if (setIdx >= 0) this.settledBodies.splice(setIdx, 1)

    this.destroyedMass += b.mass
    this.destroyedCells += Math.round(b.mass * 2)

    // Generate physical shards
    if (b.kind === 'word') {
      const wordShards = generateWordShards(b, hitX, hitY, force)
      this.shards.push(...wordShards)
      this.lettersPopped++

      // Paper / text confetti sparks
      for (let i = 0; i < 8; i++) {
        this.spawnParticle({
          x: b.x + Math.random() * b.w,
          y: b.y + Math.random() * b.h,
          vx: (Math.random() - 0.5) * 240,
          vy: -80 - Math.random() * 200,
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
    } else {
      const polyShards = generatePolygonShards(b, hitX, hitY, force)
      this.shards.push(...polyShards)
      this.blocksBroken++

      // Sparks and smoke clouds
      this.puffAt(b.x + b.w / 2, b.y + b.h / 2, Math.max(12, Math.min(40, b.w / 2)))
      for (let i = 0; i < 10; i++) {
        this.spawnParticle({
          x: b.x + Math.random() * b.w,
          y: b.y + Math.random() * b.h,
          vx: (Math.random() - 0.5) * 280,
          vy: -100 - Math.random() * 220,
          life: 0.5 + Math.random() * 0.5,
          max: 1.0,
          kind: 'spark',
          color: FIRE_COLORS[(Math.random() * FIRE_COLORS.length) | 0],
          size: 3 + Math.random() * 2,
          grav: 900,
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
        this.shatterBody(b, fromX, fromY, impulse)
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
    const hitBodies = new Set<SolidBody>()

    // Check all bodies in radius
    const minX = wx - r
    const maxX = wx + r
    const minY = wy - r
    const maxY = wy + r

    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i]
      if (b.destroyed) continue
      // AABB overlap check
      if (b.x + b.w < minX || b.x > maxX || b.y + b.h < minY || b.y > maxY) continue

      const bcx = b.x + b.w / 2
      const bcy = b.y + b.h / 2
      const d = Math.hypot(bcx - wx, bcy - wy)
      if (d <= r + Math.min(b.w, b.h) / 2) {
        hitBodies.add(b)
      }
    }

    for (const b of hitBodies) {
      const bcx = b.x + b.w / 2
      const bcy = b.y + b.h / 2
      let dx = bcx - wx
      let dy = bcy - wy
      const d = Math.hypot(dx, dy) || 1
      dx /= d
      dy /= d

      const falloff = Math.max(0.2, 1 - d / (r * 1.3))
      const dmg = (opts.full ? 220 : 45 + r * 1.2) * falloff
      b.hp -= dmg

      // Add scorch decal
      if (opts.scorch) {
        b.damageDecals.push({
          rx: Math.max(2, Math.min(b.w - 2, wx - b.x + dx * 6)),
          ry: Math.max(2, Math.min(b.h - 2, wy - b.y + dy * 6)),
          r: Math.min(16, 4 + r * 0.15),
        })
      }

      if (b.hp <= 0) {
        this.shatterBody(b, wx, wy, imp * falloff)
      } else {
        // Dislodge and propel
        this.dislodgeBody(b, dx * imp * falloff, dy * imp * falloff - 120)
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
    const minX = wx - r
    const maxX = wx + r
    const minY = wy - r
    const maxY = wy + r

    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i]
      if (b.destroyed) continue
      if (b.x + b.w < minX || b.x > maxX || b.y + b.h < minY || b.y > maxY) continue

      const bcx = b.x + b.w / 2
      const bcy = b.y + b.h / 2
      let dx = bcx - wx
      let dy = bcy - wy
      const d = Math.hypot(dx, dy) || 1
      dx /= d
      dy /= d

      const falloff = Math.max(0.15, 1 - d / r)
      const applied = power * falloff

      b.hp -= applied * 0.4
      if (b.hp <= 0) {
        this.shatterBody(b, wx, wy, applied)
      } else if (b.anchored) {
        this.dislodgeBody(b, dx * applied, dy * applied - 100)
      } else {
        const pushFactor = Math.min(12, 180 / b.mass)
        b.vx += dx * applied * pushFactor
        b.vy += dy * applied * pushFactor - 60
        b.vrot += (Math.random() - 0.5) * 6
      }
    }
  }

  igniteCell(i: number, strength = 220) {
    if (this.mat[i] !== MAT_SOLID || this.heat[i] > 0) return
    if (this.burns.length > 9000) return
    this.heat[i] = Math.min(255, strength)
    this.burns.push({ idx: i, t: 0, dur: 1.1 + Math.random() * 1.3 })
    this.dirty = true
  }

  igniteWorld(wx: number, wy: number, r: number) {
    for (const b of this.bodies) {
      if (b.destroyed) continue
      const bcx = b.x + b.w / 2
      const bcy = b.y + b.h / 2
      if (Math.hypot(bcx - wx, bcy - wy) < r + Math.min(b.w, b.h) / 2) {
        b.burning = 3.5
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
    // 1) Dynamic Bodies Physics (Falling, tumbling, bouncing on bedrock floor)
    const floorY = this.H - 24
    for (let i = this.dynamicBodies.length - 1; i >= 0; i--) {
      const b = this.dynamicBodies[i]
      if (b.destroyed) {
        this.dynamicBodies.splice(i, 1)
        continue
      }

      // Burning
      if (b.burning > 0) {
        b.burning -= dt
        b.hp -= 24 * dt
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

        // Floor collision
        if (b.y + b.h >= floorY) {
          b.y = floorY - b.h
          if (Math.abs(b.vy) > 130) {
            b.vy = -b.vy * 0.32
            b.vx *= 0.65
            b.vrot *= 0.5
          } else {
            b.vy = 0
            b.settleT += dt
            if (b.settleT > 0.35) {
              b.settled = true
              b.vx = 0
              b.vrot = 0
              b.rot = 0
              this.dynamicBodies.splice(i, 1)
              this.settledBodies.push(b)
            }
          }
        }
      }
    }

    // 2) Shards Physics (Fractured glyphs and polygon shards)
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i]
      s.life -= dt
      if (s.life <= 0) {
        this.shards.splice(i, 1)
        continue
      }

      if (!s.settled) {
        s.vy += 2300 * dt
        s.vx *= 1 - 0.45 * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.rot += s.vrot * dt

        // Floor bounce
        if (s.y >= floorY) {
          s.y = floorY
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

    // 3) Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt
      if (p.life <= 0) {
        this.particles.splice(i, 1)
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
        ctx.textBaseline = 'alphabetic'
        const base = b.baseY !== undefined ? b.baseY - camY : scrY + b.h * 0.8
        ctx.fillText(b.text || '', scrX, base)
        if (b.underline) {
          ctx.fillRect(scrX, base + 2, b.w, 1.5)
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
        ctx.textBaseline = 'alphabetic'
        const base = b.baseY !== undefined ? b.baseY - camY : scrY + b.h * 0.8
        ctx.fillText(b.text || '', scrX, base)
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
        } else {
          ctx.fillStyle = s.colorStr || '#718096'
          ctx.fill()
        }

        // Shard edge highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
        ctx.lineWidth = 1
        ctx.stroke()
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

// Generate jagged convex polygon shards for cards, boxes, and images
function generatePolygonShards(
  body: SolidBody,
  hitX: number,
  hitY: number,
  force: number
): ShardPiece[] {
  const shards: ShardPiece[] = []
  const w = body.w
  const h = body.h
  const localX = Math.max(w * 0.15, Math.min(w * 0.85, hitX - body.x))
  const localY = Math.max(h * 0.15, Math.min(h * 0.85, hitY - body.y))

  const pts: { x: number; y: number }[] = [
    { x: 0, y: 0 },
    { x: w * (0.35 + Math.random() * 0.3), y: 0 },
    { x: w, y: 0 },
    { x: w, y: h * (0.35 + Math.random() * 0.3) },
    { x: w, y: h },
    { x: w * (0.35 + Math.random() * 0.3), y: h },
    { x: 0, y: h },
    { x: 0, y: h * (0.35 + Math.random() * 0.3) },
  ]

  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]

    const cx = (localX + p1.x + p2.x) / 3
    const cy = (localY + p1.y + p2.y) / 3

    const poly = [
      { x: localX - cx, y: localY - cy },
      { x: p1.x - cx, y: p1.y - cy },
      { x: p2.x - cx, y: p2.y - cy },
    ]

    const wx = body.x + cx
    const wy = body.y + cy
    const dx = cx - localX
    const dy = cy - localY
    const d = Math.hypot(dx, dy) || 1
    const blastSpeed = force * (0.6 + Math.random() * 0.6)

    shards.push({
      x: wx,
      y: wy,
      vx: body.vx * 0.4 + (dx / d) * blastSpeed + (Math.random() - 0.5) * 140,
      vy: body.vy * 0.4 + (dy / d) * blastSpeed - 120 - Math.random() * 160,
      rot: 0,
      vrot: (Math.random() - 0.5) * (10 + force / 60),
      life: 3.2 + Math.random() * 1.6,
      maxLife: 4.8,
      kind: 'polygon',
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
  force: number
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
      vx: body.vx * 0.35 + dx * mag + (Math.random() - 0.5) * 160,
      vy: body.vy * 0.35 + dy * mag - 140 - Math.random() * 180,
      rot: 0,
      vrot: (Math.random() - 0.5) * (14 + force / 40),
      life: 3.5 + Math.random() * 1.5,
      maxLife: 5.0,
      kind: 'glyph',
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
