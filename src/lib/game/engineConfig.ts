// Central Game Engine & Studio Configuration
// Powers the "Game Lab" (المعمل), allowing real-time tuning of
// physics, weapons, character skins, sound synthesizer, and visual effects.

export type CharacterSkin = 'stickman' | 'robot' | 'commando' | 'voidMage' | 'custom'

export type TrailEffect = 'none' | 'smoke' | 'sparks' | 'void' | 'rainbow'

export type AudioProfile = 'retro' | 'modern' | 'heavy'

export interface PhysicsConfig {
  runSpeed: number
  airSpeed: number
  groundAccel: number
  airAccel: number
  friction: number
  gravity: number
  jumpVel: number
  flipVel: number
  variableJumpCut: number
  jetThrust: number
  jetMaxRise: number
  autoStepHeight: number // px height to automatically step over (fixes getting stuck!)
  cornerNudge: boolean
  coyoteTime: number
  jumpBuffer: number
}

export interface CharacterConfig {
  skin: CharacterSkin
  name: string
  headColor: string
  bodyColor: string
  accentColor: string
  outlineColor: string
  thrusterColor: string
  scale: number
  trail: TrailEffect
}

export interface WeaponTune {
  damageMul: number
  speedMul: number
  cooldownMul: number
  blastMul: number
  shakeMul: number
}

export interface AudioConfig {
  masterVolume: number
  sfxVolume: number
  bassBoost: boolean
  pitchVariance: number
  profile: AudioProfile
  muted: boolean
}

export interface VisualConfig {
  particleDensity: 'low' | 'medium' | 'high' | 'ultra'
  maxDebris: number
  crtScanlines: boolean
  retroGlow: boolean
  showFps: boolean
  fireSpreadRate: number
  shakeMultiplier: number
  milestonePopups: boolean
  hdVectorMode: boolean // HD Vector rendering for Arabic words, English letters & SVG graphics
}

export interface EngineConfig {
  physics: PhysicsConfig
  character: CharacterConfig
  weapons: Record<string, WeaponTune>
  audio: AudioConfig
  visual: VisualConfig
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
  runSpeed: 275,
  airSpeed: 330,
  groundAccel: 3800,
  airAccel: 2600,
  friction: 1650,
  gravity: 2950,
  jumpVel: 960,
  flipVel: 820,
  variableJumpCut: 0.5,
  jetThrust: 4800,
  jetMaxRise: 540,
  autoStepHeight: 6, // 6px autostep allows smooth traversal over destroyed tiles and ragged text
  cornerNudge: true,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
}

export const PHYSICS_PRESETS: Record<string, { name: string; desc: string; config: PhysicsConfig }> = {
  arcade: {
    name: 'النمط المتوازن (أصلي متقن)',
    desc: 'حركة رشيقة ومريحة مستوحاة من اللعبة الأصلية مع إصلاح التعثر وسلاسة القفز',
    config: { ...DEFAULT_PHYSICS },
  },
  hyper: {
    name: 'النينجا الخارق (Hyper Agile)',
    desc: 'سرعة جري فائقة، قفزات عملاقة، وتحكم هوائي حاد للمحترفين',
    config: {
      ...DEFAULT_PHYSICS,
      runSpeed: 420,
      airSpeed: 460,
      groundAccel: 6000,
      friction: 2400,
      jumpVel: 1150,
      flipVel: 950,
      jetThrust: 6200,
      jetMaxRise: 700,
      autoStepHeight: 8,
    },
  },
  moon: {
    name: 'جاذبية القمر (Low Gravity)',
    desc: 'قفزات عائمة عالية جداً، وتحليق هادئ بطيء في الهواء',
    config: {
      ...DEFAULT_PHYSICS,
      runSpeed: 250,
      gravity: 1200,
      jumpVel: 750,
      flipVel: 650,
      jetThrust: 2800,
      jetMaxRise: 420,
      variableJumpCut: 0.7,
    },
  },
  heavy: {
    name: 'المدرع الثقيل (Heavy Juggernaut)',
    desc: 'وزن ثقيل، سقوط سريع، وتدمير متماسك',
    config: {
      ...DEFAULT_PHYSICS,
      runSpeed: 220,
      airSpeed: 240,
      gravity: 4200,
      jumpVel: 1050,
      flipVel: 750,
      friction: 2600,
      jetThrust: 5400,
      jetMaxRise: 450,
    },
  },
}

