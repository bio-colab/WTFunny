// Pixel-map sprites, hand-crafted to match the original game's art style.
// Each sprite is an array of strings; each char maps to a palette color ('.' = transparent).

export type PixelSprite = {
  w: number
  h: number
  data: string[]
  palette: Record<string, string>
  anchor?: { x: number; y: number }
}

// Shared Damascus & Cyber-Arabesque Palette
export const METAL: Record<string, string> = {
  // Outline & deep shadows
  k: '#07090e', // obsidian black / deep shadow
  o: '#161922', // crisp dark border outline
  d: '#273549', // deep damascus steel
  m: '#475569', // damascus steel midtone
  l: '#8295ab', // tempered light steel
  h: '#cbd5e1', // steel highlight
  w: '#ffffff', // pure white specular / bright core

  // Imperial Gold & Brass (Damascus filigree)
  Y: '#b45309', // deep antique bronze/gold
  y: '#f59e0b', // imperial amber gold
  G: '#fbbf24', // radiant bright gold
  g: '#fef08a', // pale gold specular highlight

  // Wood & Grip Inlay
  b: '#451a03', // dark teak wood
  B: '#78350f', // rich cedar / walnut
  i: '#b45309', // polished wood highlight
  W: '#fef3c7', // ivory inlay

  // Plasma & Cyan Arc Energy
  C: '#0369a1', // deep plasma blue
  c: '#0ea5e9', // vivid cyan conduit
  a: '#38bdf8', // bright plasma glow
  e: '#a5f3fc', // glowing plasma white-cyan

  // Fire, Ruby & Napalm
  R: '#991b1b', // dark ruby / deep red
  r: '#ef4444', // vibrant red laser / danger
  f: '#f97316', // blazing orange flame
  F: '#fde047', // incandescent yellow fire

  // Astral & Cosmic Void Purple
  P: '#581c87', // deep void purple
  p: '#9333ea', // cosmic amethyst
  v: '#c084fc', // ethereal purple glow
  V: '#f3e8ff', // astral starlight violet

  // Tactical Emerald / Radar
  E: '#064e3b', // deep emerald shadow
  T: '#059669', // tactical green
  t: '#10b981', // bright emerald HUD
  s: '#6ee7b7', // radar blip / mint glow
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

const W = (rows: string[], anchor?: { x: number; y: number }): PixelSprite => ({
  w: rows[0].length,
  h: rows.length,
  data: rows,
  palette: METAL,
  anchor,
})

// ---- Upgraded Weapons (side view, pointing RIGHT, muzzle at right edge) ----

// 1. Damascus Sovereign Sidearm (مسدس جحدر المذهب)
export const SPR_PISTOL = W(
  [
    '......................gg',
    '............ooo.......yy',
    '.ooyyoooooooddmoo.....oo',
    'oodGGyyyydmmmmmmhlhhoooo',
    'odddddddmmmmmmmmhhhhhdoo',
    '.oodddddddddddddddddddo.',
    '...oBBo...oddoo...ooo...',
    '...oBWBo...oGo..........',
    '...oBBBo...oo...........',
    '...oBbBo................',
    '...oooo.................',
  ],
  { x: 5, y: 7 }
)

// 2. Al-Yamama Tactical PDW (رشاش اليمامة التكتيكي)
export const SPR_SMG = W(
  [
    '..................aaaaaa..',
    '.......ooooooooooodcccccc.',
    '.oodddodmmmmmmmmmmddddddoo',
    'odmmmmdmmhhhhhllmmddddkdoo',
    'ommmmGyyyyyyyyyymmmmkkhdoo',
    'oodddddddddddddddddddkkoo.',
    '..oBBo..oddo..oddoo.......',
    '..oBBo...oGo...oddo.......',
    '..oBBo...oo.....oddo......',
    '...oBo...........oyyo.....',
    '...oo.............oo......',
  ],
  { x: 5, y: 7 }
)

// 3. Rub' al-Khali Trench Sweeper (صاعقة الربع الخالي)
export const SPR_SHOTGUN = W(
  [
    '............................',
    '......................GyyG..',
    '.oobbbo...............oooooo',
    'obBBBBbooooooooooooooodhhhhh',
    'obbBBBddmmmmmmmmGyydmmdhhhhh',
    '.obbBBdmmmmmmmmmGyydmmdllllh',
    '..obooddddooooodBBBBBBdooooo',
    '....oddo..oGoo..oBBBBBbo....',
    '....oddo..oo....obBBBBbo....',
    '.....oo..........oooooo.....',
  ],
  { x: 6, y: 7 }
)

// 4. Fort-Breaker Heavy Rocket Pod (قاصم الحصون)
export const SPR_LAUNCHER = W(
  [
    '.........................oo...',
    '.....ooooo..............oRRo..',
    '...ooyyyyyoo............oRRRRo',
    '..oyyGGGGGyyoodddddddddooRRRRo',
    '.odmmmmmmmmmmddddddddddddyGyyG',
    'ommmmhhhhhmmmmmmdttddmmmmooo..',
    'ommmmhhhhhmmmmmmdssddmmmmoo...',
    'odmmmmmmmmmmdddddddddddddoo...',
    '.oooddddddddooooddddddooo.....',
    '...oddo..oddo....oddoo........',
    '...oBBo...oGo.....oddo........',
    '...oBBo...oo......oddo........',
    '....oo.............oo.........',
  ],
  { x: 6, y: 9 }
)

// 5. Farabi Electromagnetic Accelerator (مدفع ريل البلازما الكهرومغناطيسي)
export const SPR_RAILGUN = W(
  [
    '.........oooooo.................',
    '........ocaaaeeo................',
    '..oooooooddddddooooooooooooooooo',
    '.oyyyyGhooddddddmmmmmmmmhhhhhhhh',
    'oyGwwwyhoocaaoocaaoocaaoeeeeeeee',
    'oyGwwwyhoocaaoocaaoocaaoeeeeeeee',
    '.oyyyyGhooddddddmmmmmmmmhhhhhhhh',
    '..oooddddddddddddddddddddooooooo',
    '....oddo..oddo...oddoo..........',
    '....oBBo...oGo....oddo..........',
    '....oBBo...oo.....oddo..........',
    '.....oo............oo...........',
  ],
  { x: 7, y: 9 }
)

// 6. Dragon's Breath Napalm Projector (أنفاس التنين)
export const SPR_FLAMER = W(
  [
    '......................oo....',
    '....ooooo...........oFrfo...',
    '...oyyyyyoo........oFFffro..',
    '..oyyGffGyyoooddddoofffrfo..',
    '.oyGffwwffyommmmmmoffffro...',
    '.oyyGffGyyoohhhhhhmooooo....',
    '..oyyyyyoodmmmmmmmdddddo....',
    '...oooooodmmmmmmmmddkddo....',
    '....oddooodddddddddddkdo....',
    '....oBBo..oddo....oodddo....',
    '....oBBo...oGo......oddo....',
    '....oBBo...oo.......oddo....',
    '.....oo..............oo.....',
  ],
  { x: 6, y: 10 }
)

// 7. The Calamity / MIRV Cluster Cannon (داهية الحشود)
export const SPR_OVERKILL = W(
  [
    '..............................',
    '....ooooooo...................',
    '...oyyGGGyyo.....ooooooo......',
    '..oyGvvvvGyyooddddddddddo.....',
    '..oyvwwwwvyommmmmmmmmmmmmo....',
    '.oyGvwwwwvGyommmmmmmmmmmmmo...',
    '.oyGvvvvvvGyomhhllllhhhhhmmo..',
    '..oyyGGGGyyommmddkddkddmmmmo..',
    '...ooooooooodddddddddddddddo..',
    '.....oddo...oddo.....odddddo..',
    '.....oBBo....oGo......oddooo..',
    '.....oBBo....oo.......oddo....',
    '.....oBBo.............oddo....',
    '......oo...............oo.....',
  ],
  { x: 7, y: 10 }
)

// 8. Falcon-7 Cyber Controller (وحدة تحكم صقر-7)
export const SPR_REMOTE = W(
  [
    '.o....................',
    '.oa...................',
    '.oo..oooooooooooo.....',
    '.oo.oyGGGGGGGGGGyo....',
    '.oo.oGddddddddddGo....',
    '.oo.oGdTtssssTtGGo....',
    '.o..oGdtsswwsstddGo...',
    '....oGdtsssssstddGo...',
    '....oGdTtssssTtGGo....',
    '....oGddddddddddGo....',
    '....oyGGGradrGyyyo....',
    '....oooooooooooooo....',
    '.....oBBo....oBBo.....',
    '......oo......oo......',
  ],
  { x: 6, y: 10 }
)

// 9. PSR B0531+21 Pulsar Singularity Cannon (النجم النابض)
export const SPR_NEUTRON = W(
  [
    '..........oooo..................',
    '.......ooyyGGyyo................',
    '.....ooyGvaaaevyyo..............',
    '....oyGvaawwwwaevGyooddddddooo..',
    '...oyvaawwwwwwwaavGommmmmmmhhhoo',
    '..oyGawwweeeeeewwaGyomhhhhhhwwwe',
    '..oyGawweecceewwaGyommhhhhhhwwwe',
    '..oyGawwweeeeeewwaGyomhhhhhhwwwe',
    '...oyvaawwwwwwwaavGommmmmmmhhhoo',
    '....oyGvaawwwwaevGyooddddddooo..',
    '.....ooyGvaaaevyyo..oddo........',
    '.......ooyyGGyyo...oBBo.........',
    '..........oooo.....oBBo.........',
    '....................oo..........',
  ],
  { x: 7, y: 9 }
)

// 10. Scepter of Córdoba (صولجان قرطبة الأندلسي)
export const SPR_WAND = W(
  [
    '.......................ooo..',
    '.....................ooygyoo',
    '....................oyGfwwfG',
    '...................oyGfrwwrf',
    '..................oyyGfwwfGy',
    '.................oyyyGGggGGy',
    '...............ooooyyGGyyoo.',
    '............ooodBByyoooo....',
    '.........ooodBBbByGoo.......',
    '......ooodBBbByGooo.........',
    '....ooodBBbByGoo............',
    '..oyygbBBbByoo..............',
    '..oygBoooooo................',
    '...oo.......................',
  ],
  { x: 6, y: 9 }
)

// Tactical Projectiles & Equipment
export const SPR_GRENADE = W(
  [
    '...oooo...',
    '..oGyyGo..',
    '.oddrrddo.',
    'oddddddddo',
    'odmGyGdmdo',
    'odmGyGdmdo',
    'oddddddddo',
    '.oddddddo.',
    '..oddddo..',
    '...oooo...',
  ],
  { x: 4, y: 5 }
)

export const SPR_ROCKET = W(
  [
    '......oooo......',
    '....ooRRRRoo....',
    '..ooRRwwwwRRoo..',
    '.oRRRRwwwwRRRRo.',
    '.oyyyywwwwyyyyo.',
    '..oooddddddooo..',
    '....ofFFFffo....',
    '.....offffo.....',
  ],
  { x: 4, y: 4 }
)

export const SPR_MIRV = W(
  [
    '.....oooooo.....',
    '....oRRRRRRo....',
    '...oRRwwwwRRo...',
    '..oRRRRwwRRRRo..',
    '.oRRRRRRRRRRRRo.',
    '.oyyGyyyyyyGyyo.',
    '.ommmmmmmmmmmmo.',
    '..omddkddkddmo..',
    '..oyyyyyyyyyyo..',
    '...ofFFFFffo....',
    '....offfffo.....',
  ],
  { x: 4, y: 5 }
)

export const SPR_BOMBLET = W(
  [
    '...oooo...',
    '..oCCCCo..',
    '.oCaeeaCo.',
    '.oaeeweaCo',
    '.oaeeweaCo',
    '.oCaeeaCo.',
    '..oCCCCo..',
    '...oooo...',
  ],
  { x: 4, y: 4 }
)

export const SPR_PARACHUTE = W(
  [
    '.....oooooooo.....',
    '...ooRRyyyGGyoo...',
    '..oRRyyyyyyyyyRRo.',
    '.oRRyyyywwwwyyyRRo',
    '.oRyywwwwwwwwyyyRo',
    '..oyywwwwwwwwyyo..',
    '...oyywwwwwwyyo...',
    '....oyywwwwyyo....',
    '.....oyyyyyo......',
    '......oyyyy.......',
    '.......oyy........',
    '........oo........',
  ],
  { x: 8, y: 11 }
)

export const SPR_JETPACK = W(
  [
    '....oooooo....',
    '..oommGGmmoo..',
    '.omddyyyydmmo.',
    '.omdllmmllmmo.',
    '.omdllmmllmmo.',
    '.omddyyyydmmo.',
    '..oommGGmmoo..',
    '..oodkddkddoo.',
    '..oFrroorrFo..',
    '..oFFroorFFo..',
    '...ff....ff...',
  ],
  { x: 6, y: 5 }
)

export const SPR_DRONE = W(
  [
    '.....o.....oooo.....o.......',
    '...oMMoooMMMMMMMMoooMMMo....',
    '..ommmmmmmmmmmmmmmmmmmmo....',
    '.ommmmyymmmmmmmmmmyymmmmo...',
    'ommmhhllCccccccccCoolhhmmmo.',
    'ommmmo..ocaaeewwaaco..ommmo.',
    '.oddo...ocaaeewwaaco...oddo.',
    '........ommccccmmmo.........',
    '.........oodddddoo..........',
    '...........o...o............',
    '............................',
  ],
  { x: 13, y: 5 }
)

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
  squash?: number // landing squash & stretch (0..~0.12)
  switchT?: number // weapon-swap progress 0..1
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
  const sq = opts.squash ?? 0
  ctx.scale(opts.facing * s * (1 + sq), s * (1 - sq))

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
    const idle = opts.runPhase === 0 // standing: legs used to overlap into a single line
    const sp = idle ? 3.5 : 0
    const p = Math.sin(opts.runPhase * Math.PI * 2)
    const p2 = Math.sin(opts.runPhase * Math.PI * 2 + Math.PI)
    // Leg 1
    ctx.beginPath()
    ctx.moveTo(0, hipY)
    ctx.lineTo(p * 8 + sp, hipY + 10)
    ctx.lineTo(p * 11 + sp, 0)
    ctx.stroke()
    // Foot/Boot
    if (skin === 'commando' || skin === 'robot') {
      ctx.fillStyle = colors.outline
      ctx.fillRect(p * 11 + sp - 3, -3, 8, 3.5)
    }

    // Leg 2
    ctx.beginPath()
    ctx.moveTo(0, hipY)
    ctx.lineTo(p2 * 8 - sp, hipY + 10)
    ctx.lineTo(p2 * 11 - sp, 0)
    ctx.stroke()
    if (skin === 'commando' || skin === 'robot') {
      ctx.fillStyle = colors.outline
      ctx.fillRect(p2 * 11 - sp - 3, -3, 8, 3.5)
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
  ctx.translate(0, -34) // Shoulder joint
  const aimLocal = opts.facing === 1 ? opts.aim : Math.PI - opts.aim
  ctx.rotate(aimLocal + (1 - Math.min(1, opts.switchT ?? 1)) * 0.9) // weapon raise on swap

  const handX = 9
  const handY = 1

  // Back arm / shoulder (layered behind weapon)
  ctx.strokeStyle = colors.accent
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.moveTo(-1, 2)
  ctx.lineTo(handX - 2, handY + 1)
  ctx.stroke()

  // Weapon sprite (pointing forward along barrel, grip locked into hand)
  if (opts.weapon && opts.weaponAnchor) {
    const wa = opts.weaponAnchor
    ctx.save()
    ctx.translate(handX, handY)
    ctx.drawImage(opts.weapon, -wa.dx, -wa.dy)
    ctx.restore()
  }

  // Forearm holding weapon grip
  ctx.strokeStyle = colors.body
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(handX, handY)
  ctx.stroke()

  // Hand fist over grip
  ctx.fillStyle = colors.accent || colors.body
  ctx.beginPath()
  ctx.arc(handX, handY, 2.5, 0, Math.PI * 2)
  ctx.fill()

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

