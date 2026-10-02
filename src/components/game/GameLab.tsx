'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ConfigManager,
  EngineConfig,
  CharacterSkin,
  CHARACTER_SKINS,
  PHYSICS_PRESETS,
  DEFAULT_PHYSICS,
} from '@/lib/game/engineConfig'
import { WEAPONS } from '@/lib/game/weapons'
import { drawCharacter, WEAPON_ICONS, paintSpriteInto } from '@/lib/game/sprites'
import { sound } from '@/lib/game/sound'

type LabTab = 'characters' | 'weapons' | 'physics' | 'audio' | 'visuals' | 'maps'

interface GameLabProps {
  open: boolean
  onClose: () => void
  onPlayMap?: (url: string) => void
}

export default function GameLab({ open, onClose, onPlayMap }: GameLabProps) {
  const [tab, setTab] = useState<LabTab>('characters')
  const [cfg, setCfg] = useState<EngineConfig>(() => ConfigManager.get().getConfig())
  const [selectedWeapon, setSelectedWeapon] = useState<string>('smg')
  const [jsonExport, setJsonExport] = useState<string>('')
  const [jsonImportError, setJsonImportError] = useState<string>('')
  const [statusMsg, setStatusMsg] = useState<string>('')

  // Character preview canvas
  const charCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const charAnimRef = useRef<number>(0)
  const animTimeRef = useRef<number>(0)
  const [charPose, setCharPose] = useState<'idle' | 'run' | 'jump' | 'flip' | 'jet'>('run')

  // Target sandbox canvas for weapons lab
  const targetCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const targetHitsRef = useRef<{ x: number; y: number; r: number; color: string; life: number }[]>([])

  useEffect(() => {
    const unsub = ConfigManager.get().subscribe((newCfg) => {
      setCfg({ ...newCfg })
    })
    return unsub
  }, [])

  const flashStatus = (msg: string) => {
    setStatusMsg(msg)
    sound.labBeep(true)
    setTimeout(() => setStatusMsg(''), 2200)
  }

  // Animate character preview in 60fps
  useEffect(() => {
    if (!open || tab !== 'characters') return
    const cv = charCanvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      animTimeRef.current += dt

      ctx.clearRect(0, 0, cv.width, cv.height)
      // Background grid
      ctx.fillStyle = '#18181b'
      ctx.fillRect(0, 0, cv.width, cv.height)
      ctx.strokeStyle = '#27272a'
      ctx.lineWidth = 1
      for (let x = 0; x < cv.width; x += 16) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, cv.height)
        ctx.stroke()
      }
      for (let y = 0; y < cv.height; y += 16) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(cv.width, y)
        ctx.stroke()
      }

      // Ground platform line
      const groundY = cv.height - 24
      ctx.strokeStyle = '#3f3f46'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(20, groundY)
      ctx.lineTo(cv.width - 20, groundY)
      ctx.stroke()

      const t = animTimeRef.current
      const isRunning = charPose === 'run'
      const isJumping = charPose === 'jump'
      const isFlipping = charPose === 'flip'
      const isJet = charPose === 'jet'

      let renderY = groundY
      let vy = 0
      let flipT = -1

      if (isJumping) {
        renderY = groundY - 24 - Math.sin(t * 3) * 20
        vy = -Math.cos(t * 3) * 300
      } else if (isFlipping) {
        renderY = groundY - 30
        flipT = (t * 1.5) % 1
      } else if (isJet) {
        renderY = groundY - 36 + Math.sin(t * 4) * 6
      }

      const runPhase = isRunning ? (t * 2.2) % 1 : 0
      const currentWeaponSpr = WEAPON_ICONS[selectedWeapon] ? cv : null

      drawCharacter(ctx, cv.width / 2, renderY, {
        facing: 1,
        runPhase,
        grounded: charPose === 'idle' || charPose === 'run',
        jetOn: isJet,
        flipT,
        tumble: 0,
        vy,
        aim: 0,
        weapon: currentWeaponSpr,
        weaponAnchor: { dx: 4, dy: 8 },
        jetK: isJet ? 1 : 0,
        scale: 1.4,
        skin: cfg.character.skin,
        colors: {
          head: cfg.character.headColor,
          body: cfg.character.bodyColor,
          accent: cfg.character.accentColor,
          outline: cfg.character.outlineColor,
          thruster: cfg.character.thrusterColor,
        },
      })

      charAnimRef.current = requestAnimationFrame(loop)
    }

    charAnimRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(charAnimRef.current)
  }, [open, tab, charPose, cfg.character, selectedWeapon])

  // Mini Firing Range Sandbox
  useEffect(() => {
    if (!open || tab !== 'weapons') return
    const cv = targetCanvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now

      ctx.fillStyle = '#09090b'
      ctx.fillRect(0, 0, cv.width, cv.height)

      // Target wall
      const wallX = cv.width - 50
      ctx.fillStyle = '#3f3f46'
      ctx.fillRect(wallX, 20, 30, cv.height - 40)
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(wallX + 4, cv.height / 2 - 20, 22, 40)
      ctx.fillStyle = '#fef08a'
      ctx.fillRect(wallX + 8, cv.height / 2 - 10, 14, 20)

      // Hits
      for (let i = targetHitsRef.current.length - 1; i >= 0; i--) {
        const h = targetHitsRef.current[i]
        h.life -= dt
        if (h.life <= 0) {
          targetHitsRef.current.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = Math.min(1, h.life / 0.5)
        ctx.fillStyle = h.color
        ctx.beginPath()
        ctx.arc(h.x, h.y, h.r * (1 + (1 - h.life / 1.5) * 0.4), 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      ctx.fillStyle = '#a1a1aa'
      ctx.font = '12px Tahoma, sans-serif'
      ctx.fillText('انقر هنا لاختبار السلاح على الهدف 🎯', 16, 26)

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [open, tab])

  const shootTarget = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = targetCanvasRef.current
    if (!cv) return
    const rect = cv.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const w = WEAPONS.find((item) => item.id === selectedWeapon) || WEAPONS[1]
    const wTune = cfg.weapons[selectedWeapon] || { blastMul: 1, damageMul: 1 }
    const r = Math.max(8, (w.kind === 'rocket' ? 24 : w.kind === 'rail' ? 14 : 10) * (wTune.blastMul ?? 1))
    const col = selectedWeapon === 'flamer' ? '#f97316' : selectedWeapon === 'railgun' ? '#38bdf8' : '#fbbf24'

    targetHitsRef.current.push({ x, y, r, color: col, life: 1.5 })
    sound.shot(w.id === 'shotgun' ? 'shotgun' : w.id === 'pistol' ? 'pistol' : 'smg', 1, 0)
  }

  if (!open) return null

  const activeWeaponDef = WEAPONS.find((w) => w.id === selectedWeapon) || WEAPONS[0]
  const activeWeaponTune = cfg.weapons[selectedWeapon] || {
    damageMul: 1,
    speedMul: 1,
    cooldownMul: 1,
    blastMul: 1,
    shakeMul: 1,
  }

  return (
    <div className="dw-lab-overlay" role="dialog" aria-label="معمل محرك اللعبة" dir="rtl">
      <div className="dw-lab-win">
        {/* Header */}
        <div className="dw-lab-head">
          <div className="dw-lab-title">
            <span className="icon">🔬</span>
            <span className="name">معمل محرك اللعبة — ENGINE STUDIO & LAB</span>
            <span className="badge">SINGLE-PLAYER EDITION</span>
          </div>
          <button className="dw-lab-close" onClick={onClose} aria-label="إغلاق المعمل" type="button">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="dw-lab-tabs">
          <button
            className={`dw-lab-tab ${tab === 'characters' ? 'active' : ''}`}
            onClick={() => { setTab('characters'); sound.labBeep() }}
            type="button"
          >
            🏃 معمل الشخصيات
          </button>
          <button
            className={`dw-lab-tab ${tab === 'weapons' ? 'active' : ''}`}
            onClick={() => { setTab('weapons'); sound.labBeep() }}
            type="button"
          >
            ⚡ معمل الأسلحة
          </button>
          <button
            className={`dw-lab-tab ${tab === 'physics' ? 'active' : ''}`}
            onClick={() => { setTab('physics'); sound.labBeep() }}
            type="button"
          >
            🏃 معمل الفيزياء والحركة
          </button>
          <button
            className={`dw-lab-tab ${tab === 'audio' ? 'active' : ''}`}
            onClick={() => { setTab('audio'); sound.labBeep() }}
            type="button"
          >
            🔊 معمل الصوتيات
          </button>
          <button
            className={`dw-lab-tab ${tab === 'visuals' ? 'active' : ''}`}
            onClick={() => { setTab('visuals'); sound.labBeep() }}
            type="button"
          >
            🎨 معمل المؤثرات والرسوم
          </button>
          <button
            className={`dw-lab-tab ${tab === 'maps' ? 'active' : ''}`}
            onClick={() => { setTab('maps'); sound.labBeep() }}
            type="button"
          >
            🗺️ المستويات والتصدير
          </button>
        </div>

        {statusMsg && <div className="dw-lab-status">{statusMsg}</div>}

        {/* Body Content */}
        <div className="dw-lab-body">
          {/* ================= 1. CHARACTERS TAB ================= */}
          {tab === 'characters' && (
            <div className="dw-lab-grid">
              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">اختر هوية وشخصية البطل</h3>
                <div className="dw-lab-skin-list">
                  {(Object.keys(CHARACTER_SKINS) as CharacterSkin[]).map((skinKey) => {
                    const skin = CHARACTER_SKINS[skinKey]
                    const isSelected = cfg.character.skin === skinKey
                    return (
                      <button
                        key={skinKey}
                        type="button"
                        className={`dw-lab-skin-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          ConfigManager.get().selectCharacterSkin(skinKey)
                          flashStatus(`تم اختيار: ${skin.nameAr}`)
                        }}
                      >
                        <div className="dw-lab-skin-info">
                          <span className="title">{skin.nameAr}</span>
                          <span className="sub">{skin.nameEn}</span>
                          <p className="desc">{skin.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <h3 className="dw-lab-h3" style={{ marginTop: 16 }}>
                  تخصيص الألوان والملامح
                </h3>
                <div className="dw-lab-color-grid">
                  <label className="dw-lab-color-item">
                    <span>لون الرأس / القناع</span>
                    <input
                      type="color"
                      value={cfg.character.headColor}
                      onChange={(e) => ConfigManager.get().updateCharacter({ headColor: e.target.value })}
                    />
                  </label>
                  <label className="dw-lab-color-item">
                    <span>لون الجسم / الزي</span>
                    <input
                      type="color"
                      value={cfg.character.bodyColor}
                      onChange={(e) => ConfigManager.get().updateCharacter({ bodyColor: e.target.value })}
                    />
                  </label>
                  <label className="dw-lab-color-item">
                    <span>لون الدروع والتفاصيل</span>
                    <input
                      type="color"
                      value={cfg.character.accentColor}
                      onChange={(e) => ConfigManager.get().updateCharacter({ accentColor: e.target.value })}
                    />
                  </label>
                  <label className="dw-lab-color-item">
                    <span>لهب الجت-باك النفاث</span>
                    <input
                      type="color"
                      value={cfg.character.thrusterColor}
                      onChange={(e) => ConfigManager.get().updateCharacter({ thrusterColor: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              {/* Character Preview */}
              <div className="dw-lab-col preview-col">
                <h3 className="dw-lab-h3">معاينة حية للحركة (Live 60 FPS)</h3>
                <canvas ref={charCanvasRef} width={340} height={200} className="dw-lab-char-canvas" />

                <div className="dw-lab-pose-bar">
                  {(['run', 'jump', 'flip', 'jet', 'idle'] as const).map((pose) => (
                    <button
                      key={pose}
                      type="button"
                      className={`dw-lab-btn-sm ${charPose === pose ? 'active' : ''}`}
                      onClick={() => {
                        setCharPose(pose)
                        sound.labBeep()
                      }}
                    >
                      {pose === 'run'
                        ? '🏃 جري'
                        : pose === 'jump'
                        ? '🦘 قفز'
                        : pose === 'flip'
                        ? '🔄 شقلبة'
                        : pose === 'jet'
                        ? '🚀 جت-باك'
                        : '🧍 وقوف'}
                    </button>
                  ))}
                </div>

                <div className="dw-lab-trail-pick">
                  <label>أثر الحركة (Trail):</label>
                  <select
                    value={cfg.character.trail}
                    onChange={(e) => ConfigManager.get().updateCharacter({ trail: e.target.value as any })}
                    className="dw-lab-select"
                  >
                    <option value="none">بدون أثر</option>
                    <option value="sparks">شرارات طاقة</option>
                    <option value="smoke">دخان كثيف</option>
                    <option value="void">أثير الفراغ البنفسجي</option>
                    <option value="rainbow">قوس قزح نيون</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. WEAPONS TAB ================= */}
          {tab === 'weapons' && (
            <div className="dw-lab-grid">
              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">اختر السلاح لضبط خصائصه</h3>
                <div className="dw-lab-weapon-strip">
                  {WEAPONS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      className={`dw-lab-weapon-chip ${selectedWeapon === w.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedWeapon(w.id)
                        sound.switch(0)
                      }}
                    >
                      <canvas
                        ref={(el) => {
                          if (el) paintSpriteInto(el, w.id, 2)
                        }}
                      />
                      <span>{w.nameAr}</span>
                    </button>
                  ))}
                </div>

                <div className="dw-lab-weapon-editor">
                  <h4 className="dw-lab-h4">
                    خصائص {activeWeaponDef.nameAr} ({activeWeaponDef.nameEn})
                  </h4>

                  <div className="dw-lab-slider-row">
                    <label>
                      مضاعف الضرر ({activeWeaponTune.damageMul.toFixed(1)}x)
                      <input
                        type="range"
                        min="0.5"
                        max="4.0"
                        step="0.1"
                        value={activeWeaponTune.damageMul}
                        onChange={(e) =>
                          ConfigManager.get().updateWeapon(selectedWeapon, { damageMul: parseFloat(e.target.value) })
                        }
                      />
                    </label>
                  </div>

                  <div className="dw-lab-slider-row">
                    <label>
                      سرعة الإطلاق والتبريد ({activeWeaponTune.cooldownMul.toFixed(2)}x)
                      <input
                        type="range"
                        min="0.2"
                        max="2.5"
                        step="0.05"
                        value={activeWeaponTune.cooldownMul}
                        onChange={(e) =>
                          ConfigManager.get().updateWeapon(selectedWeapon, { cooldownMul: parseFloat(e.target.value) })
                        }
                      />
                    </label>
                  </div>

                  <div className="dw-lab-slider-row">
                    <label>
                      سرعة المقذوف ({activeWeaponTune.speedMul.toFixed(1)}x)
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={activeWeaponTune.speedMul}
                        onChange={(e) =>
                          ConfigManager.get().updateWeapon(selectedWeapon, { speedMul: parseFloat(e.target.value) })
                        }
                      />
                    </label>
                  </div>

                  <div className="dw-lab-slider-row">
                    <label>
                      نطاق وقوة الانفجار ({activeWeaponTune.blastMul.toFixed(1)}x)
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={activeWeaponTune.blastMul}
                        onChange={(e) =>
                          ConfigManager.get().updateWeapon(selectedWeapon, { blastMul: parseFloat(e.target.value) })
                        }
                      />
                    </label>
                  </div>

                  <div className="dw-lab-slider-row">
                    <label>
                      الارتداد واهتزاز الشاشة ({activeWeaponTune.shakeMul.toFixed(1)}x)
                      <input
                        type="range"
                        min="0"
                        max="3.0"
                        step="0.1"
                        value={activeWeaponTune.shakeMul}
                        onChange={(e) =>
                          ConfigManager.get().updateWeapon(selectedWeapon, { shakeMul: parseFloat(e.target.value) })
                        }
                      />
                    </label>
                  </div>

                  <button
                    className="dw-lab-btn-sm"
                    type="button"
                    onClick={() => {
                      ConfigManager.get().resetWeapon(selectedWeapon)
                      flashStatus(`تمت استعادة إعدادات ${activeWeaponDef.nameAr}`)
                    }}
                  >
                    🔄 استعادة الإعدادات الأصلية للسلاح
                  </button>
                </div>
              </div>

              {/* Firing Range Sandbox */}
              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">حقل الرماية التجريبي (Mini Firing Range)</h3>
                <canvas
                  ref={targetCanvasRef}
                  width={340}
                  height={320}
                  className="dw-lab-target-canvas"
                  onClick={shootTarget}
                />
              </div>
            </div>
          )}

          {/* ================= 3. PHYSICS TAB ================= */}
          {tab === 'physics' && (
            <div className="dw-lab-grid">
              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">أنماط الحركة الجاهزة (Presets)</h3>
                <div className="dw-lab-presets-grid">
                  {Object.entries(PHYSICS_PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      type="button"
                      className="dw-lab-preset-card"
                      onClick={() => {
                        ConfigManager.get().applyPhysicsPreset(key)
                        flashStatus(`تم تطبيق نمط: ${p.name}`)
                      }}
                    >
                      <div className="name">{p.name}</div>
                      <div className="desc">{p.desc}</div>
                    </button>
                  ))}
                </div>

                <h3 className="dw-lab-h3" style={{ marginTop: 16 }}>
                  محاذاة ودقة الحركة (مخصصة)
                </h3>

                <div className="dw-lab-slider-row">
                  <label>
                    سرعة الجري الأرضية ({cfg.physics.runSpeed} px/s)
                    <input
                      type="range"
                      min="160"
                      max="550"
                      step="10"
                      value={cfg.physics.runSpeed}
                      onChange={(e) => ConfigManager.get().updatePhysics({ runSpeed: parseInt(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="dw-lab-slider-row">
                  <label>
                    ارتفاع مساعدة تخطي العتبات (Autostep Ledge) ({cfg.physics.autoStepHeight} px)
                    <span className="dw-lab-tip">يمنع التعثر والتوقف عند المرور فوق البكسلات المكسورة والحروف!</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={cfg.physics.autoStepHeight}
                      onChange={(e) => ConfigManager.get().updatePhysics({ autoStepHeight: parseInt(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="dw-lab-slider-row">
                  <label>
                    قوة القفز الأساسية ({cfg.physics.jumpVel} px/s)
                    <input
                      type="range"
                      min="600"
                      max="1400"
                      step="20"
                      value={cfg.physics.jumpVel}
                      onChange={(e) => ConfigManager.get().updatePhysics({ jumpVel: parseInt(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="dw-lab-slider-row">
                  <label>
                    قوة الشقلبة الهوائية (Flip Vel) ({cfg.physics.flipVel} px/s)
                    <input
                      type="range"
                      min="500"
                      max="1200"
                      step="20"
                      value={cfg.physics.flipVel}
                      onChange={(e) => ConfigManager.get().updatePhysics({ flipVel: parseInt(e.target.value) })}
                    />
                  </label>
                </div>
              </div>

              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">الجاذبية والتحليق بالجت-باك</h3>

                <div className="dw-lab-slider-row">
                  <label>
                    قوة الجاذبية ({cfg.physics.gravity} px/s²)
                    <input
                      type="range"
                      min="1000"
                      max="4800"
                      step="100"
                      value={cfg.physics.gravity}
                      onChange={(e) => ConfigManager.get().updatePhysics({ gravity: parseInt(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="dw-lab-slider-row">
                  <label>
                    دفع الجت-باك النفاث (Jet Thrust) ({cfg.physics.jetThrust} px/s²)
                    <input
                      type="range"
                      min="2000"
                      max="7500"
                      step="100"
                      value={cfg.physics.jetThrust}
                      onChange={(e) => ConfigManager.get().updatePhysics({ jetThrust: parseInt(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="dw-lab-slider-row">
                  <label>
                    قطع القفز عند الإفلات السريع (Variable Jump Cut) (
                    {(cfg.physics.variableJumpCut * 100).toFixed(0)}%)
                    <span className="dw-lab-tip">يسمح بقفزات قصيرة عند الضغط الخفيف، وقفزات كاملة عند الاستمرار.</span>
                    <input
                      type="range"
                      min="0.2"
                      max="0.9"
                      step="0.05"
                      value={cfg.physics.variableJumpCut}
                      onChange={(e) =>
                        ConfigManager.get().updatePhysics({ variableJumpCut: parseFloat(e.target.value) })
                      }
                    />
                  </label>
                </div>

                <div className="dw-lab-slider-row">
                  <label>
                    الاحتكاك الأرضي (Ground Friction) ({cfg.physics.friction})
                    <input
                      type="range"
                      min="800"
                      max="3200"
                      step="50"
                      value={cfg.physics.friction}
                      onChange={(e) => ConfigManager.get().updatePhysics({ friction: parseInt(e.target.value) })}
                    />
                  </label>
                </div>

                <button
                  className="dw-lab-btn"
                  type="button"
                  onClick={() => {
                    ConfigManager.get().updatePhysics({ ...DEFAULT_PHYSICS })
                    flashStatus('تمت استعادة إعدادات الفيزياء الافتراضية')
                  }}
                >
                  🔄 استعادة الضبط المتوازن الأصلي
                </button>
              </div>
            </div>
          )}

          {/* ================= 4. AUDIO TAB ================= */}
          {tab === 'audio' && (
            <div className="dw-lab-grid">
              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">إعدادات محرك الصوت التخليقي (WebAudio Synthesizer)</h3>

                <div className="dw-lab-slider-row">
                  <label>
                    الصوت العام (Master Volume) ({Math.round(cfg.audio.masterVolume * 100)}%)
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={cfg.audio.masterVolume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        ConfigManager.get().updateAudio({ masterVolume: val })
                        sound.ensure()
                      }}
                    />
                  </label>
                </div>

                <div className="dw-lab-toggle-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={cfg.audio.bassBoost}
                      onChange={(e) => ConfigManager.get().updateAudio({ bassBoost: e.target.checked })}
                    />
                    <span>مضخم الترددات المنخفضة للانفجارات (Sub-Bass Booster)</span>
                  </label>
                </div>

                <div className="dw-lab-slider-row">
                  <label>
                    تنويع نغمات الطلقات (Pitch Variance) ({Math.round(cfg.audio.pitchVariance * 100)}%)
                    <input
                      type="range"
                      min="0"
                      max="0.2"
                      step="0.01"
                      value={cfg.audio.pitchVariance}
                      onChange={(e) => ConfigManager.get().updateAudio({ pitchVariance: parseFloat(e.target.value) })}
                    />
                  </label>
                </div>
              </div>

              {/* Soundboard test */}
              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">لوحة اختبار المؤثرات الصوتية (Sound Test Board)</h3>
                <p className="dw-lab-tip">انقر على أي مؤثر لاختبار توليده التخليقي الفوري عبر رقاقة الصوت:</p>

                <div className="dw-lab-soundboard">
                  <button type="button" onClick={() => sound.shot('pistol', 1, 0)}>🔫 مسدس</button>
                  <button type="button" onClick={() => sound.shot('smg', 1, 0)}>💥 رشاش</button>
                  <button type="button" onClick={() => sound.shot('shotgun', 1, 0)}>💣 بندقية خرطوش</button>
                  <button type="button" onClick={() => sound.whoosh(0)}>🚀 هدير صاروخ</button>
                  <button type="button" onClick={() => sound.boom(1.2, 0)}>💥 انفجار ضخم</button>
                  <button type="button" onClick={() => sound.rail(0)}>⚡ مدفع ريل</button>
                  <button type="button" onClick={() => sound.flameBurst(1, 0)}>🔥 قاذف اللهب</button>
                  <button type="button" onClick={() => sound.droneBeep(0)}>🤖 إشارات الدرون</button>
                  <button type="button" onClick={() => sound.starHum(0)}>🌌 النجم النيوتروني</button>
                  <button type="button" onClick={() => sound.wandCast(0)}>✨ تعويذة العصا</button>
                  <button type="button" onClick={() => sound.jump(0)}>🦘 قفز</button>
                  <button type="button" onClick={() => sound.flip(0)}>🔄 شقلبة هوائية</button>
                  <button type="button" onClick={() => sound.milestone()}>🏆 نغمة إنجاز 50%</button>
                  <button type="button" onClick={() => sound.complete()}>🎉 رنة إكمال التدمير</button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. VISUALS & FX TAB ================= */}
          {tab === 'visuals' && (
            <div className="dw-lab-grid">
              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">المؤثرات البصرية وفيزياء الجزيئات</h3>

                <div className="dw-lab-slider-row">
                  <label>
                    اهتزاز الشاشة عند الانفجارات ({Math.round(cfg.visual.shakeMultiplier * 100)}%)
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={cfg.visual.shakeMultiplier}
                      onChange={(e) =>
                        ConfigManager.get().updateVisual({ shakeMultiplier: parseFloat(e.target.value) })
                      }
                    />
                  </label>
                </div>

                <div className="dw-lab-slider-row">
                  <label>
                    كثافة الجزيئات والشظايا (Particle Density):
                    <select
                      value={cfg.visual.particleDensity}
                      onChange={(e) => ConfigManager.get().updateVisual({ particleDensity: e.target.value as any })}
                      className="dw-lab-select"
                    >
                      <option value="low">منخفض (أداء فائق على الأجهزة الضعيفة)</option>
                      <option value="medium">متوسط (متوازن)</option>
                      <option value="high">مرتفع (غني بالشظايا والدخان)</option>
                      <option value="ultra">فائق التدمير (Ultra Cinematic)</option>
                    </select>
                  </label>
                </div>

                <div className="dw-lab-slider-row">
                  <label>
                    سرعة انتشار النيران واحتراق البكسلات ({cfg.visual.fireSpreadRate.toFixed(1)}x)
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={cfg.visual.fireSpreadRate}
                      onChange={(e) =>
                        ConfigManager.get().updateVisual({ fireSpreadRate: parseFloat(e.target.value) })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">مرشحات الشاشة ومظهر الرترو</h3>

                <div className="dw-lab-toggle-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={cfg.visual.crtScanlines}
                      onChange={(e) => ConfigManager.get().updateVisual({ crtScanlines: e.target.checked })}
                    />
                    <span>خطوط مسح الشاشات القديمة (Retro CRT Scanlines)</span>
                  </label>
                </div>

                <div className="dw-lab-toggle-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={cfg.visual.retroGlow}
                      onChange={(e) => ConfigManager.get().updateVisual({ retroGlow: e.target.checked })}
                    />
                    <span>توهج النيون البكسلي (Neon Pixel Glow)</span>
                  </label>
                </div>

                <div className="dw-lab-toggle-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={cfg.visual.milestonePopups}
                      onChange={(e) => ConfigManager.get().updateVisual({ milestonePopups: e.target.checked })}
                    />
                    <span>لافتات الإنجاز الحماسية (25% / 50% / 75% / 100%)</span>
                  </label>
                </div>

                <div className="dw-lab-toggle-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={cfg.visual.showFps}
                      onChange={(e) => ConfigManager.get().updateVisual({ showFps: e.target.checked })}
                    />
                    <span>عرض عداد الإطارات (FPS Counter)</span>
                  </label>
                </div>

                <div className="dw-lab-toggle-row" style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={cfg.visual.hdVectorMode}
                      onChange={(e) => ConfigManager.get().updateVisual({ hdVectorMode: e.target.checked })}
                    />
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>نمط المتجهات فائق الدقة (HD Vector & SVG Sharp)</span>
                  </label>
                  <div className="dw-lab-tip" style={{ marginTop: 6, lineHeight: 1.6 }}>
                    🎨 <strong>محرك متجهات عالي الدقة:</strong> يرسم الكلمات العربية المتطايرة ككلمات متصلة بحدود ناعمة، والأحرف الإنجليزية وأيقونات الـ SVG بدقة متناهية وظلال ثلاثية الأبعاد بدلاً من الفوكسل المربّع القديم!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 6. MAPS & EXPORT TAB ================= */}
          {tab === 'maps' && (
            <div className="dw-lab-grid">
              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">خرائط ومستويات التدمير الجاهزة</h3>
                <div className="dw-lab-maps-list">
                  <div className="dw-lab-map-card">
                    <h4>🏢 صفحة العرض التفاعلية: "غير قابل للتدمير"</h4>
                    <p>المستوى الساخر الغني بالبطاقات والرسوم البيانية والأزرار والخطوط العريضة المصممة للتدمير.</p>
                    <button
                      className="dw-lab-btn-sm"
                      type="button"
                      onClick={() => {
                        onPlayMap?.('demo')
                        onClose()
                      }}
                    >
                      ⚡ العب هذا المستوى
                    </button>
                  </div>

                  <div className="dw-lab-map-card">
                    <h4>📖 موسوعة ويكيبيديا: Stick Figure</h4>
                    <p>مقالة موسوعية كاملة مع فقرات نصية وصور تذكارية قابلة للتمزيق وإسقاط الحروف فيزيائياً.</p>
                    <button
                      className="dw-lab-btn-sm"
                      type="button"
                      onClick={() => {
                        onPlayMap?.('en.wikipedia.org/wiki/Stick_figure')
                        onClose()
                      }}
                    >
                      ⚡ العب هذا المستوى
                    </button>
                  </div>
                </div>
              </div>

              <div className="dw-lab-col">
                <h3 className="dw-lab-h3">إدارة إعدادات المحرك (تصدير واستيراد)</h3>
                <div className="dw-lab-actions-box">
                  <button
                    className="dw-lab-btn"
                    type="button"
                    onClick={() => {
                      setJsonExport(ConfigManager.get().exportJson())
                      flashStatus('تم استخراج كود الإعدادات JSON بنجاح')
                    }}
                  >
                    📋 تصدير الإعدادات كـ JSON
                  </button>

                  {jsonExport && (
                    <textarea
                      className="dw-lab-textarea"
                      readOnly
                      value={jsonExport}
                      rows={6}
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                  )}

                  <div style={{ marginTop: 12 }}>
                    <textarea
                      placeholder="الصق كود JSON لاستيراد الإعدادات..."
                      rows={4}
                      className="dw-lab-textarea"
                      id="json-import-input"
                    />
                    <button
                      className="dw-lab-btn-sm"
                      style={{ marginTop: 6 }}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('json-import-input') as HTMLTextAreaElement
                        if (el && el.value) {
                          const ok = ConfigManager.get().importJson(el.value)
                          if (ok) {
                            flashStatus('تم استيراد الإعدادات وتطبيقها بنجاح!')
                            setJsonImportError('')
                          } else {
                            setJsonImportError('فشل الاستيراد: تأكد من صحة كود JSON')
                          }
                        }
                      }}
                    >
                      📥 تطبيق الإعدادات المستوردة
                    </button>
                    {jsonImportError && <p className="dw-lab-err">{jsonImportError}</p>}
                  </div>

                  <button
                    className="dw-lab-btn danger"
                    style={{ marginTop: 16 }}
                    type="button"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من استعادة كافة إعدادات المحرك الافتراضية؟')) {
                        ConfigManager.get().resetToDefaults()
                        flashStatus('تمت استعادة كافة الإعدادات إلى ضبط المصنع')
                      }
                    }}
                  >
                    ⚠️ استعادة ضبط المصنع بالكامل
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dw-lab-foot">
          <p className="dw-lab-foot-note">
            المعمل متصل مباشرة بالمحرك: أي تعديل على الفيزياء أو الأسلحة أو الشخصيات يُطبق فوراً في اللعبة بدون إعادة تحميل!
          </p>
          <button className="dw-lab-btn primary" onClick={onClose} type="button">
            ✓ تطبيق والعودة للعبة
          </button>
        </div>
      </div>
    </div>
  )
}
