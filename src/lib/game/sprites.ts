// Pixel-map sprites, hand-crafted to match the original game's art style.
// Each sprite is an array of strings; each char maps to a palette color ('.' = transparent).

export type PixelSprite = {
  w: number
  h: number
  data: string[]
  palette: Record<string, string>
}

// Shared palette (metal blues + cyan highlights + dark outline, like the original icons)
const METAL: Record<string, string> = {
  o: '#16121f', // outline
  d: '#2c3352', // dark metal
  m: '#46538c', // mid metal
  l: '#6b7bc4', // light metal
  h: '#9fb0e8', // highlight
  c: '#7ff3ff', // cyan glow
  C: '#1ab8e6', // deep cyan
  y: '#ffd23d', // yellow
  r: '#ff3d8b', // pink/red accent
  R: '#c9281f', // red
  g: '#7cff6b', // green
  w: '#ededed', // white
  b: '#5b4023', // wood/brown
  B: '#8a6531', // light wood
  k: '#0d0b12', // near black
  p: '#c05ae0', // purple
  P: '#7a2bd0', // deep purple
  s: '#a0a0a0', // gray
}

export function buildSpriteCanvas(spr: PixelSprite, scale = 1): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = spr.w * scale
  cv.height = spr.h * scale
  const ctx = cv.getContext('2d')!
  for (let y = 0; y < spr.h; y++) {
    const row = spr.data[y]
    for (let x = 0; x < spr.w; x++) {
      const ch = row[x]
      if (!ch || ch === '.') continue
      const col = spr.palette[ch]
      if (!col) continue
      ctx.fillStyle = col
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }
  }
  return cv
}

// module-level cache (client-only usage; call from effects/ref callbacks, never during SSR render)
const _spriteCache = new Map<string, HTMLCanvasElement>()
export function getCachedSprite(key: string, scale = 2): HTMLCanvasElement | null {
  const k = `${key}@${scale}`
  let c = _spriteCache.get(k)
  if (!c) {
    const spr = WEAPON_ICONS[key]
    if (!spr) return null
    c = buildSpriteCanvas(spr, scale)
    _spriteCache.set(k, c)
  }
  return c
}

// paint a sprite into an existing canvas element (SSR-safe: call from ref callbacks)
export function paintSpriteInto(el: HTMLCanvasElement, key: string, scale = 2) {
  const c = getCachedSprite(key, scale)
  if (!c) return
  el.width = c.width
  el.height = c.height
  el.getContext('2d')?.drawImage(c, 0, 0)
}

const W = (rows: string[]): PixelSprite => ({ w: rows[0].length, h: rows.length, data: rows, palette: METAL })

// ---- Weapons (side view, pointing RIGHT, muzzle at right edge) ----

export const SPR_PISTOL = W([
  '..................',
  '..................',
  '..............cc..',
  '.ddddddddddddddd..',
  'ommmmmmmmmmmmmmmo.',
  '.odmmmmmmmmmmdddo.',
  '...odd........oo..',
  '....oddo..........',
  '.....odo..........',
  '.....oo...........',
])

export const SPR_SMG = W([
  '......................',
  '......................',
  '...................cc.',
  '.dddddddddddddddddddo.',
  'ommmmmmmmmmmmmmmmmmmmo',
  '.ommmmmllllmmmmmmmddo.',
  '..oddo..odd..oddo.....',
  '...oddo..oddo.odo.....',
  '....oo....oo..oo......',
])

export const SPR_SHOTGUN = W([
  '..........................',
  '..........................',
  '......................cc..',
  '.bbbb.....................',
  'oBBBBbbbbbbbbbbbbbbbbbbbbo',
  'obbBBmmmllllllllmmmmmdddo.',
  '..obbodddddddddddddddo....',
  '....oddo......oddo........',
  '.....oo........oo.........',
])

