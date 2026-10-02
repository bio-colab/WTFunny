// Weapon definitions mirroring the original's exact tuning values,
// plus all projectile logic: bullets, rockets, grenades, MIRV, railgun,
// flamethrower, drone, neutron star, magic wand.

import { World, CELL, packColor } from './world'
import { sound } from './sound'
import { WEAPON_ICONS, buildSpriteCanvas } from './sprites'

export type WeaponDef = {
  id: string
  nameAr: string
  nameEn: string
  kind: 'bullet' | 'rocket' | 'rail' | 'flame' | 'mirv' | 'drone' | 'star' | 'wand'
  cooldown: number
  auto: boolean
  pellets: number
  spread: number
  speed: number
  pierce: number
  damage: number
  push: number
  kick: number
  shake: number
  iconScale: number
}

export const WEAPONS: WeaponDef[] = [
  { id: 'pistol', nameAr: 'مسدس', nameEn: 'Pistol', kind: 'bullet', cooldown: 0.16, auto: false, pellets: 1, spread: 0.012, speed: 2300, pierce: 6, damage: 16, push: 0, kick: 4, shake: 0.12, iconScale: 2 },
  { id: 'smg', nameAr: 'رشاش', nameEn: 'SMG', kind: 'bullet', cooldown: 0.068, auto: true, pellets: 1, spread: 0.07, speed: 2000, pierce: 4, damage: 8, push: 14, kick: 2.6, shake: 0.07, iconScale: 2 },
  { id: 'shotgun', nameAr: 'بندقية خرطوش', nameEn: 'Shotgun', kind: 'bullet', cooldown: 0.62, auto: false, pellets: 10, spread: 0.17, speed: 1750, pierce: 3, damage: 12, push: 230, kick: 7, shake: 0.42, iconScale: 2 },
  { id: 'launcher', nameAr: 'قاذفة صواريخ', nameEn: 'Rocket', kind: 'rocket', cooldown: 0.85, auto: false, pellets: 1, spread: 0, speed: 900, pierce: 0, damage: 0, push: 120, kick: 6, shake: 0.3, iconScale: 2 },
  { id: 'railgun', nameAr: 'مدفع ريل', nameEn: 'Railgun', kind: 'rail', cooldown: 1.1, auto: false, pellets: 1, spread: 0, speed: 0, pierce: 999, damage: 130, push: 260, kick: 9, shake: 0.55, iconScale: 2 },
  { id: 'flamer', nameAr: 'قاذف نار', nameEn: 'Flamethrower', kind: 'flame', cooldown: 0.017, auto: true, pellets: 5, spread: 0.1, speed: 620, pierce: 0, damage: 0, push: 0, kick: 0.5, shake: 0.012, iconScale: 2 },
  { id: 'overkill', nameAr: 'كثير جداً', nameEn: 'Too Much', kind: 'mirv', cooldown: 1.9, auto: false, pellets: 1, spread: 0, speed: 1500, pierce: 0, damage: 0, push: 300, kick: 11, shake: 0.55, iconScale: 2 },
  { id: 'drone', nameAr: 'درون', nameEn: 'Drone', kind: 'drone', cooldown: 0.4, auto: true, pellets: 1, spread: 0.05, speed: 2700, pierce: 5, damage: 16, push: 0, kick: 1.5, shake: 0.02, iconScale: 2 },
  { id: 'neutron', nameAr: 'PSR B0531+21', nameEn: 'PSR B0531+21', kind: 'star', cooldown: 1.6, auto: false, pellets: 1, spread: 0, speed: 1100, pierce: 0, damage: 0, push: 140, kick: 9, shake: 0.3, iconScale: 2 },
  { id: 'wand', nameAr: 'العصا السحرية', nameEn: 'The Magic Wand', kind: 'wand', cooldown: 2.2, auto: false, pellets: 1, spread: 0, speed: 1000, pierce: 0, damage: 0, push: 0, kick: 2, shake: 0.08, iconScale: 2 },
]

export const GRENADE = { cooldown: 0.55, fuse: 1.55, radius: 50, speed: 620 }
export const ROCKET_BLAST = 46
export const BOMBLET_BLAST = 30

export type Bullet = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  pierce: number
  dmg: number
  color: string
  trail: boolean
}

export type Rocket = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  state: 0 | 1 // 0 flying, 1 descending (mirv pod)
  bomblets: number
  chute: boolean
  fuse: number
  smokeT: number
}

export type Grenade = {
  x: number
  y: number
  vx: number
  vy: number
  fuse: number
  rot: number
  vrot: number
}

export type Drone = {
  x: number
  y: number
  vx: number
  vy: number
  battery: number
  maxBattery: number
  state: 0 | 1 | 2 | 3 // 0 flying, 1 diving, 2 dead/gone
  fireT: number
  rampK: number
  lowBeepT: number
}

