'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DestroyEngine, GameStats, MilestoneInfo } from '@/lib/game/engine'
import { WEAPONS } from '@/lib/game/weapons'
import { WEAPON_ICONS, paintSpriteInto } from '@/lib/game/sprites'
import { sound } from '@/lib/game/sound'
import { ConfigManager } from '@/lib/game/engineConfig'
import GameLab from './GameLab'

type Phase = 'title' | 'loading' | 'play' | 'complete'
type CompleteInfo = { letters: number; blocks: number; explosions: number; shots: number; time: number }

const BG_THEMES = [
  { id: 'cities', name: 'مدن الغروب' },
  { id: 'mountain', name: 'جبل الشفق' },
  { id: 'sunny', name: 'أرض الشمس' },
]

function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function getDestructionRank(timeSec: number, destroyedPct: number) {
  if (destroyedPct >= 0.98 && timeSec <= 50) {
    return { rank: 'S', title: 'أسطورة التدمير (Rank S)', color: '#f59e0b', desc: 'سرعة إبادة خارقة في أقل من 50 ثانية!' }
  }
  if (destroyedPct >= 0.95 && timeSec <= 90) {
    return { rank: 'A', title: 'مدمّر نخبوي (Rank A)', color: '#3b82f6', desc: 'تدمير شبه كامل واحترافي!' }
  }
  if (destroyedPct >= 0.85) {
    return { rank: 'B', title: 'سحق متقدم (Rank B)', color: '#10b981', desc: 'سقوط الغالبية العظمى للموقع.' }
  }
  return { rank: 'C', title: 'مدمّر معتمد (Rank C)', color: '#a1a1aa', desc: 'تم إنجاز المهمة بنجاح.' }
}