export const SPR_LAUNCHER = W([
  '..............................',
  '.....ooooo....................',
  '....oyyyyyo...................',
  '....oyRRRRyo..................',
  '....oyRRRRyooddddddddddddo....',
  '.oooooyyyyommmmmmmmmmmmmmmo...',
  'ommmmmmmmmmmmmmmmmmmmdddho....',
  '.ommmmmmmmooddddddmmddo.......',
  '..oddo..oddo......oddo........',
  '...oo....oo........oo.........',
])

export const SPR_RAILGUN = W([
  '..............................',
  '..oooooooo....................',
  '.oyyyyyyyyo...................',
  '.oyCCCCCyooddddddddddddddo....',
  '.oyCcCCCmmmmmmmmmmmmmmmmmo....',
  '.oyCCCCCmmlllccllmmmmmmddo....',
  '.oyyyyyyooddddooodddddo.......',
  '..ooooo.oddo.....oddo.........',
  '.........oo.......oo..........',
])

export const SPR_FLAMER = W([
  '..........................',
  '..................oo......',
  '.....oooooo.....oRRo......',
  '...ooRRRRRRooo.oRRRo......',
  '..oRyyyRRRRRRoRRRRRo......',
  '.oRRyyyRRRRRRRRRRRddo.....',
  '.oRRRRRRRRRRRRRmmmmo......',
  '..oRRRRRRRRRmmmmmo........',
  '...ooddddddmmmoo..........',
  '.....oddo..oddo...........',
  '......oo....oo............',
])

export const SPR_OVERKILL = W([
  '..............................',
  '..............................',
  '...oooooooooo.................',
  '..oyyyyyyyyyyo...oooooooo.....',
  '..oypppppppppyooddddddddo.....',
  '..oyPPppppppPmmmmmmmmmmmmo....',
  '..oyppppppppmmmccccmmmmdo.....',
  '..oyyyyyyyyyoommmmmmmmo.......',
  '...oooooooo.ooddddo...........',
  '............oddo..............',
  '.............oo...............',
])

export const SPR_REMOTE = W([
  '..............',
  '..oooooooooo..',
  '.ommmmmmmmmmo.',
  '.omdgcccgdmo..',
  '.ommmmmmmmmo..',
  '.odmmmmmmmdo..',
  '..oooooooodo..',
  '........odo...',
  '.........o....',
])

export const SPR_NEUTRON = W([
  '..............................',
  '..........ooo.................',
  '.......oooypyo................',
  '......oyyppppyyo..............',
  '.....oyppwwwwppyoddoooo.......',
  '....oyppwccccwppmmmmmmmo......',
  '....oyppwccccwppmmllmmmmo.....',
  '.....oyppwwwwppmmmmmddo.......',
  '......oyyppppyyodddo..........',
  '.......oooypyo.oddo...........',
  '..........ooo...oo............',
])

export const SPR_WAND = W([
  '....................',
  '...............yy...',
  '..............ywwy..',
  '..............ywwy..',
  '...............yy...',
  '..............oo....',
  '.........ooooob.....',
  '...ooooodbbbbbo.....',
  '..oyyyyodbbbo.......',
  '...ooooodbbo........',
  '.........oo.........',
])

export const SPR_GRENADE = W([
  '........',
  '...oo...',
  '..osso..',
  '.osssso.',
  'ossggsso',
  'ossggsso',
  'osssssso',
  '.osssso.',
  '..oooo..',
])

export const SPR_DRONE = W([
  '..........................',
  '.....o.....oo.....o.......',
  '...oMMMoooMMMMoooMMMo.....',
  '..ommmmmmmmmmmmmmmmmmo....',
  '.ommmmcmmmmmmmmmmcmmmmo...',
  'ommmllooCccccccccCoolmmmo.',
  'ommmmo.ommmmmmmmmmo.ommmo.',
  '.oddo..ommccccmmmo..oddo..',
  '........oodddoo...........',
  '..........o..o............',
])

export const SPR_PARACHUTE = W([
  '....oooooooo....',
  '..ooRRyyRRyyoo..',
  '.oRRyyyyyyRRyo..',
  'oRRyyywwyyyRRyo.',
  'oRyywwwwwwyyRo..',
  '.oyywwwwwwyyo...',
  '..oyywwwwyyo....',
  '...oyywwyyo.....',
  '....oyyyyoo.....',
  '.....oyyo.......',
  '......oy........',
])

