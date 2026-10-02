// Main game engine: loop, camera, input, rendering orchestration, stats.
// Vanilla TS + canvas for performance; talks to React via callbacks.

import { World, CELL, MAT_EMPTY, SKY_ROWS } from './world'
import { buildLevel, LoadProgress } from './loader'
import { buildBackgrounds, BgBundle } from './backgrounds'
import { Player, PHYS, InputState } from './player'
import { WEAPONS, WeaponDef, WeaponEntities, newWeaponEntities, fireWeapon, throwGrenade, stepEntities, drawEntities, GRENADE, explodeAt, getWeaponIcon, spawnBullet } from './weapons'
import { drawStickman, WEAPON_ICONS, buildSpriteCanvas } from './sprites'
import { sound } from './sound'

export type GameStats = {
  pct: number
  pctMax: number
  letters: number
  blocks: number
  explosions: number
  shots: number
  time: number
  done: boolean
  weapon: number
  weaponName: string
  weaponNameEn: string
  fps: number
  site: string
  droneBattery: number
  droneCd: number
  hasDrone: boolean
  characterName: string
}

export type MilestoneInfo = {
  pct: number
  titleAr: string
  titleEn: string
}

export type EngineCallbacks = {
  onProgress: LoadProgress
  onStats: (s: GameStats) => void
  onComplete: (s: { letters: number; blocks: number; explosions: number; shots: number; time: number }) => void
  onPauseRequest: () => void
  onMilestone?: (m: MilestoneInfo) => void
}

export type StartOptions = {
  url: string // 'demo' or website url
  bgTheme: string
}

const LAYOUT_W = 1080

import { ConfigManager } from './engineConfig'
import { drawCharacter } from './sprites'

export class DestroyEngine {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private raf = 0
  private last = 0
  private acc = 0
  private running = false
  private paused = false

  world = new World()
  player: Player | null = null
  es: WeaponEntities = newWeaponEntities()
  private bg: BgBundle | null = null
  private camX = 0
  private camY = 0
  private shake = 0
  private shakeX = 0
  private shakeY = 0
  private viewW = 800
  private viewH = 600
  private dpr = 1