export default function DestroyGame() {
  const [phase, setPhase] = useState<Phase>('title')
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  const [loadMsg, setLoadMsg] = useState('')
  const [loadPct, setLoadPct] = useState(0)
  const [stats, setStats] = useState<GameStats | null>(null)
  const [complete, setComplete] = useState<CompleteInfo | null>(null)
  const [site, setSite] = useState('')
  const [paused, setPaused] = useState(false)
  const [bgTheme, setBgTheme] = useState('cities')
  const [sfxOn, setSfxOn] = useState(true)
  const [wname, setWname] = useState('')
  const [labOpen, setLabOpen] = useState(false)
  const [milestone, setMilestone] = useState<MilestoneInfo | null>(null)
  const [crtActive, setCrtActive] = useState(false)
  const [cinemaMode, setCinemaMode] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const engineRef = useRef<DestroyEngine | null>(null)
  const lastUrlRef = useRef('')
  const wnameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const milestoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastWeapon = useRef(-1)

  // Listen to visual CRT scanline changes from GameLab
  useEffect(() => {
    const unsub = ConfigManager.get().subscribe((cfg) => {
      setCrtActive(cfg.visual.crtScanlines)
    })
    return unsub
  }, [])

  const handleStats = useCallback((s: GameStats) => {
    setStats(s)
    if (s.weapon !== lastWeapon.current) {
      lastWeapon.current = s.weapon
      setWname(s.weaponName)
      if (wnameTimer.current) clearTimeout(wnameTimer.current)
      wnameTimer.current = setTimeout(() => setWname(''), 1500)
    }
  }, [])

  const handleProgress = useCallback((m: string, p: number) => {
    setLoadMsg(m)
    setLoadPct(p)
  }, [])

  const handleComplete = useCallback((info: CompleteInfo) => {
    setComplete(info)
    setPhase('complete')
  }, [])

  const handlePauseRequest = useCallback(() => {
    setPaused((p) => !p)
  }, [])

  const handleMilestone = useCallback((m: MilestoneInfo) => {
    if (!ConfigManager.get().getConfig().visual.milestonePopups) return
    setMilestone(m)
    if (milestoneTimer.current) clearTimeout(milestoneTimer.current)
    milestoneTimer.current = setTimeout(() => setMilestone(null), 2800)
  }, [])

  // Create engine once
  useEffect(() => {
    const eng = new DestroyEngine({
      onProgress: handleProgress,
      onStats: handleStats,
      onComplete: handleComplete,
      onPauseRequest: handlePauseRequest,
      onMilestone: handleMilestone,
    })
    engineRef.current = eng
    if (canvasRef.current) eng.setCanvas(canvasRef.current)
    const onResize = () => eng.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      eng.stop()
    }
  }, [handleComplete, handleMilestone, handlePauseRequest, handleProgress, handleStats])

  // Pause handling
  useEffect(() => {
    const isPaused = paused || labOpen
    engineRef.current?.setPaused(isPaused)
    if (stageRef.current) {
      stageRef.current.classList.toggle('playing', phase === 'play' && !isPaused)
    }
  }, [paused, labOpen, phase])

  // Keyboard navigation & Shortcuts (including 'L' to toggle Game Lab)
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const eng = engineRef.current
      if (!eng) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const key = e.key.toLowerCase()

      // Shortcut: 'L' toggles Game Lab
      if (key === 'l') {
        e.preventDefault()
        setLabOpen((prev) => !prev)
        return
      }

      // Shortcut: 'H' or 'C' toggles Cinema Recording Mode (Hides HUD for recording)
      if (key === 'h' || key === 'c') {
        e.preventDefault()
        setCinemaMode((prev) => {
          const next = !prev
          setToastMsg(next ? '🎬 نمط التصوير مفعّل (الواجهة مخفية لتسجيل الفيديو — اضغط H للعودة)' : '👁️ تم إظهار واجهة التحكم')
          setTimeout(() => setToastMsg(null), 2500)
          return next
        })
        return
      }

      if (e.key === 'Tab') e.preventDefault()
      if (phase === 'play' && !labOpen) {
        eng.onKey(e, true)
        if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault()
      } else if (e.key === 'Escape' && phase !== 'title') {
        if (labOpen) {
          setLabOpen(false)
        } else if (phase === 'complete') {
          setPhase('play')
        } else {
          setPaused(false)
        }
      }
    }

    const ku = (e: KeyboardEvent) => {
      if (!labOpen) engineRef.current?.onKey(e, false)
    }

    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [phase, labOpen])

  const showHint = !stats || stats.shots === 0

  const startGame = useCallback(
    async (raw: string) => {
      const eng = engineRef.current
      if (!eng) return
      const u = raw.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
      if (!u) {
        setErr('اكتب عنوان موقع أو اختر أحد الأمثلة الجاهزة')
        return
      }
      setErr('')
      setComplete(null)
      setSite(u === 'demo' ? 'غير قابل للتدمير (العرض الساخر)' : u)
      lastUrlRef.current = u
      setPhase('loading')
      setLoadPct(0.02)
      setLoadMsg('جلب الصفحة…')
      sound.ensure()
      try {
        eng.setBgTheme(bgTheme)
        await eng.start({ url: u, bgTheme })
        setPhase('play')
        setTimeout(() => setPaused(false), 50)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'حدث خطأ غير متوقع أثناء تحميل الموقع')
        setPhase('title')
      }
    },
    [bgTheme]
  )

  const onCanvasMouse = useCallback((e: React.MouseEvent) => {
    const eng = engineRef.current
    const cv = canvasRef.current
    if (!eng || !cv || labOpen) return
    const rect = cv.getBoundingClientRect()
    eng.onMouseMove(e.clientX - rect.left, e.clientY - rect.top)
  }, [labOpen])

  const onCanvasDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const eng = engineRef.current
    const cv = canvasRef.current
    if (!eng || !cv || labOpen) return
    const rect = cv.getBoundingClientRect()
    eng.onMouseMove(e.clientX - rect.left, e.clientY - rect.top)
    eng.onMouseDown(e.button)
  }, [labOpen])

  const onCanvasUp = useCallback((e: React.MouseEvent) => {
    if (!labOpen) engineRef.current?.onMouseUp(e.button)
  }, [labOpen])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (!labOpen) engineRef.current?.onWheel(e.deltaY)
  }, [labOpen])

  const onTouch = useCallback((e: React.TouchEvent) => {
    const eng = engineRef.current
    const cv = canvasRef.current
    if (!eng || !cv || labOpen) return
    const rect = cv.getBoundingClientRect()
    const t = e.touches[0] ?? e.changedTouches[0]
    if (!t) return
    eng.onTouchAim(t.clientX - rect.left, t.clientY - rect.top, e.type !== 'touchend' && e.type !== 'touchcancel')
  }, [labOpen])

  const phase_loading = phase === 'loading'
  const playing = phase === 'play' && !paused && !labOpen

  const WeaponSlot = useMemo(
    () =>
      function WeaponSlotInner({ idx }: { idx: number }) {
        const w = WEAPONS[idx]
        const hasIcon = !!WEAPON_ICONS[w.id]
        const on = stats?.weapon === idx
        return (
          <button
            type="button"
            className={`dw-slot ${on ? 'on' : ''}`}
            onClick={() => engineRef.current?.selectWeapon(idx)}
            aria-label={w.nameAr}
            title={`${w.nameAr} — ${idx === 9 ? 0 : idx + 1}`}
          >
            {hasIcon && <canvas ref={(el) => { if (el) paintSpriteInto(el, w.id, 2) }} />}
            <span className="key">{idx === 9 ? 0 : idx + 1}</span>
          </button>
        )
      },
    [stats?.weapon]
  )

  const rankInfo = complete ? getDestructionRank(complete.time, (stats?.pct ?? 100) / 100) : null

  return (
    <div className="dw-app">
      <div className="dw-window">
        {/* Main Header */}
        <header className={`dw-head ${cinemaMode ? 'dw-head-collapsed' : ''}`}>
          <div className="dw-title">
            <span className="dw-logo-badge">⚔️ جَحْدَر</span>
            <span className="name">قاهر عمالقة الويب</span>
            <span className="by">JAHDAR // Web Demolition</span>
          </div>

          <div className="dw-head-actions">
            {/* Prominent Game Lab Button */}
            <button
              className="dw-btn dw-lab-glow-btn"
              type="button"
              onClick={() => setLabOpen(true)}
              title="افتح استوديو المحرك لتعديل الشخصيات والأسلحة والفيزياء (اختصار: L)"
            >
              🔬 المعمل [L]
            </button>

            {/* Cinema / Recording Mode Button */}
            {phase === 'play' && (
              <button
                className={`dw-btn dw-cinema-toggle-btn ${cinemaMode ? 'on' : ''}`}
                type="button"
                onClick={() => {
                  setCinemaMode((prev) => {
                    const next = !prev
                    setToastMsg(next ? '🎬 نمط التصوير مفعّل (الواجهة مخفية لتسجيل الفيديو — اضغط H للعودة)' : '👁️ تم إظهار واجهة التحكم')
                    setTimeout(() => setToastMsg(null), 2500)
                    return next
                  })
                }}
                title="إخفاء الأيقونات والواجهة لتصوير الشاشة والفيديو دون تشويش (اختصار: H)"
              >
                {cinemaMode ? '👁️ إظهار الأيقونات [H]' : '📷 نمط التصوير [H]'}
              </button>
            )}

            {phase === 'play' && (
              <button className="dw-btn" onClick={() => setPaused(true)} type="button">
                إيقاف مؤقت
              </button>
            )}
            {(phase === 'play' || phase === 'complete') && (
              <button
                className="dw-btn"
                type="button"
                onClick={() => {
                  setPhase('title')
                  engineRef.current?.stop()
                }}
              >
                موقع جديد
              </button>
            )}
          </div>
        </header>

        <div className="dw-body">
          <div className={`dw-stage ${crtActive ? 'dw-crt-active' : ''}`} ref={stageRef}>
            <canvas
              id="dw-canvas"
              ref={canvasRef}
              onMouseMove={onCanvasMouse}
              onMouseDown={onCanvasDown}
              onMouseUp={onCanvasUp}
              onContextMenu={(e) => e.preventDefault()}
              onWheel={onWheel}
              onTouchStart={onTouch}
              onTouchMove={onTouch}
              onTouchEnd={onTouch}
              aria-label="ساحة التدمير"
            />

            {/* CRT Scanline Overlay */}
            {crtActive && <div className="dw-crt-scanlines" aria-hidden="true" />}

            {/* Cinema Mode Floating Discreet Trigger (for mobile or mouse) */}
            {cinemaMode && phase === 'play' && (
              <button
                type="button"
                className="dw-cinema-restore-floating"
                onClick={() => {
                  setCinemaMode(false)
                  setToastMsg('👁️ تم إظهار واجهة التحكم')
                  setTimeout(() => setToastMsg(null), 1800)
                }}
                title="انقر أو اضغط H لاستعادة الواجهة"
              >
                📷 نمط التصوير نشط [اضغط H للعودة]
              </button>
            )}

            {/* Toast announcement */}
            {toastMsg && (
              <div className="dw-cinema-toast" role="status">
                {toastMsg}
              </div>
            )}

            {/* Animated Milestone Announcement Banner */}
            {milestone && !cinemaMode && (
              <div className="dw-milestone-banner" role="alert">
                <span className="icon">🏆</span>
                <div className="text-wrap">
                  <span className="pct">{Math.round(milestone.pct * 100)}%</span>
                  <span className="title">{milestone.titleAr}</span>
                </div>
              </div>
            )}

            <div className="dw-ui">
              {/* ============ TITLE SCREEN ============ */}
              <section className={`dw-screen ${phase === 'title' ? '' : 'hidden'}`} aria-hidden={phase !== 'title'}>
                <div className="dw-win" style={{ width: 'min(640px, 100%)' }}>
                  <div className="dw-win-head">
                    <p style={{ margin: 0 }}>جَحْدَر // ساحة معركة وتفكيك المواقع</p>
                    <span className="dw-header-pill">⚔️ JAHDAR EDITION</span>
                  </div>
                  <div className="dw-win-body">
                    <div className="dw-hero-header">
                      <div className="dw-hero-badge">⚔️ الفارس الصغير قاهر عمالقة الويب</div>
                      <h1 className="hero-title dw-hero-32">جَحْــــدَر</h1>
                      <p className="dw-hero-sub">
                        ضع رابط أي موقع في الميدان؛ تسلّق عناوينه كمنصات، تزلج على فقراته، وأسقط حروفه بفيزياء واقعية وترسانة مدمرة.
                      </p>
                    </div>

                    <form
                      className="dw-url-row"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void startGame(url)
                      }}
                    >
                      <label className="dw-input-wrap">
                        <span className="proto">https://</span>
                        <input
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          spellCheck={false}
                          placeholder="en.wikipedia.org أو أي رابط"
                          aria-label="عنوان الموقع"
                          dir="ltr"
                        />
                      </label>
                      <button className="dw-btn primary" type="submit">
                        ⚔️ انزل إلى المعركة
                      </button>
                    </form>

                    <div className="dw-picks">
                      <p>جرّب هذه الساحات الجاهزة:</p>
                      <button
                        type="button"
                        className="dw-tag highlight"
                        onClick={() => {
                          setUrl('demo')
                          void startGame('demo')
                        }}
                      >
                        🏢 صفحة العرض: "غير قابل للتدمير"
                      </button>
                      <button
                        type="button"
                        className="dw-tag"
                        onClick={() => {
                          setUrl('en.wikipedia.org/wiki/Stick_figure')
                          void startGame('en.wikipedia.org/wiki/Stick_figure')
                        }}
                      >
                        📖 ويكيبيديا: Stick Figure
                      </button>
                      <button
                        type="button"
                        className="dw-tag"
                        onClick={() => {
                          setUrl('example.com')
                          void startGame('example.com')
                        }}
                      >
                        🌐 Example.com
                      </button>
                    </div>

                    {/* Quick Lab Teaser Button */}
                    <div className="dw-lab-banner-link">
                      <button
                        type="button"
                        className="dw-btn dw-lab-glow-btn full-w"
                        onClick={() => setLabOpen(true)}
                      >
                        🔬 استوديو ومعمل المحرك (Game Lab)
                        <span className="dw-btn-hint">خصّص الشخصيات • عدّل قوة الأسلحة • اضبط الفيزياء</span>
                      </button>
                    </div>

                    <p className="dw-err" role="alert">{err}</p>

                    <div className="dw-keys-row">
                      <span><span className="dw-kbd">A</span><span className="dw-kbd">D</span> جري سلس مع صعود العتبات</span>
                      <span><span className="dw-kbd">مسافة</span> قفز — شقلبة — تحليق</span>
                      <span><span className="dw-kbd">S</span> هبوط</span>
                      <span>زر أيسر إطلاق</span>
                      <span>زر أيمن قنبلة / غطسة</span>
                      <span><span className="dw-kbd">1-0</span> الأسلحة العشرة</span>
                      <span><span className="dw-kbd">L</span> معمل المحرك</span>
                    </div>

                    <p className="dw-legal">
                      محرك تدمير فيزيائي شبكي متقدم 2px Voxel Grid — لعب فردي 100% بدون أي اعتماد على سيرفرات خارجية.
                    </p>
                  </div>
                </div>
              </section>

              {/* ============ LOADING SCREEN ============ */}
              <section className={`dw-screen ${phase_loading ? '' : 'hidden'}`} aria-hidden={!phase_loading}>
                <div className="dw-win dw-load-card">
                  <div className="dw-win-head">
                    <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      تحضير مستوى التدمير: {site}
                    </p>
                  </div>
                  <div className="dw-win-body" style={{ gap: 10 }}>
                    <div className="dw-load-row">
                      <p style={{ margin: 0 }}>{loadMsg}</p>
                      <p className="muted" style={{ margin: 0 }}>{Math.round(loadPct * 100)}%</p>
                    </div>
                    <div className="dw-load-bar">
                      <i style={{ width: `${Math.round(loadPct * 100)}%` }} />
                    </div>
                    <p className="dw-legal" style={{ textAlign: 'center' }}>
                      تفكيك بنية DOM وتحويل النصوص والعناصر إلى شبكة بكسل فيزيائية...
                    </p>
                  </div>
                </div>
              </section>

              {/* ============ HUD ============ */}
              <div
                className={`dw-hud ${phase === 'play' || phase === 'complete' ? '' : 'hidden'} ${cinemaMode ? 'dw-hud-hidden' : ''}`}
                aria-hidden={phase === 'title' || cinemaMode}
              >
                {/* Top-left Progress Meter */}
                <div className="dw-progress" aria-label="نسبة التدمير">
                  <div className="dw-meter">
                    <b style={{ width: `${Math.min(100, (stats?.pctMax ?? 0) * 100)}%` }} />
                    <i style={{ width: `${Math.min(100, (stats?.pct ?? 0) * 100)}%` }} />
                  </div>
                  <p>{Math.floor((stats?.pct ?? 0) * 100)}%</p>
                </div>

                {/* HUD Lab Quick-Trigger Button */}
                <button
                  type="button"
                  className="dw-hud-lab-trigger"
                  onClick={() => setLabOpen(true)}
                  title="افتح معمل المحرك (L)"
                >
                  🔬 المعمل [L]
                </button>

                {wname && (
                  <div className="dw-wname" role="status">
                    <p style={{ margin: 0 }}>{wname}</p>
                  </div>
                )}

                {/* Weapons Toolbar (1-10 + RMB Grenade) */}
                <div className="dw-weapons" aria-label="الأسلحة">
                  {WEAPONS.map((_, i) => (
                    <WeaponSlot key={i} idx={i} />
                  ))}
                  <button className="dw-slot alt" type="button" aria-label="قنبلة (زر أيمن)" title="قنبلة — زر أيمن">
                    <canvas ref={(el) => { if (el) paintSpriteInto(el, 'grenade', 3) }} />
                    <span className="lbl">RMB</span>
                  </button>
                </div>

                {/* On-screen hint */}
                <div className={`dw-hint ${showHint && playing ? '' : 'hidden'}`} style={showHint && playing ? undefined : { opacity: 0 }}>
                  <div className="dw-win" style={{ boxShadow: 'var(--dw-shadow-win)' }}>
                    <div className="dw-win-body">
                      <div className="dw-keys-row">
                        <span><span className="dw-kbd">A</span><span className="dw-kbd">D</span> جري</span>
                        <span><span className="dw-kbd">مسافة</span> قفز/شقلبة/تحليق</span>
                        <span><span className="dw-kbd">S</span> هبوط</span>
                        <span>زر أيسر إطلاق</span>
                        <span>زر أيمن قنبلة</span>
                        <span><span className="dw-kbd">H</span> نمط التصوير</span>
                        <span><span className="dw-kbd">L</span> المعمل</span>
                        <span><span className="dw-kbd">Esc</span> قائمة</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============ PAUSE MENU ============ */}
              <section className={`dw-screen dw-overlay ${paused && phase === 'play' && !labOpen ? '' : 'hidden'}`} aria-hidden={!(paused && phase === 'play')}>
                <div className="dw-win dw-menu-card">
                  <div className="dw-win-head">
                    <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      إيقاف مؤقت — {site}
                    </p>
                    <button type="button" onClick={() => setPaused(false)} aria-label="استئناف">✕</button>
                  </div>
                  <div className="dw-win-body">
                    <div className="dw-row">
                      <button className="dw-btn primary" type="button" onClick={() => setPaused(false)}>استئناف اللعب</button>
                      <button
                        className="dw-btn"
                        type="button"
                        onClick={() => {
                          setPaused(false)
                          void startGame(lastUrlRef.current)
                        }}
                      >
                        إعادة الموقع
                      </button>
                      <button
                        className="dw-btn"
                        type="button"
                        onClick={() => {
                          setPaused(false)
                          setPhase('title')
                          engineRef.current?.stop()
                        }}
                      >
                        موقع جديد
                      </button>
                    </div>

                    {/* Lab trigger from pause menu */}
                    <button
                      className="dw-btn dw-lab-glow-btn full-w"
                      type="button"
                      onClick={() => setLabOpen(true)}
                    >
                      🔬 فتح معمل المحرك وتعديل الخصائص (Game Lab)
                    </button>

                    <div className="dw-stats">
                      <p style={{ margin: 0 }}>التدمير الحالي</p>
                      <p className="v" style={{ margin: 0 }}>{Math.floor((stats?.pct ?? 0) * 100)}%</p>
                      <p style={{ margin: 0 }}>حروف ساقطة</p>
                      <p className="v" style={{ margin: 0 }}>{stats?.letters ?? 0}</p>
                      <p style={{ margin: 0 }}>عناصر مكسورة</p>
                      <p className="v" style={{ margin: 0 }}>{stats?.blocks ?? 0}</p>
                      <p style={{ margin: 0 }}>الشخصية الفعّالة</p>
                      <p className="v" style={{ margin: 0 }}>{stats?.characterName ?? 'رجل الخط'}</p>
                    </div>

                    <div>
                      <p className="dw-gray" style={{ margin: '0 0 4px' }}>الخلفية</p>
                      <div className="dw-seg">
                        {BG_THEMES.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className={`dw-btn ${bgTheme === t.id ? 'on' : ''}`}
                            onClick={() => {
                              setBgTheme(t.id)
                              engineRef.current?.setBgTheme(t.id)
                            }}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="dw-gray" style={{ margin: '0 0 4px' }}>الصوت</p>
                      <div className="dw-seg">
                        <button
                          type="button"
                          className={`dw-btn ${sfxOn ? 'on' : ''}`}
                          onClick={() => {
                            setSfxOn(true)
                            sound.setMuted(false)
                          }}
                        >
                          مفعّل
                        </button>
                        <button
                          type="button"
                          className={`dw-btn ${!sfxOn ? 'on' : ''}`}
                          onClick={() => {
                            setSfxOn(false)
                            sound.setMuted(true)
                          }}
                        >
                          صامت
                        </button>
                      </div>
                    </div>

                    <div className="dw-inner dw-keys" dir="rtl">
                      <p>A / D أو الأسهم</p><p>جري يميناً ويساراً مع تسلق العتبات تلقائياً</p>
                      <p>مسافة</p><p>قفز — اضغط ثانية للشقلبة — استمر بالضغط للتحليق بالجت-باك</p>
                      <p>S</p><p>الهبوط من خلال المنصات</p>
                      <p>الماوس</p><p>تصويب — زر أيسر للإطلاق</p>
                      <p>زر أيمن</p><p>رمي قنبلة (أو غطسة الدرون عند تفعيله)</p>
                      <p>L</p><p>فتح معمل المحرك في أي لحظة</p>
                    </div>

                    <div className="dw-art-strip" aria-hidden="true">
                      {['smg', 'shotgun', 'launcher', 'railgun', 'overkill'].map((id) => (
                        <canvas key={id} ref={(el) => { if (el) paintSpriteInto(el, id, 2) }} />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ============ COMPLETE SCREEN ============ */}
              <section className={`dw-screen dw-overlay ${phase === 'complete' ? '' : 'hidden'}`} aria-hidden={phase !== 'complete'}>
                {complete && (
                  <div className="dw-win dw-menu-card">
                    <div className="dw-win-head">
                      <p style={{ margin: 0 }}>تم تدمير الموقع بالكامل!</p>
                      <button type="button" onClick={() => setPhase('play')} aria-label="مواصلة التدمير">✕</button>
                    </div>
                    <div className="dw-win-body">
                      <div className="dw-big-score">100%</div>
                      <p className="muted" style={{ textAlign: 'center', margin: 0, direction: 'rtl' }}>{site}</p>

                      {/* Rank Card */}
                      {rankInfo && (
                        <div className="dw-rank-card" style={{ borderColor: rankInfo.color }}>
                          <span className="badge" style={{ backgroundColor: rankInfo.color }}>
                            {rankInfo.rank}
                          </span>
                          <div className="info">
                            <span className="title" style={{ color: rankInfo.color }}>
                              {rankInfo.title}
                            </span>
                            <span className="desc">{rankInfo.desc}</span>
                          </div>
                        </div>
                      )}

                      <div className="dw-inner dw-stats">
                        <p style={{ margin: 0 }}>حروف مقتلعة</p>
                        <p className="v" style={{ margin: 0 }}>{complete.letters.toLocaleString('ar-EG')}</p>
                        <p style={{ margin: 0 }}>عناصر مكسورة</p>
                        <p className="v" style={{ margin: 0 }}>{complete.blocks.toLocaleString('ar-EG')}</p>
                        <p style={{ margin: 0 }}>انفجارات مدوية</p>
                        <p className="v" style={{ margin: 0 }}>{complete.explosions.toLocaleString('ar-EG')}</p>
                        <p style={{ margin: 0 }}>طلقات نارية</p>
                        <p className="v" style={{ margin: 0 }}>{complete.shots.toLocaleString('ar-EG')}</p>
                        <p style={{ margin: 0 }}>الوقت المستغرق</p>
                        <p className="v" style={{ margin: 0 }}>{fmtTime(complete.time)}</p>
                      </div>

                      <div className="dw-row">
                        <button className="dw-btn" type="button" onClick={() => setPhase('play')}>
                          مواصلة التدمير
                        </button>
                        <button
                          className="dw-btn primary"
                          type="button"
                          onClick={() => {
                            setPhase('title')
                            setComplete(null)
                            engineRef.current?.stop()
                          }}
                        >
                          ⚡ دمّر موقعاً آخر
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Game Lab Modal Studio */}
      <GameLab
        open={labOpen}
        onClose={() => setLabOpen(false)}
        onPlayMap={(targetUrl) => {
          setLabOpen(false)
          setUrl(targetUrl)
          void startGame(targetUrl)
        }}
      />
    </div>
  )
}