export const SPR_BOMBLET = W([
  '..oooo..',
  '.oCCCCo.',
  'oCCCCCCo',
  'oCCCCCCo',
  'oCCwwCCo',
  'oCCCCCCo',
  '.oCCCCo.',
  '..oooo..',
])

export const SPR_ROCKET = W([
  '.....oooo...',
  '....oRRRRo..',
  '..ooRRwwRRo.',
  'oRRRRwwRRRRo',
  'oyyyywwyyyyo',
  '..ooRRRRoo..',
  '....oyyo....',
  '.....oo.....',
])

export const SPR_MIRV = W([
  '.....oo.....',
  '....oRRo....',
  '...oRwwRo...',
  '...oRRRRo...',
  '..oRRRRRRo..',
  '..oRwRRwRo..',
  '..oRRRRRRo..',
  '..oyyyyyyo..',
  '...oyyyyyo..',
  '....oyyo....',
  '.....oo.....',
])

export const SPR_JETPACK = W([
  '...oooo...',
  '..ommmmo..',
  '.omddddmo.',
  '.omdllmdo.',
  '.omdllmdo.',
  '.omddddmo.',
  '..ommmmo..',
  '..oRRRRo..',
  '...oRRo...',
  '....oo....',
])

// Weapon registry: pixel icon
export const WEAPON_ICONS: Record<string, PixelSprite> = {
  pistol: SPR_PISTOL,
  smg: SPR_SMG,
  shotgun: SPR_SHOTGUN,
  launcher: SPR_LAUNCHER,
  railgun: SPR_RAILGUN,
  flamer: SPR_FLAMER,
  overkill: SPR_OVERKILL,
  drone: SPR_REMOTE,
  neutron: SPR_NEUTRON,
  wand: SPR_WAND,
  grenade: SPR_GRENADE,
  rocket: SPR_ROCKET,
  mirv: SPR_MIRV,
  bomblet: SPR_BOMBLET,
  parachute: SPR_PARACHUTE,
  jetpack: SPR_JETPACK,
  droneBody: SPR_DRONE,
}

import { CharacterSkin, ConfigManager } from './engineConfig'

export const STICK = {
  body: '#ff8a2a',
  bodyDark: '#f2561d',
  head: '#ff8a2a',
  outline: '#1a1422',
}

export type CharacterDrawOpts = {
  facing: 1 | -1
  runPhase: number
  grounded: boolean
  jetOn: boolean
  flipT: number
  tumble: number
  vy: number
  aim: number
  weapon?: HTMLCanvasElement | null
  weaponAnchor?: { dx: number; dy: number } | null
  jetK: number
  scale?: number
  skin?: CharacterSkin
  colors?: {
    head?: string
    body?: string
    accent?: string
    outline?: string
    thruster?: string
  }
}