export type Star = {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  dur: number
  r: number
  maxR: number
  rot: number
}

export type WandCast = {
  x: number
  y: number
  aim: number
  t: number
  charge: number
  fired: boolean
  swept: number
}

export type WeaponEntities = {
  bullets: Bullet[]
  rockets: Rocket[]
  grenades: Grenade[]
  drone: Drone | null
  droneCd: number
  star: Star | null
  wand: WandCast | null
  mirvFlash: number
  flames: { x: number; y: number; vx: number; vy: number; life: number; max: number }[]
}

export function newWeaponEntities(): WeaponEntities {
  return { bullets: [], rockets: [], grenades: [], drone: null, droneCd: 0, star: null, wand: null, mirvFlash: 0, flames: [] }
}

let bulletSeq = 0
export const spawnBullet = (es: WeaponEntities, x: number, y: number, vx: number, vy: number, dmg: number, pierce: number, color = '#ffd23d', trail = true, life = 1.2) => {
  if (es.bullets.length > 400) es.bullets.shift()
  es.bullets.push({ x, y, vx, vy, life, pierce, dmg, color, trail })
  void bulletSeq
}

import { ConfigManager } from './engineConfig'

export function fireWeapon(
  world: World,
  es: WeaponEntities,
  w: WeaponDef,
  x: number,
  y: number,
  aim: number,
  pan: number,
  onShake: (s: number) => void,
  onKick: (vx: number, vy: number) => void,
  onShot: () => void
) {
  onShot()
  const cos = Math.cos(aim)
  const sin = Math.sin(aim)
  const mzX = x + cos * 30
  const mzY = y + sin * 30

  const cfg = ConfigManager.get().getConfig()
  const wTune = cfg.weapons[w.id] || { damageMul: 1, speedMul: 1, cooldownMul: 1, blastMul: 1, shakeMul: 1 }
  const effSpeed = w.speed * (wTune.speedMul ?? 1)
  const effDmg = Math.max(1, Math.round(w.damage * (wTune.damageMul ?? 1)))
  const effShake = w.shake * (wTune.shakeMul ?? 1) * (cfg.visual.shakeMultiplier ?? 1)

  switch (w.kind) {
    case 'bullet': {
      for (let i = 0; i < w.pellets; i++) {
        const a = aim + (Math.random() - 0.5) * w.spread * 2
        const jitter = w.pellets > 1 ? (Math.random() - 0.5) * 120 : 0
        spawnBullet(
          es,
          x + cos * 26,
          y + sin * 26,
          Math.cos(a) * (effSpeed + jitter),
          Math.sin(a) * (effSpeed + jitter),
          effDmg,
          w.pierce,
          w.id === 'drone' ? '#7ff3ff' : '#ffd23d'
        )
      }
      sound.shot(w.id === 'pistol' ? 'pistol' : w.id === 'smg' ? 'smg' : 'shotgun', 1, pan)
      // muzzle flash particles
      for (let i = 0; i < 4; i++) {
        world.spawnParticle({ x: mzX, y: mzY, vx: cos * 300 + (Math.random() - 0.5) * 200, vy: sin * 300 + (Math.random() - 0.5) * 200, life: 0.1, max: 0.1, kind: 'spark', color: '#fff3a6', size: 3 })
      }
      // shell eject
      world.spawnParticle({ x: x + cos * 10, y: y + sin * 10, vx: -cos * 100 + (Math.random() - 0.5) * 60, vy: -260 - Math.random() * 120, life: 1, max: 1, kind: 'shell', color: '#e9b54a', size: 2.5, grav: 1900, rot: Math.random() * 6, vrot: 12 })
      onShake(effShake)
      if (w.push > 0) onKick(-cos * w.push, -sin * w.push * 0.4)
      if (w.kick > 0) onKick(0, 0)
      break
    }
    case 'rocket': {
      es.rockets.push({ x: mzX, y: mzY, vx: cos * effSpeed, vy: sin * effSpeed, life: 3, state: 0, bomblets: 0, chute: false, fuse: 3, smokeT: 0 })
      sound.whoosh(pan)
      onShake(effShake)
      onKick(-cos * w.push * 0.5, -sin * w.push * 0.2)
      break
    }
    case 'rail': {
      // instant piercing beam
      const maxD = 3000
      const step = CELL * 0.8
      let cx = x
      let cy = y
      const hitPts: { x: number; y: number }[] = []
      const carveR = (4.5 + Math.random() * 3) * (wTune.blastMul ?? 1)
      for (let d = 0; d < maxD; d += step) {
        cx += cos * step
        cy += sin * step
        if (cx < 0 || cx > world.W || cy > world.H) break
        if (world.solidAtWorld(cx, cy)) {
          hitPts.push({ x: cx, y: cy })
          world.hitBodyAt(cx, cy, effDmg, cos * 340, sin * 340)
          // carve & blast
          if (hitPts.length % 2 === 1) {
            world.damageCircle(cx, cy, carveR, { debris: true, countAsDestroy: true, impulse: 450 })
            if (Math.random() < 0.12) sound.hit('block', 0.5, pan)
          }
        }
      }
      // beam fx via particles
      for (let d = 0; d < Math.hypot(cx - x, cy - y); d += 14) {
        world.spawnParticle({ x: x + cos * d, y: y + sin * d, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 0.35, max: 0.35, kind: 'spark', color: d % 28 < 14 ? '#7ff3ff' : '#ffffff', size: 4 })
      }
      sound.railCharge(pan)
      setTimeout(() => sound.rail(pan), 90)
      onShake(effShake)
      onKick(-cos * w.push, -160)
      break
    }
    case 'flame': {
      for (let i = 0; i < 3; i++) {
        const a = aim + (Math.random() - 0.5) * w.spread * 2.4
        const sp = effSpeed * (0.65 + Math.random() * 0.7)
        if (es.flames.length < 500) {
          es.flames.push({ x: mzX, y: mzY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + Math.random() * 0.3, max: 0.8 })
        }
      }
      if (Math.random() < 0.24) sound.flameBurst(0.8, pan)
      onShake(effShake)
      break
    }
    case 'mirv': {
      es.rockets.push({ x: mzX, y: mzY, vx: cos * effSpeed * 0.55, vy: sin * effSpeed * 0.55 - 500, life: 4, state: 0, bomblets: 8, chute: false, fuse: 4, smokeT: 0 })
      sound.whoosh(pan)
      onShake(effShake)
      onKick(-cos * w.push * 0.4, -120)
      break
    }
    case 'star': {
      es.star = {
        x: mzX,
        y: mzY,
        vx: cos * effSpeed,
        vy: sin * effSpeed,
        t: 0,
        dur: 2.9,
        r: 20 * (wTune.blastMul ?? 1),
        maxR: 150 * (wTune.blastMul ?? 1),
        rot: 0,
      }
      sound.starHum(pan)
      onShake(effShake)
      onKick(-cos * w.push * 0.3, -80)
      break
    }
    case 'wand': {
      es.wand = { x, y, aim, t: 0, charge: 0.55, fired: false, swept: 0 }
      sound.wandCast(pan)
      break
    }
    case 'drone': {
      break
    }
  }
}