  private input: InputState = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    down: false,
    fire: false,
    alt: false,
    altPressed: false,
    aimX: 0,
    aimY: 0,
    wheel: 0,
  }

  private keysDown = new Set<string>()
  private statsT = 0
  private pctMax = 0
  private startTime = 0
  private done = false
  private fps = 60
  private fpsAcc = 0
  private fpsN = 0
  private site = ''
  private weaponNameT = 0
  private mouseInside = true
  private backdropCanvas: HTMLCanvasElement | null = null

  cb: EngineCallbacks
  private opts: StartOptions | null = null

  constructor(cb: EngineCallbacks) {
    this.cb = cb
    this.loop = this.loop.bind(this)
  }

  setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.resize()
  }

  resize() {
    if (!this.canvas) return
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    this.viewW = Math.max(320, Math.floor(rect.width))
    this.viewH = Math.max(240, Math.floor(rect.height))
    this.canvas.width = Math.floor(this.viewW * this.dpr)
    this.canvas.height = Math.floor(this.viewH * this.dpr)
  }

  async start(opts: StartOptions) {
    this.opts = opts
    this.done = false
    this.paused = false
    this.pctMax = 0
    this.milestonesPassed.clear()
    this.es = newWeaponEntities()
    this.site = opts.url === 'demo' ? 'غير قابل للتدمير' : opts.url.replace(/^https?:\/\//, '')
    sound.ensure()

    // 1) fetch html
    this.cb.onProgress('جلب الصفحة…', 0.06)
    const resp = await fetch(`/api/page?url=${encodeURIComponent(opts.url)}`)
    if (!resp.ok) {
      let msg = 'تعذّر تحميل الموقع.'
      try {
        const j = await resp.json()
        if (j.error) msg = j.error
      } catch {
        /* noop */
      }
      throw new Error(msg)
    }
    const html = await resp.text()

    // 2) build level
    const level = await buildLevel(html, opts.url === 'demo' ? 'https://demo.local/' : `https://${opts.url.replace(/^https?:\/\//, '')}`, LAYOUT_W, (m, p) => {
      this.cb.onProgress(m, p)
    })
    this.backdropCanvas = level.backdropCanvas || null

    // 3) init world + player (extra sky rows above the page, like the original)
    const pageGW = Math.ceil(level.W / CELL)
    const pageGH = Math.ceil(level.H / CELL)
    const skyPx = SKY_ROWS * CELL
    const bottomPx = 130 // breathing room below the page so the player is visible above the HUD
    this.world.onElementGone = undefined
    this.world.init(level.W, level.H + skyPx + bottomPx)
    this.world.loadFromLoader(level.colors, level.owners, level.elements, pageGW, pageGH)
    this.bg = buildBackgrounds(Math.max(900, this.viewW), Math.max(700, this.viewH), opts.bgTheme)

    // spawn player: topmost surface (page roof) with headroom — like the original
    let spawnX = level.W / 2
    let spawnY = skyPx + 20
    outer: for (let cy = 2; cy < this.world.GH - 4; cy++) {
      for (let cx = Math.floor(this.world.GW / 4); cx < this.world.GW - 4; cx += 2) {
        if (this.world.mat[this.world.idx(cx, cy)] !== MAT_EMPTY && this.world.mat[this.world.idx(cx, cy - 1)] === MAT_EMPTY) {
          // headroom above this surface
          let ok = true
          for (let hy = Math.max(1, cy - 24); hy < cy; hy++) {
            for (let hx = -6; hx <= 6; hx += 3) {
              const xx = cx + hx
              if (xx < 0 || xx >= this.world.GW) continue
              if (this.world.mat[this.world.idx(xx, hy)] !== MAT_EMPTY) {
                ok = false
                break
              }
            }
            if (!ok) break
          }
          if (!ok) continue
          spawnX = cx * CELL
          spawnY = cy * CELL - 1
          break outer
        }
      }
    }
    // ensure spawn area is clear: carve only if needed
    let clear = true
    for (let dy = 1; dy <= 24; dy += 4) {
      for (let dx = -12; dx <= 12; dx += 4) {
        if (this.world.solidAtWorld(spawnX + dx, spawnY - dy)) {
          clear = false
          break
        }
      }
      if (!clear) break
    }
    if (!clear) this.world.damageCircle(spawnX, spawnY - 22, 26, { debris: false })
    this.player = new Player(spawnX, spawnY)
    this.player.weaponIdx = 0
    this.camX = Math.max(0, Math.min(level.W - this.viewW, spawnX - this.viewW / 2))
    this.camY = Math.max(0, spawnY - this.viewH / 2)
    this.startTime = performance.now()
    this.done = false

    this.cb.onProgress('اكتمل!', 1)
    ;(window as unknown as { __daw: DestroyEngine }).__daw = this
    sound.start()
    this.running = true
    this.last = performance.now()
    if (!this.raf) this.raf = requestAnimationFrame(this.loop)
  }

  stop() {
    this.running = false
    if (this.raf) {
      cancelAnimationFrame(this.raf)
      this.raf = 0
    }
    this.player = null
  }

  setPaused(p: boolean) {
    this.paused = p
    if (!p) this.last = performance.now()
  }

  setBgTheme(theme: string) {
    this.bg = buildBackgrounds(Math.max(900, this.viewW), Math.max(700, this.viewH), theme)
  }

  // ---- input plumbing (called by React component) ----
  onKey(e: KeyboardEvent, down: boolean) {
    const k = e.key.toLowerCase()
    if (down) {
      if (this.keysDown.has(k)) return
      this.keysDown.add(k)
    } else this.keysDown.delete(k)
    switch (k) {
      case 'a':
      case 'arrowleft':
        this.input.left = down
        break
      case 'd':
      case 'arrowright':
        this.input.right = down
        break
      case ' ':
      case 'w':
      case 'arrowup':
        if (down && !this.input.jump) this.input.jumpPressed = true
        this.input.jump = down
        e.preventDefault()
        break
      case 's':
      case 'arrowdown':
        this.input.down = down
        break
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '0': {
        if (down) {
          const n = k === '0' ? 9 : parseInt(k) - 1
          this.selectWeapon(n)
        }
        break
      }
      case 'q':
        if (down) this.selectWeapon((this.player?.weaponIdx ?? 0 + 1) % WEAPONS.length)
        break
      case 'escape':
      case 'p':
        if (down) this.cb.onPauseRequest()
        break
    }
  }

  selectWeapon(n: number) {
    if (!this.player || n === this.player.weaponIdx || n < 0 || n >= WEAPONS.length) return
    this.player.weaponIdx = n
    this.player.switchT = 0
    this.player.cooldown = 0.12
    sound.switch(0)
    this.weaponNameT = 1.4
  }

  onMouseMove(x: number, y: number) {
    this.input.aimX = x + this.camX
    this.input.aimY = y + this.camY
    this.mouseInside = true
  }

  onMouseDown(btn: number) {
    if (btn === 0) {
      this.input.fire = true
    } else if (btn === 2) {
      this.input.altPressed = true
      this.input.alt = true
    }
  }

  onMouseUp(btn: number) {
    if (btn === 0) this.input.fire = false
    else if (btn === 2) this.input.alt = false
  }

  onWheel(dy: number) {
    if (!this.player) return
    const dir = dy > 0 ? 1 : -1
    this.selectWeapon((this.player.weaponIdx + dir + WEAPONS.length) % WEAPONS.length)
  }

  onTouchAim(x: number, y: number, down: boolean) {
    this.input.aimX = x + this.camX
    this.input.aimY = y + this.camY
    this.input.fire = down
  }

  // ---- main loop ----
  private loop(now: number) {
    this.raf = 0
    if (!this.running) return
    this.raf = requestAnimationFrame(this.loop)
    let dt = (now - this.last) / 1000
    this.last = now
    if (this.paused) return
    if (dt > 0.1) dt = 0.1

    this.fpsAcc += dt
    this.fpsN++
    if (this.fpsAcc >= 0.5) {
      this.fps = Math.round(this.fpsN / this.fpsAcc)
      this.fpsAcc = 0
      this.fpsN = 0
    }

    this.acc += dt
    const STEP = 1 / 120
    let steps = 0
    while (this.acc >= STEP && steps < 8) {
      this.stepGame(STEP)
      this.acc -= STEP
      steps++
    }
    this.render()
    this.acc = Math.min(this.acc, 0.1)

    // stats to react ~10/s
    this.statsT += dt
    if (this.statsT > 0.1) {
      this.statsT = 0
      this.emitStats()
    }
  }

  private stepGame(dt: number) {
    const world = this.world
    const p = this.player
    if (!p) return

    // consume one-shot inputs
    const inp: InputState = { ...this.input, jumpPressed: this.input.jumpPressed, altPressed: this.input.altPressed }
    this.input.jumpPressed = false
    this.input.altPressed = false
    if (this.input.wheel !== 0) {
      this.onWheel(this.input.wheel)
      this.input.wheel = 0
    }

    p.step(world, inp, dt)

    // firing
    const w = WEAPONS[p.weaponIdx]
    const cfg = ConfigManager.get().getConfig()
    const wTune = cfg.weapons[w.id] || { cooldownMul: 1 }

    if (inp.fire && p.cooldown <= 0 && !this.done) {
      if (w.kind === 'drone') {
        // click: deploy drone if none
        if ((!this.es.drone || this.es.drone.state === 2) && this.es.droneCd <= 0) {
          this.es.drone = { x: p.x + p.facing * 24, y: p.y - 64, vx: 0, vy: 0, battery: 12, maxBattery: 12, state: 0, fireT: 0, rampK: 0, lowBeepT: 0 }
          sound.droneBeep(0)
          this.weaponNameT = 1.2
        }
        p.cooldown = 0.35 * (wTune.cooldownMul ?? 1)
      } else if (w.auto || !this.fireHeld) {
        const pan = 0
        fireWeapon(world, this.es, w, p.x, p.y - 34, p.aim, pan, (s) => (this.shake = Math.max(this.shake, s)), (vx, vy) => p.impulse(vx, vy), () => {
          p.shots++
          p.flashT = 0.06
          p.kickRotV -= w.kick * 0.35
        })
        p.cooldown = w.cooldown * (wTune.cooldownMul ?? 1)
        this.fireHeld = true
      }
    }
    if (!inp.fire) this.fireHeld = false

    // railgun charge sound on select
    if (p.chargeT <= 0 && p.weaponIdx === 4 && this.fireHeld && p.cooldown > 0.8) {
      // noop
    }

    // grenade (RMB)
    if (inp.altPressed && p.grenadeCd <= 0 && !this.done) {
      const d = this.es.drone
      if (d && d.state === 0 && Math.hypot(d.x - p.x, d.y - p.y) < 900) {
        // dive-bomb with drone
        d.state = 1
        d.vx = p.vx
        d.vy = 100
        sound.droneBeep(0)
      } else {
        throwGrenade(world, this.es, p.x + Math.cos(p.aim) * 20, p.y - 34 + Math.sin(p.aim) * 20, p.aim, GRENADE.speed)
        p.grenadeCd = GRENADE.cooldown
      }
      this.input.alt = false
    }

    // step entities
    stepEntities(world, this.es, dt, p.x, p.y, { x: this.input.aimX, y: this.input.aimY })

    // drone auto-fire toward aim
    const d = this.es.drone
    if (d && d.state === 0 && this.input.fire && d.battery > 0) {
      d.fireT = (d.fireT ?? 0) - dt
      if (d.fireT <= 0) {
        d.fireT = 0.09
        const dx = this.input.aimX - d.x
        const dy = this.input.aimY - d.y
        const dd = Math.hypot(dx, dy) || 1
        void dd
        const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.1
        const sp = 2700
        spawnBullet(this.es, d.x, d.y, Math.cos(a) * sp, Math.sin(a) * sp, 16, 5, '#7ff3ff')
        sound.shot('drone', 0.5, 0)
        d.battery -= 0.12
        p.shots++
      }
    }

    world.step(dt)

    // camera follow
    const targetX = p.x - this.viewW / 2 + Math.cos(p.aim) * 40
    const targetY = p.y - this.viewH / 2 - 40 + Math.sin(p.aim) * 24
    const k = 1 - Math.exp(-dt / 0.09)
    this.camX += (targetX - this.camX) * k
    this.camY += (targetY - this.camY) * k
    this.camX = Math.max(0, Math.min(Math.max(0, world.W - this.viewW), this.camX))
    this.camY = Math.max(0, Math.min(Math.max(0, world.H - this.viewH), this.camY))

    // shake
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2.2)
      this.shakeX = (Math.random() - 0.5) * this.shake * 34
      this.shakeY = (Math.random() - 0.5) * this.shake * 34
    } else {
      this.shakeX = 0
      this.shakeY = 0
    }

    if (this.weaponNameT > 0) this.weaponNameT -= dt

    // completion & milestone checks
    const pct = world.destroyedPct()
    if (pct > this.pctMax) this.pctMax = pct

    const milestones = [
      { pct: 0.25, titleAr: 'بداية السحق! 25%', titleEn: '25% DEMOLISHED!' },
      { pct: 0.50, titleAr: 'سقوط نصف الموقع! 50%', titleEn: '50% CRUSHED!' },
      { pct: 0.75, titleAr: 'تدمير شامل هائل! 75%', titleEn: '75% HEAVY DAMAGE!' },
      { pct: 0.90, titleAr: 'الإبادة وشيكة! 90%', titleEn: '90% CRITICAL STATUS!' },
      { pct: 0.99, titleAr: 'محو تام للموقع! 100%', titleEn: '100% TOTAL ANNIHILATION!' },
    ]
    for (const m of milestones) {
      if (pct >= m.pct && !this.milestonesPassed.has(m.pct)) {
        this.milestonesPassed.add(m.pct)
        sound.milestone()
        this.cb.onMilestone?.(m)
      }
    }

    if (!this.done && pct >= 0.99) {
      this.done = true
      const time = Math.round((performance.now() - this.startTime) / 1000)
      sound.complete()
      setTimeout(() => {
        this.cb.onComplete({
          letters: world.lettersPopped,
          blocks: world.blocksBroken,
          explosions: world.explosions,
          shots: p.shots,
          time,
        })
      }, 900)
    }
  }

  private fireHeld = false
  private milestonesPassed = new Set<number>()

  private emitStats() {
    const world = this.world
    const p = this.player
    if (!p) return
    const w = WEAPONS[p.weaponIdx]
    const charCfg = ConfigManager.get().getConfig().character
    this.cb.onStats({
      pct: world.destroyedPct(),
      pctMax: this.pctMax,
      letters: world.lettersPopped,
      blocks: world.blocksBroken,
      explosions: world.explosions,
      shots: p.shots,
      time: (performance.now() - this.startTime) / 1000,
      done: this.done,
      weapon: p.weaponIdx,
      weaponName: w.nameAr,
      weaponNameEn: w.nameEn,
      fps: this.fps,
      site: this.site,
      droneBattery: this.es.drone?.battery ?? 0,
      droneCd: this.es.droneCd,
      hasDrone: !!this.es.drone && this.es.drone.state !== 2,
      characterName: charCfg.name,
    })
  }

  // ---- render ----
  private render() {
    const ctx = this.ctx
    if (!ctx || !this.player) return
    const world = this.world
    ctx.save()
    ctx.scale(this.dpr, this.dpr)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const camX = this.camX + this.shakeX
    const camY = this.camY + this.shakeY

    // background parallax
    if (this.bg) this.bg.draw(ctx, camX, camY, this.viewW, this.viewH, world.H)
    else {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, this.viewW, this.viewH)
    }

    // Webpage backdrop sheet (clean HTML page canvas with shadow & borders)
    if (this.backdropCanvas) {
      const pageX = 0 - camX
      const pageY = SKY_ROWS * CELL - camY
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.42)'
      ctx.shadowBlur = 28
      ctx.shadowOffsetY = 12
      ctx.drawImage(this.backdropCanvas, pageX, pageY)
      ctx.restore()
    }

    // world pixels (interactive & destructible elements)
    world.draw(ctx, camX, camY, this.viewW, this.viewH)

    // entities below player
    drawEntities(ctx, world, this.es, camX, camY)

    // player
    const p = this.player
    const icon = getWeaponIcon(WEAPONS[p.weaponIdx].id)
    const kx = p.x - camX
    const ky = p.y - camY
    const charCfg = ConfigManager.get().getConfig().character

    drawCharacter(ctx, kx, ky, {
      facing: p.facing,
      runPhase: p.runPhase,
      grounded: p.grounded,
      jetOn: p.jetOn && p.jetK > 0.4,
      flipT: p.flipT,
      tumble: p.tumble,
      vy: p.vy,
      aim: p.aim,
      weapon: icon,
      weaponAnchor: icon ? { dx: 4, dy: icon.height / 2 } : null,
      jetK: p.jetK,
      skin: charCfg.skin,
      colors: {
        head: charCfg.headColor,
        body: charCfg.bodyColor,
        accent: charCfg.accentColor,
        outline: charCfg.outlineColor,
        thruster: charCfg.thrusterColor,
      },
    })

    // particles on top
    world.drawParticles(ctx, camX, camY)

    // crosshair (dark outline + white core for visibility on any surface)
    const mx = this.input.aimX - camX
    const my = this.input.aimY - camY
    ctx.lineCap = 'butt'
    for (const pass of [0, 1]) {
      ctx.strokeStyle = pass === 0 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)'
      ctx.lineWidth = pass === 0 ? 4 : 1.6
      ctx.beginPath()
      ctx.moveTo(mx - 10, my)
      ctx.lineTo(mx - 3, my)
      ctx.moveTo(mx + 3, my)
      ctx.lineTo(mx + 10, my)
      ctx.moveTo(mx, my - 10)
      ctx.lineTo(mx, my - 3)
      ctx.moveTo(mx, my + 3)
      ctx.lineTo(mx, my + 10)
      ctx.stroke()
    }

    // muzzle flash
    if (p.flashT > 0 && WEAPONS[p.weaponIdx].kind !== 'wand') {
      const fa = p.aim
      const fx = p.x + Math.cos(fa) * 32 - camX
      const fy = p.y - 34 + Math.sin(fa) * 32 - camY
      ctx.fillStyle = '#fff3a6'
      ctx.beginPath()
      ctx.arc(fx, fy, 7 + Math.random() * 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(fx, fy, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }
}

export const weaponList = WEAPONS
export const weaponIcons = WEAPON_ICONS
export const buildIcon = buildSpriteCanvas
export type { WeaponDef }