// Draw any character archetype (Stickman, Destructor-9000 Robot, Commando, Void Mage, Custom)
export function drawCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, opts: CharacterDrawOpts) {
  const activeChar = ConfigManager.get().getConfig().character
  const skin: CharacterSkin = opts.skin ?? activeChar.skin ?? 'stickman'
  const colors = {
    head: opts.colors?.head ?? activeChar.headColor ?? '#ff8a2a',
    body: opts.colors?.body ?? activeChar.bodyColor ?? '#ff8a2a',
    accent: opts.colors?.accent ?? activeChar.accentColor ?? '#f2561d',
    outline: opts.colors?.outline ?? activeChar.outlineColor ?? '#16121f',
    thruster: opts.colors?.thruster ?? activeChar.thrusterColor ?? '#ffd23d',
  }

  const s = (opts.scale ?? 1) * (activeChar.scale ?? 1)
  ctx.save()
  ctx.translate(x, y)
  if (opts.tumble) ctx.rotate(opts.tumble)
  ctx.scale(opts.facing * s, s)

  ctx.lineCap = 'round'

  const flip = opts.flipT >= 0 ? opts.flipT * Math.PI * 2 : 0
  ctx.save()
  ctx.translate(0, -22)
  ctx.rotate(flip)
  ctx.translate(0, 22)

  const hipY = -22

  // ---- 1. LEGS ----
  ctx.strokeStyle = colors.body
  ctx.lineWidth = skin === 'robot' || skin === 'commando' ? 5.5 : 4.5

  if (opts.grounded && !opts.jetOn) {
    const p = Math.sin(opts.runPhase * Math.PI * 2)
    const p2 = Math.sin(opts.runPhase * Math.PI * 2 + Math.PI)
    // Leg 1
    ctx.beginPath()
    ctx.moveTo(0, hipY)
    ctx.lineTo(p * 8, hipY + 10)
    ctx.lineTo(p * 11, 0)
    ctx.stroke()
    // Foot/Boot
    if (skin === 'commando' || skin === 'robot') {
      ctx.fillStyle = colors.outline
      ctx.fillRect(p * 11 - 3, -3, 8, 3.5)
    }

    // Leg 2
    ctx.beginPath()
    ctx.moveTo(0, hipY)
    ctx.lineTo(p2 * 8, hipY + 10)
    ctx.lineTo(p2 * 11, 0)
    ctx.stroke()
    if (skin === 'commando' || skin === 'robot') {
      ctx.fillStyle = colors.outline
      ctx.fillRect(p2 * 11 - 3, -3, 8, 3.5)
    }
  } else if (opts.jetOn) {
    ctx.beginPath()
    ctx.moveTo(0, hipY)
    ctx.lineTo(-5, hipY + 11)
    ctx.lineTo(-9, hipY + 20)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, hipY)
    ctx.lineTo(-2, hipY + 12)
    ctx.lineTo(-6, hipY + 22)
    ctx.stroke()
  } else {
    const dy = opts.vy < 0 ? -2 : 3
    ctx.beginPath()
    ctx.moveTo(0, hipY)
    ctx.lineTo(6, hipY + 9 + dy)
    ctx.lineTo(10, hipY + 16 + dy)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, hipY)
    ctx.lineTo(-4, hipY + 10 + dy)
    ctx.lineTo(-7, hipY + 15 + dy)
    ctx.stroke()
  }

  // ---- 2. TORSO / BODY ----
  if (skin === 'robot') {
    // Plated metal cyber-chassis
    ctx.fillStyle = colors.body
    ctx.strokeStyle = colors.outline
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(-6, -38, 12, 16, 2)
    ctx.fill()
    ctx.stroke()
    // Chest core light
    ctx.fillStyle = colors.head
    ctx.fillRect(-3, -34, 6, 4)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-1.5, -33, 3, 2)
  } else if (skin === 'commando') {
    // Tactical armored vest + sash
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(0, hipY)
    ctx.lineTo(0, -38)
    ctx.stroke()
    // Vest
    ctx.fillStyle = colors.body
    ctx.strokeStyle = colors.outline
    ctx.lineWidth = 1
    ctx.fillRect(-5, -36, 10, 12)
    ctx.strokeRect(-5, -36, 10, 12)
    // Ammo belt
    ctx.fillStyle = colors.accent
    ctx.fillRect(-5, -31, 10, 2.5)
  } else if (skin === 'voidMage') {
    // Flowing mystic robe
    ctx.fillStyle = colors.body
    ctx.beginPath()
    ctx.moveTo(-7, hipY + 2)
    ctx.lineTo(-2, -38)
    ctx.lineTo(2, -38)
    ctx.lineTo(7, hipY + 2)
    ctx.closePath()
    ctx.fill()
    // Glowing rune line
    ctx.strokeStyle = colors.accent
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, -36)
    ctx.lineTo(0, hipY)
    ctx.stroke()
  } else {
    // Classic Stickman / Custom
    ctx.lineWidth = 4.5
    ctx.beginPath()
    ctx.moveTo(0, hipY)
    ctx.lineTo(0, -38)
    ctx.stroke()
  }

  // ---- 3. JETPACK ON BACK ----
  if (opts.jetOn || opts.jetK > 0) {
    ctx.fillStyle = skin === 'robot' ? '#334155' : '#46538c'
    ctx.fillRect(-9, -36, 7, 14)
    ctx.fillStyle = skin === 'robot' ? '#0f172a' : '#2c3352'
    ctx.fillRect(-8, -35, 5, 5)

    if (opts.jetOn) {
      const f = 6 + Math.random() * 8
      ctx.fillStyle = colors.thruster
      ctx.beginPath()
      ctx.moveTo(-8, -22)
      ctx.lineTo(-5.5, -22 + f)
      ctx.lineTo(-3, -22)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(-7.4, -22)
      ctx.lineTo(-5.5, -22 + f * 0.5)
      ctx.lineTo(-3.6, -22)
      ctx.fill()
    }
  }

  // ---- 4. HEAD & VISOR ----
  if (skin === 'robot') {
    // Robotic square head with antenna & visor
    ctx.fillStyle = colors.body
    ctx.strokeStyle = colors.outline
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(-6.5, -51, 13, 11, 2)
    ctx.fill()
    ctx.stroke()
    // Antenna
    ctx.strokeStyle = colors.outline
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, -51)
    ctx.lineTo(0, -56)
    ctx.stroke()
    ctx.fillStyle = colors.head
    ctx.beginPath()
    ctx.arc(0, -57, 2, 0, Math.PI * 2)
    ctx.fill()
    // Glowing cyan visor
    ctx.fillStyle = colors.head
    ctx.fillRect(-4.5, -47, 9, 3.5)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, -46.5, 4, 2)
  } else if (skin === 'commando') {
    // Combat Helmet + Visor
    ctx.fillStyle = colors.head
    ctx.beginPath()
    ctx.arc(0, -45, 7.5, 0, Math.PI * 2)
    ctx.fill()
    // Helmet rim
    ctx.fillStyle = colors.body
    ctx.beginPath()
    ctx.arc(0, -46.5, 8.2, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-8.2, -47.5, 16.4, 3)
    // Goggles / visor
    ctx.fillStyle = colors.accent
    ctx.fillRect(-3, -45, 6, 2.5)
  } else if (skin === 'voidMage') {
    // Mystic Hood with glowing eyes
    ctx.fillStyle = colors.body
    ctx.beginPath()
    ctx.moveTo(0, -53)
    ctx.lineTo(-8, -43)
    ctx.lineTo(8, -43)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, -45, 6.5, 0, Math.PI * 2)
    ctx.fill()
    // Dark face interior
    ctx.fillStyle = colors.outline
    ctx.beginPath()
    ctx.arc(0, -44.5, 4.5, 0, Math.PI * 2)
    ctx.fill()
    // Glowing eyes
    ctx.fillStyle = colors.head
    ctx.fillRect(-2, -45, 1.8, 1.8)
    ctx.fillRect(1, -45, 1.8, 1.8)
  } else {
    // Classic Stickman / Custom
    ctx.fillStyle = colors.head
    ctx.beginPath()
    ctx.arc(0, -45, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore() // End flip transform

  // ---- 5. ARMS & WEAPON ----
  ctx.save()
  ctx.translate(0, -34)
  const aimLocal = opts.facing === 1 ? opts.aim : Math.PI - opts.aim
  ctx.rotate(aimLocal)

  // Back arm
  ctx.strokeStyle = colors.accent
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(10, 2)
  ctx.stroke()

  // Weapon sprite
  if (opts.weapon && opts.weaponAnchor) {
    const wa = opts.weaponAnchor
    ctx.save()
    ctx.rotate(Math.PI)
    ctx.drawImage(opts.weapon, -wa.dx, -wa.dy)
    ctx.restore()
  }

  // Forearm holding weapon
  ctx.strokeStyle = colors.body
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(11, 1)
  ctx.stroke()

  ctx.restore() // End aim transform
  ctx.restore() // End character transform
}

// Backward-compatible alias
export function drawStickman(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: CharacterDrawOpts
) {
  drawCharacter(ctx, x, y, opts)
}