export function throwGrenade(world: World, es: WeaponEntities, x: number, y: number, aim: number, power: number) {
  es.grenades.push({ x, y, vx: Math.cos(aim) * power, vy: Math.sin(aim) * power - 160, fuse: GRENADE.fuse, rot: 0, vrot: (Math.random() - 0.5) * 14 })
  sound.click()
  void world
}

export function explodeAt(world: World, es: WeaponEntities, x: number, y: number, r: number, opts: { fire?: boolean; scorch?: boolean } = {}) {
  world.damageCircle(x, y, r, { debris: true, scorch: opts.scorch ?? true, impulse: 460 + r * 6 })
  world.blastImpulse(x, y, r * 1.9, 520 + r * 8)
  world.explosions++
  // fireball particles
  const N = Math.min(90, Math.floor(r * 1.6))
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = (0.25 + Math.random() * 0.75) * r * 9
    world.spawnParticle({
      x: x + Math.cos(a) * r * 0.3,
      y: y + Math.sin(a) * r * 0.3,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 60,
      life: 0.3 + Math.random() * 0.5,
      max: 0.8,
      kind: 'spark',
      color: ['#ffffff', '#fff3a6', '#ffd23d', '#ff8a2a', '#f2561d'][(Math.random() * 5) | 0],
      size: 3 + Math.random() * 4,
      grav: 300,
    })
  }
  for (let i = 0; i < 14; i++) {
    world.spawnParticle({
      x: x + (Math.random() - 0.5) * r,
      y: y + (Math.random() - 0.5) * r,
      vx: (Math.random() - 0.5) * 120,
      vy: -60 - Math.random() * 140,
      life: 0.8 + Math.random() * 0.9,
      max: 1.7,
      kind: 'smoke',
      color: ['#5b5566', '#3f3a4a', '#2a2633'][(Math.random() * 3) | 0],
      size: 5 + Math.random() * 6,
    })
  }
  // shockwave ring
  world.spawnParticle({ x, y, vx: 0, vy: 0, life: 0.28, max: 0.28, kind: 'glow', color: '#ffffff', size: r * 0.7 })
  if (opts.fire) world.igniteWorld(x, y, r * 0.85)
  const pan = Math.max(-1, Math.min(1, (x / world.W) * 2 - 1))
  sound.boom(Math.min(1.15, 0.55 + r / 90), pan)
}

