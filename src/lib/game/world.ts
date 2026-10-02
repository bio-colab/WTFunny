// The destructible pixel world: 2px grid cells, damage circles, fire spread,
// falling chunks (letters/boxes), particles, and the offscreen pixel buffer.

import { ConfigManager } from './engineConfig'

export const CELL = 2 // world px per grid cell
export const SKY_ROWS = 80 // empty rows above the page (160px of sky), like the original

export const MAT_EMPTY = 0
export const MAT_SOLID = 1
export const MAT_BEDROCK = 3

export type ElementKind = 'glyph' | 'box' | 'image'

export type LevelElement = {
  id: number
  kind: ElementKind
  cells: number[] // cell indices owned
  lost: number
  hp: number
  alive: boolean
  color?: number // for glyphs (avg)
  label?: string
  text?: string
  font?: string
  colorStr?: string
  isWord?: boolean
  w?: number
  h?: number
  image?: HTMLImageElement | null
  svgXml?: string
}

export type Chunk = {
  // rigid debris built from remaining cells of an element
  x: number // world px center
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  gw: number
  gh: number
  pix: Uint32Array // ABGR pixels (grid res)
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
  W = 0 // world px width
  H = 0 // world px height
  mat!: Uint8Array // cell material
  color!: Uint32Array // cell color (ABGR packed) — 0 = none
  owner!: Int32Array // cell -> element id (-1 = page bg)
  heat!: Uint8Array // 0..255 heat (burning)
  elements = new Map<number, LevelElement>()
  totalCells = 1
  destroyedCells = 0
  blocksBroken = 0
  lettersPopped = 0
  explosions = 0

  chunks: Chunk[] = []
  particles: Particle[] = []
  burns: BurnCell[] = []
  burnAcc = 0

  // offscreen pixel buffer (grid res) drawn scaled
  pixBuf!: Uint32Array
  imgData!: ImageData
  levelCanvas!: HTMLCanvasElement
  levelCtx!: CanvasRenderingContext2D
  private smallCanvas!: HTMLCanvasElement
  private smallCtx!: CanvasRenderingContext2D
  dirty = true

  onElementGone?: (el: LevelElement) => void
  onCellDestroyed?: (wx: number, wy: number, colorABGR: number) => void

  init(W: number, H: number) {
    this.W = W
    this.H = H
    this.GW = Math.ceil(W / CELL)
    this.GH = Math.ceil(H / CELL)
    const n = this.GW * this.GH
    this.mat = new Uint8Array(n)
    this.color = new Uint32Array(n)
    this.owner = new Int32Array(n).fill(-1)
    this.heat = new Uint8Array(n)
    this.pixBuf = new Uint32Array(n)
    this.imgData = new ImageData(this.GW, this.GH)
    new Uint32Array(this.imgData.data.buffer).set(this.pixBuf)
    this.levelCanvas = document.createElement('canvas')
    this.levelCanvas.width = this.GW
    this.levelCanvas.height = this.GH
    this.levelCtx = this.levelCanvas.getContext('2d')!
    this.smallCanvas = this.levelCanvas
    this.smallCtx = this.levelCtx
    this.elements.clear()
    this.chunks.length = 0
    this.particles.length = 0
    this.burns.length = 0
    this.destroyedCells = 0
    this.blocksBroken = 0
    this.lettersPopped = 0
    this.explosions = 0
    this.totalCells = 1
  }

  idx(cx: number, cy: number) {
    return cy * this.GW + cx
  }

  solidAtWorld(wx: number, wy: number) {
    const cx = Math.floor(wx / CELL)
    const cy = Math.floor(wy / CELL)
    if (cx < 0 || cx >= this.GW) return true // side walls
    if (cy >= this.GH) return true
    if (cy < 0) return false
    return this.mat[this.idx(cx, cy)] !== MAT_EMPTY
  }

  // Load colors + owners built by the loader (offset by sky rows)
  loadFromLoader(
    colors: Uint32Array, // grid res ABGR (page-only)
    owners: Int32Array, // grid res element ids (-1 bg)
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
    // bedrock floor: 2 rows at bottom (dark)
    let solid = 0
    for (let i = 0; i < this.mat.length; i++) if (this.mat[i] !== MAT_EMPTY) solid++
    const bed = packColor('#1e1e1e')
    for (let cy = this.GH - 2; cy < this.GH; cy++) {
      for (let cx = 0; cx < this.GW; cx++) {
        const i = this.idx(cx, cy)
        this.mat[i] = MAT_BEDROCK
        this.color[i] = bed
        this.pixBuf[i] = bed
        solid++
      }
    }
    this.totalCells = Math.max(1, solid)
    this.dirty = true
  }

  destroyedPct() {
    return this.destroyedCells / this.totalCells
  }

  // ---- damage ----

  damageCircle(wx: number, wy: number, r: number, opts: { debris?: boolean; scorch?: boolean; impulse?: number; countAsDestroy?: boolean; full?: boolean } = {}) {
    const cx = Math.floor(wx / CELL)
    const cy = Math.floor(wy / CELL)
    const rc = Math.ceil(r / CELL)
    const imp = opts.impulse ?? 0
    const popped: LevelElement[] = []
    const affected = new Map<number, { el: LevelElement; lost: number }>()
    for (let dy = -rc; dy <= rc; dy++) {
      const yy = cy + dy
      if (yy < 0 || yy >= this.GH) continue
      for (let dx = -rc; dx <= rc; dx++) {
        const xx = cx + dx
        if (xx < 0 || xx >= this.GW) continue
        const d = Math.sqrt(dx * dx + dy * dy) * CELL
        if (d > r) continue
        const i = this.idx(xx, yy)
        if (this.mat[i] !== MAT_SOLID) continue
        // falloff: keep some cells near edge for roughness (unless full annihilation)
        if (!opts.full && d > r * 0.75 && Math.random() < 0.35) continue
        this.destroyCell(i, wx + dx * CELL, wy + dy * CELL, opts)
        const own = this.owner[i]
        if (own >= 0) {
          const a = affected.get(own)
          if (a) a.lost++
          else if (this.elements.has(own)) affected.set(own, { el: this.elements.get(own)!, lost: 1 })
        }
      }
    }
    // pop elements that lost enough cells
    for (const [, a] of affected) {
      const el = a.el
      el.lost += a.lost
      const ratio = el.lost / Math.max(1, el.cells.length)
      if (el.kind === 'glyph' && ratio > 0.22 && el.alive) popped.push(el)
      else if (el.kind !== 'glyph' && (el.cells.length < 1200 ? ratio > 0.55 : ratio > 0.8) && el.alive) popped.push(el)
    }
    for (const el of popped) this.popElement(el, wx, wy, imp || 420)
    // scorch ring
    if (opts.scorch) {
      const sr = r * 1.25
      const scx = Math.floor(wx / CELL)
      const scy = Math.floor(wy / CELL)
      const src = Math.ceil(sr / CELL)
      for (let dy = -src; dy <= src; dy++) {
        for (let dx = -src; dx <= src; dx++) {
          const d = Math.sqrt(dx * dx + dy * dy) * CELL
          if (d > sr || d < r * 0.8) continue
          const xx = scx + dx
          const yy = scy + dy
          if (xx < 0 || yy < 0 || xx >= this.GW || yy >= this.GH) continue
          const i = this.idx(xx, yy)
          if (this.mat[i] !== MAT_SOLID) continue
          if (Math.random() < 0.5) {
            this.color[i] = darken(this.color[i], 0.35)
            this.pixBuf[i] = this.color[i]
          }
        }
      }
      this.dirty = true
    }
  }

  private destroyCell(i: number, wx: number, wy: number, opts: { debris?: boolean; countAsDestroy?: boolean }) {
    const col = this.color[i]
    this.mat[i] = MAT_EMPTY
    this.pixBuf[i] = 0
    this.heat[i] = 0
    this.destroyedCells++
    this.dirty = true
    if (opts.debris !== false && col !== 0 && Math.random() < 0.5 && this.particles.length < 22000) {
      const c = unpackColor(col)
      this.spawnParticle({
        x: wx,
        y: wy,
        vx: (Math.random() - 0.5) * 260,
        vy: -Math.random() * 300 - 60,
        life: 0.7 + Math.random() * 0.6,
        max: 1.3,
        kind: 'debris',
        color: c,
        size: 2 + Math.random() * 2,
        grav: 1600,
      })
    }
  }

  // an element pops off as one or more physics chunks
  popElement(el: LevelElement, fromX: number, fromY: number, impulse: number) {
    if (!el.alive) return
    el.alive = false
    if (el.kind === 'glyph') this.lettersPopped++
    // collect remaining cells
    const cells: number[] = []
    for (const i of el.cells) {
      if (this.mat[i] === MAT_SOLID) cells.push(i)
      else if (this.owner[i] === el.id) this.owner[i] = -1
    }
    if (cells.length === 0) {
      this.checkGone(el)
      return
    }
    // split into up to 3 connected components for big boxes
    const comps = cells.length > 140 ? splitComponents(cells, this.GW, 3) : [cells]
    let ci = 0
    for (const comp of comps) {
      let minx = 1e9
      let miny = 1e9
      let maxx = -1
      let maxy = -1
      for (const i of comp) {
        const cx = i % this.GW
        const cy = (i / this.GW) | 0
        if (cx < minx) minx = cx
        if (cy < miny) miny = cy
        if (cx > maxx) maxx = cx
        if (cy > maxy) maxy = cy
      }
      const gw = maxx - minx + 1
      const gh = maxy - miny + 1
      if (gw * gh > 90000) {
        // too big: just erase (rare)
        for (const i of comp) {
          if (this.mat[i] === MAT_SOLID) this.destroyCell(i, (i % this.GW) * CELL, ((i / this.GW) | 0) * CELL, {})
        }
        continue
      }
      const pix = new Uint32Array(gw * gh)
      const cv = document.createElement('canvas')
      cv.width = gw
      cv.height = gh
      const cctx = cv.getContext('2d')!
      const img = cctx.createImageData(gw, gh)
      const buf = new Uint32Array(img.data.buffer)
      let any = false
      for (const i of comp) {
        const cx = i % this.GW
        const cy = (i / this.GW) | 0
        const px = cx - minx
        const py = cy - miny
        if (this.mat[i] !== MAT_SOLID) continue
        buf[py * gw + px] = this.color[i]
        pix[py * gw + px] = this.color[i]
        this.mat[i] = MAT_EMPTY
        this.pixBuf[i] = 0
        this.heat[i] = 0
        this.owner[i] = -1
        this.destroyedCells++
        any = true
      }
      if (!any) continue
      cctx.putImageData(img, 0, 0)
      // velocity: radial from blast point + up bias
      const cxw = (minx + gw / 2) * CELL
      const cyw = (miny + gh / 2) * CELL
      let dx = cxw - fromX
      let dy = cyw - fromY
      const d = Math.hypot(dx, dy) || 1
      dx /= d
      dy /= d
      const mag = impulse * (0.6 + Math.random() * 0.5)
      this.chunks.push({
        x: cxw,
        y: cyw,
        vx: dx * mag + (Math.random() - 0.5) * 160,
        vy: dy * mag - 120 - Math.random() * 160,
        rot: 0,
        vrot: (Math.random() - 0.5) * (8 + impulse / 120),
        gw,
        gh,
        pix,
        canvas: cv,
        life: 4.5,
        settled: false,
        settleT: 0,
        isVector: !!(el.text || el.image),
        vectorText: el.text,
        vectorFont: el.font,
        vectorColor: el.colorStr,
        vectorImage: el.image,
        vectorW: el.w,
        vectorH: el.h,
      })
      if (this.chunks.length > 320) {
        const old = this.chunks.shift()
        if (old) this.puffAt(old.x, old.y, old.gw * CELL / 2)
      }
      ci++
      if (ci > 5) break
    }
    this.dirty = true
    this.checkGone(el)
  }

  private checkGone(el: LevelElement) {
    if (el.kind === 'glyph') return // letters count via lettersPopped
    this.blocksBroken++
    this.onElementGone?.(el)
  }

  puffAt(wx: number, wy: number, r: number) {
    for (let k = 0; k < 6; k++) {
      this.spawnParticle({
        x: wx + (Math.random() - 0.5) * r,
        y: wy + (Math.random() - 0.5) * r,
        vx: (Math.random() - 0.5) * 60,
        vy: -40 - Math.random() * 60,
        life: 0.8,
        max: 0.8,
        kind: 'smoke',
        color: SMOKE_COLORS[(Math.random() * SMOKE_COLORS.length) | 0],
        size: 3 + Math.random() * 3,
      })
    }
  }

  // knock letters near a blast; big boxes tear out only the local piece
  blastImpulse(wx: number, wy: number, r: number, power: number) {
    const cx = Math.floor(wx / CELL)
    const cy = Math.floor(wy / CELL)
    const rc = Math.ceil(r / CELL)
    const affected = new Map<number, { el: LevelElement; cells: number[] }>()
    for (let dy = -rc; dy <= rc; dy++) {
      const yy = cy + dy
      if (yy < 0 || yy >= this.GH) continue
      for (let dx = -rc; dx <= rc; dx++) {
        const xx = cx + dx
        if (xx < 0 || xx >= this.GW) continue
        if (Math.sqrt(dx * dx + dy * dy) * CELL > r) continue
        const i = this.idx(xx, yy)
        if (this.mat[i] !== MAT_SOLID) continue
        const own = this.owner[i]
        if (own < 0) continue
        const a = affected.get(own)
        if (a) a.cells.push(i)
        else if (this.elements.has(own)) affected.set(own, { el: this.elements.get(own)!, cells: [i] })
      }
    }
    for (const [, a] of affected) {
      const el = a.el
      const small = el.cells.length < 1200
      if (el.kind === 'glyph' || small) {
        const d = Math.hypot((cx * CELL) - wx, (cy * CELL) - wy)
        const fall = Math.max(0.25, 1 - d / (r * 1.4))
        this.popElement(el, wx, wy, power * fall + 180)
      } else {
        // tear out just the blast-area cells as a flying chunk
        this.tearCells(el, a.cells, wx, wy, power)
      }
    }
  }

  // remove a subset of an element's cells and spawn them as a physics chunk
  tearCells(el: LevelElement, cells: number[], fromX: number, fromY: number, power: number) {
    const solid: number[] = []
    const cellSet = new Set(el.cells)
    for (const i of cells) {
      if (this.mat[i] === MAT_SOLID && cellSet.has(i)) solid.push(i)
    }
    if (solid.length < 4) return
    let minx = 1e9
    let miny = 1e9
    let maxx = -1
    let maxy = -1
    for (const i of solid) {
      const cx = i % this.GW
      const cy = (i / this.GW) | 0
      if (cx < minx) minx = cx
      if (cy < miny) miny = cy
      if (cx > maxx) maxx = cx
      if (cy > maxy) maxy = cy
    }
    const gw = maxx - minx + 1
    const gh = maxy - miny + 1
    if (gw * gh > 60000) return
    const cv = document.createElement('canvas')
    cv.width = gw
    cv.height = gh
    const cctx = cv.getContext('2d')!
    const img = cctx.createImageData(gw, gh)
    const buf = new Uint32Array(img.data.buffer)
    let any = false
    for (const i of solid) {
      const cx = i % this.GW
      const cy = (i / this.GW) | 0
      const px = cx - minx
      const py = cy - miny
      buf[py * gw + px] = this.color[i]
      this.mat[i] = MAT_EMPTY
      this.pixBuf[i] = 0
      this.heat[i] = 0
      this.owner[i] = -1
      this.destroyedCells++
      any = true
    }
    if (!any) return
    cctx.putImageData(img, 0, 0)
    el.lost += solid.length
    const k = el.lost / Math.max(1, el.cells.length)
    const cxw = (minx + gw / 2) * CELL
    const cyw = (miny + gh / 2) * CELL
    let dx = cxw - fromX
    let dy = cyw - fromY
    const d = Math.hypot(dx, dy) || 1
    dx /= d
    dy /= d
    const mag = power * (0.7 + Math.random() * 0.5)
    this.chunks.push({
      x: cxw,
      y: cyw,
      vx: dx * mag + (Math.random() - 0.5) * 140,
      vy: dy * mag - 140 - Math.random() * 140,
      rot: 0,
      vrot: (Math.random() - 0.5) * (6 + power / 150),
      gw,
      gh,
      pix: buf,
      canvas: cv,
      life: 4.5,
      settled: false,
      settleT: 0,
    })
    if (this.chunks.length > 320) {
      const old = this.chunks.shift()
      if (old) this.puffAt(old.x, old.y, old.gw * CELL / 2)
    }
    this.dirty = true
    if (k > 0.85) {
      el.alive = false
      this.blocksBroken++
      this.onElementGone?.(el)
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
    const cx = Math.floor(wx / CELL)
    const cy = Math.floor(wy / CELL)
    const rc = Math.ceil(r / CELL)
    for (let dy = -rc; dy <= rc; dy++) {
      for (let dx = -rc; dx <= rc; dx++) {
        if (dx * dx + dy * dy > rc * rc) continue
        const xx = cx + dx
        const yy = cy + dy
        if (xx < 0 || yy < 0 || xx >= this.GW || yy >= this.GH) continue
        const i = this.idx(xx, yy)
        if (this.mat[i] === MAT_SOLID && Math.random() < 0.75) this.igniteCell(i)
      }
    }
  }

  private stepBurns(dt: number) {
    this.burnAcc += dt
    const spreadTick = this.burnAcc > 0.12
    if (spreadTick) this.burnAcc = 0
    for (let b = this.burns.length - 1; b >= 0; b--) {
      const c = this.burns[b]
      c.t += dt
      const i = c.idx
      if (this.mat[i] !== MAT_SOLID) {
        this.burns.splice(b, 1)
        continue
      }
      // flicker color
      if (Math.random() < 0.35) {
        this.pixBuf[i] = packColor(FIRE_COLORS[(Math.random() * FIRE_COLORS.length) | 0])
        this.dirty = true
      }
      if (Math.random() < 0.028 && this.particles.length < 16000) {
        const wx = (i % this.GW) * CELL
        const wy = ((i / this.GW) | 0) * CELL
        if (Math.random() < 0.6) {
          this.spawnParticle({
            x: wx,
            y: wy,
            vx: (Math.random() - 0.5) * 70,
            vy: -80 - Math.random() * 120,
            life: 0.5 + Math.random() * 0.5,
            max: 1,
            kind: 'ember',
            color: FIRE_COLORS[(Math.random() * 3) | 0],
            size: 2,
            grav: -200,
          })
        } else {
          this.spawnParticle({
            x: wx,
            y: wy - 4,
            vx: (Math.random() - 0.5) * 40,
            vy: -60 - Math.random() * 60,
            life: 1 + Math.random(),
            max: 2,
            kind: 'smoke',
            color: SMOKE_COLORS[(Math.random() * SMOKE_COLORS.length) | 0],
            size: 3 + Math.random() * 4,
          })
        }
      }
      // spread
      if (spreadTick && Math.random() < 0.45) {
        const dirs = [-1, 1, -this.GW, this.GW, -this.GW - 1, -this.GW + 1, this.GW - 1, this.GW + 1]
        const d = dirs[(Math.random() * dirs.length) | 0]
        const j = i + d
        if (j >= 0 && j < this.mat.length && this.mat[j] === MAT_SOLID && this.heat[j] === 0) {
          this.igniteCell(j)
        }
      }
      if (c.t >= c.dur) {
        // burn out: destroy the cell
        this.burns.splice(b, 1)
        const wx = (i % this.GW) * CELL
        const wy = ((i / this.GW) | 0) * CELL
        this.destroyCell(i, wx, wy, {})
        const own = this.owner[i]
        if (own >= 0) {
          const el = this.elements.get(own)
          if (el && el.alive) {
            el.lost++
            if (el.kind === 'glyph' && el.lost / Math.max(1, el.cells.length) > 0.3) this.popElement(el, wx, wy, 200)
            else if (el.kind !== 'glyph' && el.lost / Math.max(1, el.cells.length) > (el.cells.length < 1200 ? 0.6 : 0.85)) this.popElement(el, wx, wy, 200)
          }
        }
      }
    }
  }

  spawnParticle(p: Particle) {
    if (this.particles.length > 24000) return
    p.max = p.max || p.life
    this.particles.push(p)
  }

  raycast(x: number, y: number, dx: number, dy: number, maxDist: number): { x: number; y: number; hit: boolean } {
    // step ray in CELL increments
    const step = CELL * 0.8
    let cx = x
    let cy = y
    for (let d = 0; d < maxDist; d += step) {
      cx += dx * step
      cy += dy * step
      if (cx < 0 || cx >= this.W || cy >= this.H) return { x: cx, y: cy, hit: true }
      if (cy < 0) continue
      if (this.mat[this.idx(Math.floor(cx / CELL), Math.floor(cy / CELL))] !== MAT_EMPTY) {
        return { x: cx, y: cy, hit: true }
      }
    }
    return { x: cx, y: cy, hit: false }
  }

  step(dt: number) {
    // chunks physics
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const c = this.chunks[i]
      c.life -= dt
      if (c.life <= 0) {
        this.chunks.splice(i, 1)
        continue
      }
      if (!c.settled) {
        c.vy += 1900 * dt
        c.vx *= 1 - 0.4 * dt
        c.x += c.vx * dt
        c.y += c.vy * dt
        c.rot += c.vrot * dt
        // collide with world: check a few sample points along bottom edge
        const bot = c.gh / 2
        const samp = [c.x - c.gw / 4, c.x, c.x + c.gw / 4]
        let grounded = false
        for (const sx of samp) {
          if (this.solidAtWorld(sx, c.y + bot + 2)) {
            grounded = true
            break
          }
        }
        if (grounded) {
          if (Math.abs(c.vy) > 140) {
            c.vy *= -0.28
            c.vx *= 0.7
            c.vrot *= 0.6
          } else {
            c.settled = true
            c.vy = 0
            c.vx *= 0.5
            c.vrot = 0
          }
        }
        // side collision
        if (this.solidAtWorld(c.x + Math.sign(c.vx) * (c.gw / 2), c.y)) c.vx *= -0.4
      } else {
        c.settleT += dt
        c.x += c.vx * dt
        c.vx *= 1 - 4 * dt
      }
      if (c.y > this.H + 200) this.chunks.splice(i, 1)
    }

    // particles
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

    this.stepBurns(dt)
  }

  // Render world pixels into the level canvas if dirty
  flushPixels() {
    if (!this.dirty) return
    new Uint32Array(this.imgData.data.buffer).set(this.pixBuf)
    this.levelCtx.putImageData(this.imgData, 0, 0)
    this.dirty = false
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number, viewW: number, viewH: number) {
    this.flushPixels()
    // draw visible region scaled CELL×
    const sx = Math.max(0, camX / CELL)
    const sy = Math.max(0, camY / CELL)
    const sw = Math.min(this.GW - sx, viewW / CELL)
    const sh = Math.min(this.GH - sy, viewH / CELL)
    if (sw <= 0 || sh <= 0) return
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.levelCanvas, sx, sy, sw, sh, sx * CELL - camX, sy * CELL - camY, sw * CELL, sh * CELL)

    // chunks
    const isHdVector = ConfigManager.get().getConfig().visual.hdVectorMode
    for (const c of this.chunks) {
      ctx.save()
      ctx.translate(c.x - camX, c.y - camY)
      ctx.rotate(c.rot)
      const alpha = c.life < 0.7 ? Math.max(0, c.life / 0.7) : 1
      ctx.globalAlpha = alpha

      if (isHdVector && c.isVector) {
        if (c.vectorText && c.vectorFont) {
          ctx.font = c.vectorFont
          ctx.fillStyle = c.vectorColor || '#ffffff'
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'center'
          ctx.imageSmoothingEnabled = true
          ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
          ctx.shadowBlur = 4
          ctx.fillText(c.vectorText, 0, 0)
        } else if (c.vectorImage) {
          ctx.imageSmoothingEnabled = true
          const w = c.vectorW || c.gw * CELL
          const h = c.vectorH || c.gh * CELL
          ctx.drawImage(c.vectorImage, -w / 2, -h / 2, w, h)
        } else {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(c.canvas, (-c.gw / 2) * CELL, (-c.gh / 2) * CELL, c.gw * CELL, c.gh * CELL)
        }
      } else {
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(c.canvas, (-c.gw / 2) * CELL, (-c.gh / 2) * CELL, c.gw * CELL, c.gh * CELL)
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

// ---- color helpers (ABGR packed for little-endian ImageData) ----

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

// split cells into connected components (4-neigh), max N components; returns component cell arrays
function splitComponents(cells: number[], GW: number, maxComps: number): number[][] {
  const set = new Set(cells)
  const comps: number[][] = []
  const seen = new Set<number>()
  for (const start of cells) {
    if (seen.has(start)) continue
    const comp: number[] = []
    const stack = [start]
    seen.add(start)
    while (stack.length && comp.length < 30000) {
      const i = stack.pop()!
      comp.push(i)
      const cx = i % GW
      const neigh = [i - 1, i + 1, i - GW, i + GW]
      for (let k = 0; k < 4; k++) {
        const j = neigh[k]
        if (k === 0 && cx === 0) continue
        if (k === 1 && cx === GW - 1) continue
        if (set.has(j) && !seen.has(j)) {
          seen.add(j)
          stack.push(j)
        }
      }
    }
    comps.push(comp)
    if (comps.length >= maxComps) break
  }
  return comps
}