export const CHARACTER_SKINS: Record<CharacterSkin, { nameAr: string; nameEn: string; desc: string; defaults: CharacterConfig }> = {
  stickman: {
    nameAr: 'جَحْدَر (الفارس الصغير)',
    nameEn: 'Jahdar the Intrepid',
    desc: 'البطل الأسطوري الصغير ذو العزيمة الفولاذية، خفيف وسريع ولا يقف في وجهه أي موقع عملاق',
    defaults: {
      skin: 'stickman',
      name: 'جَحْدَر (الفارس الصغير)',
      headColor: '#f59e0b',
      bodyColor: '#d97706',
      accentColor: '#fbbf24',
      outlineColor: '#16121f',
      thrusterColor: '#ffd23d',
      scale: 1,
      trail: 'sparks',
    },
  },
  robot: {
    nameAr: 'الروبوت المدمر 9000',
    nameEn: 'Destructor Bot-9000',
    desc: 'آلة عسكرية متطورة مع عيون سيان متوهجة وجسم مدرع وشرارات إلكترونية',
    defaults: {
      skin: 'robot',
      name: 'الروبوت المدمر 9000',
      headColor: '#38bdf8',
      bodyColor: '#475569',
      accentColor: '#0ea5e9',
      outlineColor: '#0f172a',
      thrusterColor: '#38bdf8',
      scale: 1.05,
      trail: 'sparks',
    },
  },
  commando: {
    nameAr: 'مغوار البكسل العسكري',
    nameEn: 'Pixel Commando',
    desc: 'مقاتل قوات خاصة مزود بخوذة قتالية ودروع تكتيكية',
    defaults: {
      skin: 'commando',
      name: 'مغوار البكسل العسكري',
      headColor: '#84cc16',
      bodyColor: '#3f6212',
      accentColor: '#eab308',
      outlineColor: '#142006',
      thrusterColor: '#f97316',
      scale: 1,
      trail: 'smoke',
    },
  },
  voidMage: {
    nameAr: 'ساحر الفراغ والظلال',
    nameEn: 'Void Specter',
    desc: 'كيان غامض يرتدي رداءً بنفسجياً ويطلق مقذوفات الطاقة المظلمة',
    defaults: {
      skin: 'voidMage',
      name: 'ساحر الفراغ والظلال',
      headColor: '#c084fc',
      bodyColor: '#581c87',
      accentColor: '#a855f7',
      outlineColor: '#1e0b36',
      thrusterColor: '#d8b4fe',
      scale: 1,
      trail: 'void',
    },
  },
  custom: {
    nameAr: 'بطل البكسل المخصص',
    nameEn: 'Custom Pixel Hero',
    desc: 'خصّص الألوان والشخصية بنفسك عبر أدوات المعمل',
    defaults: {
      skin: 'custom',
      name: 'بطل البكسل المخصص',
      headColor: '#ec4899',
      bodyColor: '#06b6d4',
      accentColor: '#facc15',
      outlineColor: '#18181b',
      thrusterColor: '#f43f5e',
      scale: 1,
      trail: 'rainbow',
    },
  },
}

export function getDefaultEngineConfig(): EngineConfig {
  const defaultWeaponTune: WeaponTune = {
    damageMul: 1.0,
    speedMul: 1.0,
    cooldownMul: 1.0,
    blastMul: 1.0,
    shakeMul: 1.0,
  }

  const weapons: Record<string, WeaponTune> = {
    pistol: { ...defaultWeaponTune },
    smg: { ...defaultWeaponTune },
    shotgun: { ...defaultWeaponTune },
    launcher: { ...defaultWeaponTune },
    railgun: { ...defaultWeaponTune },
    flamer: { ...defaultWeaponTune },
    overkill: { ...defaultWeaponTune },
    drone: { ...defaultWeaponTune },
    neutron: { ...defaultWeaponTune },
    wand: { ...defaultWeaponTune },
    grenade: { ...defaultWeaponTune },
  }

  return {
    physics: { ...DEFAULT_PHYSICS },
    character: { ...CHARACTER_SKINS.stickman.defaults },
    weapons,
    audio: {
      masterVolume: 0.85,
      sfxVolume: 1.0,
      bassBoost: true,
      pitchVariance: 0.05,
      profile: 'retro',
      muted: false,
    },
    visual: {
      particleDensity: 'high',
      maxDebris: 320,
      crtScanlines: false,
      retroGlow: true,
      showFps: false,
      fireSpreadRate: 1.0,
      shakeMultiplier: 1.0,
      milestonePopups: true,
      hdVectorMode: true,
    },
  }
}