// ---- per-frame entity stepping; returns true when world was modified ----
export function stepEntities(world: World, es: WeaponEntities, dt: number, playerX: number, playerY: number, aimTo: { x: number; y: number } | null): void {
  // bullets
  for (let i = es.bullets.length - 1; i >= 0; i--) {
    const b = es.bullets[i]
    b.life -= dt
    if (b.life <= 0) {
      es.bullets.splice(i, 1)
      continue
    }
    const steps = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / (CELL * 1.2)))
    let dead = false
    for (let s = 0; s < steps && !dead; s++) {
      b.x += (b.vx * dt) / steps
      b.y += (b.vy * dt) / steps
      if (b.x < -20 || b.x > world.W + 20 || b.y > world.H + 20) {
        dead = true
        break
      }
      if (b.y < 0) continue
      if (b.x >= 0 && b.y >= 0 && b.x < world.W && b.y < world.H && world.solidAtWorld(b.x, b.y)) {
        // Direct kinetic hit on solid body
        world.hitBodyAt(b.x, b.y, b.dmg, b.vx * 0.04, b.vy * 0.04)
        // impact: small clean hole (sparser for a nicer look)
        if (Math.random() < 0.8) {
          world.damageCircle(b.x + (Math.random() - 0.5) * 3, b.y + (Math.random() - 0.5) * 3, 2.2 + b.dmg * 0.12, { debris: true, countAsDestroy: true })
        }
        const pan = Math.max(-1, Math.min(1, (b.x / world.W) * 2 - 1))
        sound.hit(Math.random() < 0.5 ? 'paper' : 'block', 0.8, pan)
        // spark
        for (let k = 0; k < 3; k++) {
          world.spawnParticle({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, life: 0.2, max: 0.2, kind: 'spark', color: '#ffd23d', size: 2 })
        }
        b.pierce--
        if (b.pierce <= 0) dead = true
        else {
          b.vx *= 0.82
          b.vy *= 0.82
        }
      }
    }
    if (dead) es.bullets.splice(i, 1)
    else if (Math.random() < 0.35) {
      world.spawnParticle({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.1, max: 0.1, kind: 'spark', color: b.color, size: 2 })
    }
  }

  // rockets & mirvs
  for (let i = es.rockets.length - 1; i >= 0; i--) {
    const r = es.rockets[i]
    r.life -= dt
    r.smokeT -= dt
    if (r.state === 0) {
      r.vy += 320 * dt // slight arc
      r.x += r.vx * dt
      r.y += r.vy * dt
      if (r.smokeT <= 0) {
        r.smokeT = 0.03
        world.spawnParticle({ x: r.x, y: r.y + 4, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 60, life: 0.5, max: 0.5, kind: 'smoke', color: '#5b5566', size: 3 + Math.random() * 3 })
        world.spawnParticle({ x: r.x, y: r.y + 4, vx: 0, vy: 40, life: 0.12, max: 0.12, kind: 'spark', color: '#ffd23d', size: 3 })
      }
      const hitWorld = r.x < 0 || r.x > world.W || (r.y >= 0 && r.y < world.H && world.mat[world.idx(Math.floor(r.x / CELL), Math.floor(r.y / CELL))] !== 0)
      if (hitWorld || r.y > world.H) {
        if (r.bomblets > 0) {
          // MIRV split: spawn 8 parachute bomblets
          r.state = 1
          r.fuse = 0.1
          sound.split(0)
          for (let k = 0; k < r.bomblets; k++) {
            es.rockets.push({
              x: r.x + (Math.random() - 0.5) * 30,
              y: r.y - Math.random() * 16,
              vx: (Math.random() - 0.5) * 240,
              vy: -60 - Math.random() * 80,
              life: 14,
              state: 1,
              bomblets: 0,
              chute: true,
              fuse: 12,
              smokeT: 0,
            })
          }
          sound.chutePop(0)
          es.rockets.splice(i, 1)
          continue
        }
        explodeAt(world, es, r.x, r.y, ROCKET_BLAST, { scorch: true })
        es.rockets.splice(i, 1)
        continue
      }
      if (r.life <= 0) {
        explodeAt(world, es, r.x, r.y, ROCKET_BLAST)
        es.rockets.splice(i, 1)
      }
    } else {
      // parachute bomblet drift
      r.vy += (240 - r.vy) * 2.4 * dt // terminal fall
      r.vx *= 1 - 0.9 * dt
      r.x += r.vx * dt
      r.y += r.vy * dt
      r.fuse -= dt
      if (Math.random() < 0.1) {
        world.spawnParticle({ x: r.x, y: r.y - 10, vx: 0, vy: 0, life: 0.2, max: 0.2, kind: 'spark', color: '#ffffff', size: 2 })
      }
      const hitWorld = r.x < 0 || r.x > world.W || (r.y >= 0 && r.y < world.H && world.mat[world.idx(Math.floor(r.x / CELL), Math.floor(r.y / CELL))] !== 0)
      if ((hitWorld && r.vy > 0) || r.y > world.H || r.fuse <= 0) {
        explodeAt(world, es, r.x, r.y, BOMBLET_BLAST, { scorch: true })
        es.rockets.splice(i, 1)
      }
    }
  }

  // grenades
  for (let i = es.grenades.length - 1; i >= 0; i--) {
    const g = es.grenades[i]
    g.fuse -= dt
    g.vy += 2000 * dt
    g.x += g.vx * dt
    g.y += g.vy * dt
    g.rot += g.vrot * dt
    // bounce
    if (world.solidAtWorld(g.x, g.y + 6)) {
      g.y -= 2
      g.vy = -Math.abs(g.vy) * 0.45
      g.vx *= 0.75
      g.vrot *= 0.7
      if (Math.abs(g.vy) > 90) sound.hit('block', 0.5, 0)
    }
    if (world.solidAtWorld(g.x + Math.sign(g.vx) * 6, g.y)) {
      g.vx *= -0.5
    }
    if (g.fuse <= 0) {
      explodeAt(world, es, g.x, g.y, GRENADE.radius, { scorch: true })
      es.grenades.splice(i, 1)
    }
  }

  // flames (flamethrower): drift, collide, ignite
  for (let i = es.flames.length - 1; i >= 0; i--) {
    const f = es.flames[i]
    f.life -= dt
    if (f.life <= 0) {
      es.flames.splice(i, 1)
      continue
    }
    f.vx *= 1 - 2.6 * dt
    f.vy = f.vy * (1 - 2.6 * dt) - 150 * dt // slow down + rise
    f.x += f.vx * dt
    f.y += f.vy * dt
    if (f.x < 0 || f.x > world.W || f.y > world.H) {
      es.flames.splice(i, 1)
      continue
    }
    if (f.y >= 0) {
      const gi = world.idx(Math.floor(f.x / CELL), Math.floor(f.y / CELL))
      if (world.mat[gi] !== 0) {
        world.igniteWorld(f.x, f.y, 9)
        for (let k = 0; k < 2; k++) {
          world.spawnParticle({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 90, vy: -60 - Math.random() * 90, life: 0.3, max: 0.3, kind: 'ember', color: ['#ffd23d', '#ff8a2a'][(Math.random() * 2) | 0], size: 2.5 })
        }
        es.flames.splice(i, 1)
      }
    }
  }

  // drone
  if (es.droneCd > 0) es.droneCd -= dt
  const d = es.drone
  if (d && d.state !== 2) {
    if (d.state === 0) {
      // steer toward aim point (or hover ahead of player)
      const tx = aimTo ? aimTo.x : playerX + 120
      const ty = aimTo ? aimTo.y : playerY - 140
      const dx = tx - d.x
      const dy = ty - d.y
      const dist = Math.hypot(dx, dy)
      const accel = 2600
      if (dist > 6) {
        d.vx += (dx / dist) * accel * dt
        d.vy += (dy / dist) * accel * dt
      }
      const drag = dist < 40 ? 3.4 : 1.6
      d.vx -= d.vx * Math.min(1, drag * dt)
      d.vy -= d.vy * Math.min(1, drag * dt)
      const sp = Math.hypot(d.vx, d.vy)
      const maxSp = 480
      if (sp > maxSp) {
        d.vx *= maxSp / sp
        d.vy *= maxSp / sp
      }
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.x = Math.max(20, Math.min(world.W - 20, d.x))
      d.y = Math.max(10, Math.min(world.H - 20, d.y))
      d.battery -= dt
      d.lowBeepT -= dt
      if (d.battery < d.maxBattery * 0.25 && d.lowBeepT <= 0) {
        d.lowBeepT = 0.5
        sound.droneBeep(0)
      }
      if (d.battery <= 0) {
        d.state = 2
        es.droneCd = 5
        world.puffAt(d.x, d.y, 20)
      }
    } else if (d.state === 1) {
      // dive
      d.vy += 4000 * dt
      d.y += d.vy * dt
      d.x += d.vx * dt
      const hitWorld = d.y >= world.H || (d.y >= 0 && world.mat[world.idx(Math.max(0, Math.min(world.GW - 1, Math.floor(d.x / CELL))), Math.max(0, Math.min(world.GH - 1, Math.floor(d.y / CELL))))] !== 0)
      if (hitWorld) {
        explodeAt(world, es, d.x, d.y, 26, { scorch: true })
        d.state = 2
        es.droneCd = 5
      }
      if (d.y > world.H + 40) {
        d.state = 2
        es.droneCd = 5
      }
    }
  }

  // neutron star
  const st = es.star
  if (st) {
    st.t += dt
    st.rot += dt * 3
    if (st.t < 0.5) {
      st.x += st.vx * dt
      st.y += st.vy * dt
      if (st.y < 0) st.y = 0
    }
    st.r = Math.min(st.maxR, 30 + st.t * 110)
    // suck cells
    const cx = Math.floor(st.x / CELL)
    const cy = Math.floor(st.y / CELL)
    const rc = Math.ceil(st.r / CELL)
    const suckRate = 1
    for (let k = 0; k < 160 * suckRate; k++) {
      const a = Math.random() * Math.PI * 2
      const rr = st.r * (0.15 + Math.random() * 0.85)
      const xx = cx + Math.cos(a) * (rr / CELL)
      const yy = cy + Math.sin(a) * (rr / CELL)
      if (xx < 0 || yy < 0 || xx >= world.GW || yy >= world.GH) continue
      const gi = world.idx(xx | 0, yy | 0)
      if (world.mat[gi] === 1) {
        world.mat[gi] = 0
        world.pixBuf[gi] = 0
        world.destroyedCells++
        world.dirty = true
        const own = world.owner[gi]
        if (own >= 0) {
          const el = world.elements.get(own)
          if (el && el.alive) {
            el.lost++
            if (el.kind === 'glyph' && el.lost / Math.max(1, el.cells.length) > 0.25) world.popElement(el, st.x, st.y, 300)
            else if (el.kind !== 'glyph' && el.lost / Math.max(1, el.cells.length) > 0.55) world.popElement(el, st.x, st.y, 300)
          }
        }
        world.owner[gi] = -1
        // spiral-in particle
        const wx = (xx | 0) * CELL
        const wy = (yy | 0) * CELL
        if (Math.random() < 0.3) {
          const dx = st.x - wx
          const dy = st.y - wy
          const dd = Math.hypot(dx, dy) || 1
          world.spawnParticle({
            x: wx,
            y: wy,
            vx: (dx / dd) * 300 + (-dy / dd) * 220,
            vy: (dy / dd) * 300 + (dx / dd) * 220,
            life: 0.5,
            max: 0.5,
            kind: 'spark',
            color: ['#ffffff', '#7ff3ff', '#c05ae0', '#ffd23d'][(Math.random() * 4) | 0],
            size: 2.5,
          })
        }
      }
    }
    // jets (rotating beams)
    if (Math.random() < 0.85) {
      for (const ja of [st.rot, st.rot + Math.PI]) {
        const jx = st.x + Math.cos(ja) * st.r * 2.4
        const jy = st.y + Math.sin(ja) * st.r * 2.4
        world.spawnParticle({ x: st.x + Math.cos(ja) * st.r * 0.4, y: st.y + Math.sin(ja) * st.r * 0.4, vx: (jx - st.x) * 2.4, vy: (jy - st.y) * 2.4, life: 0.18, max: 0.18, kind: 'spark', color: Math.random() < 0.5 ? '#7ff3ff' : '#ffffff', size: 3 })
      }
    }
    if (st.t >= st.dur) {
      explodeAt(world, es, st.x, st.y, 34, { scorch: true })
      es.star = null
    }
  }

  // magic wand
  const wd = es.wand
  if (wd) {
    wd.t += dt
    if (!wd.fired) {
      // ritual circle gathering
      if (Math.random() < 0.7) {
        const a = Math.random() * Math.PI * 2
        const rr = 60 * (1 - wd.t / (wd.charge + 0.2))
        world.spawnParticle({
          x: wd.x + Math.cos(a) * rr,
          y: wd.y + Math.sin(a) * rr,
          vx: -Math.cos(a) * 160,
          vy: -Math.sin(a) * 160,
          life: 0.4,
          max: 0.4,
          kind: 'spark',
          color: ['#ffd23d', '#ff3d8b', '#7ff3ff', '#c05ae0'][(Math.random() * 4) | 0],
          size: 3,
        })
      }
      if (wd.t >= wd.charge) {
        wd.fired = true
        world.explosions++
        sound.wandBlast(1)
      }
    } else {
      // giant rainbow cone sweeping toward aim
      const sweepDur = 1.1
      const k = Math.min(1, wd.swept / sweepDur)
      wd.swept += dt
      const beamLen = 1500
      const half = 0.5 // cone half-angle
      const centerA = wd.aim - half * 0.4 + half * 0.8 * k
      for (let li = 0; li < 4; li++) {
        const a = centerA + (Math.random() - 0.5) * half * 1.6
        const dist = Math.random() * beamLen
        const px = wd.x + Math.cos(a) * dist
        const py = wd.y + Math.sin(a) * dist
        world.damageCircle(px, py, 30 + Math.random() * 26, { debris: true, countAsDestroy: true, full: true })
        if (Math.random() < 0.35) world.igniteWorld(px, py, 30)
      }
      // beam visual particles along cone
      for (let li = 0; li < 26; li++) {
        const a = centerA + (Math.random() - 0.5) * half * 1.4
        const dist = 60 + Math.random() * 1200
        world.spawnParticle({
          x: wd.x + Math.cos(a) * dist,
          y: wd.y + Math.sin(a) * dist,
          vx: (Math.random() - 0.5) * 80,
          vy: (Math.random() - 0.5) * 80,
          life: 0.3 + Math.random() * 0.3,
          max: 0.6,
          kind: 'star',
          color: ['#ffffff', '#ffd23d', '#7ff3ff', '#ff3d8b', '#c05ae0'][(Math.random() * 5) | 0],
          size: 4 + Math.random() * 5,
        })
      }
      // sparkle burst at player wand
      if (Math.random() < 0.5) {
        world.spawnParticle({ x: wd.x + (Math.random() - 0.5) * 60, y: wd.y + (Math.random() - 0.5) * 60, vx: 0, vy: -40, life: 0.5, max: 0.5, kind: 'star', color: '#ffffff', size: 3 })
      }
      if (wd.swept >= sweepDur) {
        es.wand = null
      }
    }
  }
}

export function droneFire(es: WeaponEntities, dmg: number, pierce: number) {
  const d = es.drone
  if (!d || d.state !== 0) return false
  d.fireT -= 1
  void dmg
  void pierce
  return true
}

// icon canvases cache
let iconCache: Map<string, HTMLCanvasElement> | null = null
export function getWeaponIcon(id: string): HTMLCanvasElement | null {
  if (!iconCache) iconCache = new Map()
  let c = iconCache.get(id)
  if (!c) {
    const spr = WEAPON_ICONS[id]
    if (!spr) return null
    c = buildSpriteCanvas(spr, 2)
    iconCache.set(id, c)
  }
  return c
}

// draw helpers for projectiles
export function drawEntities(ctx: CanvasRenderingContext2D, world: World, es: WeaponEntities, camX: number, camY: number) {
  const t = performance.now() / 1000
  // bullets
  ctx.save()
  for (const b of es.bullets) {
    const px = b.x - camX
    const py = b.y - camY
    ctx.fillStyle = b.color
    ctx.fillRect(px - 2, py - 1.5, 5, 3)
    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(px - 4 - b.vx * 0.002, py - 0.5, 4, 1)
    ctx.globalAlpha = 1
  }
  // rockets
  for (const r of es.rockets) {
    const px = r.x - camX
    const py = r.y - camY
    ctx.save()
    ctx.translate(px, py)
    if (r.state === 0) {
      ctx.rotate(Math.atan2(r.vy, r.vx) + Math.PI)
      ctx.fillStyle = '#c9281f'
      ctx.fillRect(-8, -3, 16, 6)
      ctx.fillStyle = '#ffd23d'
      ctx.fillRect(-12, -2, 4, 4)
      ctx.fillStyle = '#ededed'
      ctx.fillRect(4, -2, 4, 4)
    } else {
      // bomblet + parachute
      if (r.chute) {
        ctx.fillStyle = '#c9281f'
        ctx.beginPath()
        ctx.arc(0, -14, 9, Math.PI, 0)
        ctx.fill()
        ctx.strokeStyle = '#ededed'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(-8, -14)
        ctx.lineTo(0, -4)
        ctx.lineTo(8, -14)
        ctx.stroke()
      }
      ctx.fillStyle = '#1ab8e6'
      ctx.fillRect(-3, -4, 6, 8)
      ctx.fillStyle = '#ededed'
      ctx.fillRect(-2, -3, 4, 2)
    }
    ctx.restore()
  }
  // grenades
  for (const g of es.grenades) {
    const px = g.x - camX
    const py = g.y - camY
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(g.rot)
    ctx.fillStyle = '#5b5566'
    ctx.fillRect(-3.5, -4, 7, 8)
    ctx.fillStyle = '#7cff6b'
    ctx.fillRect(-2, -2, 2, 2)
    // blink as fuse ends
    if (g.fuse < 0.6 && Math.floor(t * 12) % 2 === 0) {
      ctx.fillStyle = '#ff3d8b'
      ctx.fillRect(-1, -6, 2, 2)
    }
    ctx.restore()
  }
  // drone
  const d = es.drone
  if (d && d.state !== 2) {
    const px = d.x - camX
    const py = d.y - camY
    ctx.save()
    ctx.translate(px, py)
    const tilt = Math.max(-0.35, Math.min(0.35, d.vx / 1400))
    ctx.rotate(tilt)
    ctx.fillStyle = '#2c3352'
    ctx.fillRect(-9, -3, 18, 6)
    ctx.fillStyle = '#46538c'
    ctx.fillRect(-11, -5, 22, 3)
    ctx.fillStyle = '#7ff3ff'
    ctx.fillRect(-3, -2, 6, 3)
    // rotors
    const rot = Math.sin(t * 40) * 6
    ctx.strokeStyle = '#9fb0e8'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-11 - rot * 0.4, -6)
    ctx.lineTo(-11 + rot * 0.4, -6)
    ctx.moveTo(11 - rot * 0.4, -6)
    ctx.lineTo(11 + rot * 0.4, -6)
    ctx.stroke()
    ctx.restore()
    // battery bar
    if (d.state === 0) {
      const bw = 26
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(px - bw / 2, py + 12, bw, 4)
      ctx.fillStyle = d.battery < d.maxBattery * 0.25 ? '#ff4d4d' : '#7cff6b'
      ctx.fillRect(px - bw / 2 + 0.5, py + 12.5, (bw - 1) * (d.battery / d.maxBattery), 3)
    }
  }
  // flames drawing (flamethrower)
  for (const f of es.flames) {
    const px = f.x - camX
    const py = f.y - camY
    const ft = f.life / f.max
    const r = 3 + (1 - ft) * 6
    ctx.globalAlpha = Math.min(1, ft * 1.6)
    ctx.fillStyle = ft > 0.66 ? '#fff3a6' : ft > 0.4 ? '#ffd23d' : '#ff8a2a'
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()
    if (ft > 0.5) {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(px, py, r * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
  // star
  const st = es.star
  if (st) {
    const px = st.x - camX
    const py = st.y - camY
    const pulse = 1 + Math.sin(t * 14) * 0.06
    // accretion glow
    const grd = ctx.createRadialGradient(px, py, 2, px, py, st.r * pulse)
    grd.addColorStop(0, 'rgba(255,255,255,0.9)')
    grd.addColorStop(0.25, 'rgba(127,243,255,0.45)')
    grd.addColorStop(0.6, 'rgba(122,43,208,0.25)')
    grd.addColorStop(1, 'rgba(122,43,208,0)')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(px, py, st.r * pulse, 0, Math.PI * 2)
    ctx.fill()
    // core
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(px, py, 6 * pulse, 0, Math.PI * 2)
    ctx.fill()
    // jets
    ctx.strokeStyle = 'rgba(127,243,255,0.75)'
    ctx.lineWidth = 2.5
    for (const ja of [st.rot * 2, st.rot * 2 + Math.PI]) {
      ctx.beginPath()
      ctx.moveTo(px + Math.cos(ja) * 8, py + Math.sin(ja) * 8)
      ctx.lineTo(px + Math.cos(ja) * (st.r * 2.6), py + Math.sin(ja) * (st.r * 2.6))
      ctx.stroke()
    }
  }
  // wand ritual + beam
  const wd = es.wand
  if (wd) {
    const px = wd.x - camX
    const py = wd.y - camY
    if (!wd.fired) {
      const k = Math.min(1, wd.t / wd.charge)
      // ritual circle with runes
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(t * 1.6)
      const R = 34 * (1.2 - k * 0.4)
      ctx.strokeStyle = 'rgba(255,210,61,0.9)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, R, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,61,139,0.8)'
      ctx.beginPath()
      ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2)
      ctx.stroke()
      // runes
      ctx.fillStyle = '#7ff3ff'
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const rx = Math.cos(a) * R
        const ry = Math.sin(a) * R
        ctx.fillRect(rx - 2, ry - 2, 4, 4)
      }
      // inner star
      ctx.strokeStyle = 'rgba(192,90,224,0.9)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        const a2 = a + (Math.PI * 2) / 5 * 2
        ctx.moveTo(Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55)
        ctx.lineTo(Math.cos(a2) * R * 0.55, Math.sin(a2) * R * 0.55)
      }
      ctx.stroke()
      ctx.restore()
    } else {
      // rainbow cone beam
      const k = Math.min(1, wd.swept / 1.1)
      const centerA = wd.aim - 0.2 + 0.4 * k
      ctx.save()
      ctx.translate(px, py)
      const colors = ['#ffffff', '#ffd23d', '#ff8a2a', '#ff3d8b', '#c05ae0', '#7ff3ff']
      for (let i = 0; i < colors.length; i++) {
        const a = centerA + (i / colors.length - 0.5) * 0.55
        const grd = ctx.createLinearGradient(0, 0, Math.cos(a) * 1200, Math.sin(a) * 1200)
        grd.addColorStop(0, colors[i])
        grd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.strokeStyle = grd
        ctx.globalAlpha = 0.5
        ctx.lineWidth = 14 + Math.sin(t * 30 + i) * 4
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(a) * 1200, Math.sin(a) * 1200)
        ctx.stroke()
      }
      ctx.restore()
      ctx.globalAlpha = 1
      // bright core flash
      const grd2 = ctx.createRadialGradient(px, py, 2, px, py, 90)
      grd2.addColorStop(0, 'rgba(255,255,255,0.9)')
      grd2.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grd2
      ctx.beginPath()
      ctx.arc(px, py, 90, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
  void world
  void packColor
}