const STORAGE_KEY = 'vapor_destroy_engine_config_v1'

export class ConfigManager {
  private static instance: ConfigManager | null = null
  private config: EngineConfig = getDefaultEngineConfig()
  private listeners = new Set<(cfg: EngineConfig) => void>()

  private constructor() {
    this.loadFromStorage()
  }

  static get(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  getConfig(): EngineConfig {
    return this.config
  }

  subscribe(fn: (cfg: EngineConfig) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.config)
      } catch {
        /* noop */
      }
    }
  }

  updatePhysics(partial: Partial<PhysicsConfig>) {
    this.config.physics = { ...this.config.physics, ...partial }
    this.saveToStorage()
    this.notify()
  }

  applyPhysicsPreset(presetKey: string) {
    const preset = PHYSICS_PRESETS[presetKey]
    if (preset) {
      this.config.physics = { ...preset.config }
      this.saveToStorage()
      this.notify()
    }
  }

  updateCharacter(partial: Partial<CharacterConfig>) {
    this.config.character = { ...this.config.character, ...partial }
    this.saveToStorage()
    this.notify()
  }

  selectCharacterSkin(skin: CharacterSkin) {
    const def = CHARACTER_SKINS[skin]
    if (def) {
      this.config.character = { ...def.defaults }
      this.saveToStorage()
      this.notify()
    }
  }

  updateWeapon(id: string, partial: Partial<WeaponTune>) {
    if (!this.config.weapons[id]) {
      this.config.weapons[id] = { damageMul: 1, speedMul: 1, cooldownMul: 1, blastMul: 1, shakeMul: 1 }
    }
    this.config.weapons[id] = { ...this.config.weapons[id], ...partial }
    this.saveToStorage()
    this.notify()
  }

  resetWeapon(id: string) {
    this.config.weapons[id] = { damageMul: 1, speedMul: 1, cooldownMul: 1, blastMul: 1, shakeMul: 1 }
    this.saveToStorage()
    this.notify()
  }

  updateAudio(partial: Partial<AudioConfig>) {
    this.config.audio = { ...this.config.audio, ...partial }
    this.saveToStorage()
    this.notify()
  }

  updateVisual(partial: Partial<VisualConfig>) {
    this.config.visual = { ...this.config.visual, ...partial }
    this.saveToStorage()
    this.notify()
  }

  resetToDefaults() {
    this.config = getDefaultEngineConfig()
    this.saveToStorage()
    this.notify()
  }

  exportJson(): string {
    return JSON.stringify(this.config, null, 2)
  }

  importJson(json: string): boolean {
    try {
      const parsed = JSON.parse(json) as EngineConfig
      if (parsed && parsed.physics && parsed.character) {
        this.config = {
          ...getDefaultEngineConfig(),
          ...parsed,
          physics: { ...DEFAULT_PHYSICS, ...(parsed.physics || {}) },
          character: { ...CHARACTER_SKINS.stickman.defaults, ...(parsed.character || {}) },
        }
        this.saveToStorage()
        this.notify()
        return true
      }
    } catch {
      /* ignore */
    }
    return false
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as EngineConfig
        this.config = {
          ...getDefaultEngineConfig(),
          ...parsed,
          physics: { ...DEFAULT_PHYSICS, ...(parsed.physics || {}) },
          character: { ...CHARACTER_SKINS.stickman.defaults, ...(parsed.character || {}) },
          weapons: { ...getDefaultEngineConfig().weapons, ...(parsed.weapons || {}) },
          audio: { ...getDefaultEngineConfig().audio, ...(parsed.audio || {}) },
          visual: { ...getDefaultEngineConfig().visual, ...(parsed.visual || {}) },
        }
      }
    } catch {
      /* ignore */
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config))
    } catch {
      /* ignore */
    }
  }
}
