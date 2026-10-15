'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DestroyEngine, GameStats, MilestoneInfo } from '@/lib/game/engine'
import { WEAPONS } from '@/lib/game/weapons'
import { WEAPON_ICONS, paintSpriteInto } from '@/lib/game/sprites'
import { sound } from '@/lib/game/sound'
import { ConfigManager, getDestructionRank } from '@/lib/game/engineConfig'
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
  const [extModalOpen, setExtModalOpen] = useState(false)

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

  const finalPct = stats ? (stats.pct <= 1 ? stats.pct : stats.pct / 100) : 1
  const rankInfo = complete ? getDestructionRank(complete.time, finalPct) : null

  return (
    <div className="dw-app">
      <div className="dw-window">
        {/* Main Header */}
        <header className={`dw-head ${cinemaMode ? 'dw-head-collapsed' : ''}`}>
          <div className="dw-title">
            <img src="/logo.svg" alt="جحدر" className="w-8 h-8 rounded-md shrink-0 shadow-sm" />
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

                    {/* Chrome Extension Teaser Button */}
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="dw-btn full-w"
                        style={{
                          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
                          border: '1px solid rgba(245, 158, 11, 0.5)',
                          color: '#fef08a',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
                        }}
                        onClick={() => setExtModalOpen(true)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5 }}>
                          🧩 إضافة المتصفح (Chrome Extension)
                          <span style={{ fontSize: 10, background: '#f59e0b', color: '#090d16', padding: '1px 6px', borderRadius: 6, fontWeight: 800 }}>جديد</span>
                        </span>
                        <span style={{ fontSize: 11.5, color: '#38bdf8', fontWeight: 600 }}>دمّر أي موقع حي بلا قيود ⟵</span>
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

      {/* Browser Extension Modal */}
      {extModalOpen && (
        <div
          className="dw-screen dw-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setExtModalOpen(false)}
        >
          <div
            className="dw-win"
            style={{
              width: 'min(580px, 100%)',
              background: '#0f172a',
              border: '1px solid #f59e0b',
              borderRadius: 18,
              boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div
              className="dw-win-head"
              style={{
                borderBottom: '1px solid #1e293b',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>🧩</span>
                <p style={{ margin: 0, fontWeight: 800, color: '#fef08a', fontSize: 16 }}>
                  إضافة جَحْدَر للمتصفح (Manifest V3)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExtModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div
              className="dw-win-body"
              style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>
                حوّل أي موقع ويب في العالم (حتى المواقع المعقدة مثل <strong style={{ color: '#38bdf8' }}>X، YouTube، Reddit، البريد الإلكتروني، والصفحات المحمية</strong>) إلى ساحة معركة فيزيائية قابلة للتحطيم الفوري عبر متصفحك!
              </p>

              <div
                style={{
                  background: '#1e293b',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <strong style={{ color: '#f59e0b', fontSize: 13.5 }}>خطوات التثبيت السريعة (دقيقة واحدة):</strong>
                <ol style={{ margin: 0, paddingRight: 20, fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.85 }}>
                  <li>
                    قم ببناء الإضافة عبر الأمر:
                    <div style={{ margin: '4px 0', background: '#090d16', padding: '6px 12px', borderRadius: 6, color: '#38bdf8', fontFamily: 'monospace' }}>
                      npm run build:extension
                    </div>
                  </li>
                  <li>
                    افتح متصفحك (<span style={{ color: '#fef08a' }}>Chrome / Edge / Brave</span>) وتوجه إلى الرابط:
                    <div style={{ margin: '4px 0', background: '#090d16', padding: '6px 12px', borderRadius: 6, color: '#38bdf8', fontFamily: 'monospace' }}>
                      chrome://extensions
                    </div>
                  </li>
                  <li>فعّل خيار <strong>وضع المطور (Developer Mode)</strong> في أعلى الزاوية.</li>
                  <li>
                    انقر على زر <strong>تحميل حزمة غير مضغوطة (Load unpacked)</strong> ثم اختر مجلد:
                    <div style={{ margin: '4px 0', background: '#090d16', padding: '6px 12px', borderRadius: 6, color: '#fef08a', fontFamily: 'monospace' }}>
                      WTFunny/extension
                    </div>
                  </li>
                  <li>
                    ادخل إلى أي موقع تريده، واضغط:
                    <span style={{ margin: '0 6px', background: '#f59e0b', color: '#090d16', padding: '2px 8px', borderRadius: 6, fontWeight: 900 }}>
                      Alt + Shift + J
                    </span>
                    أو انقر على أيقونة الإضافة لتبدأ المعركة فوراً!
                  </li>
                </ol>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="dw-btn primary"
                  onClick={() => setExtModalOpen(false)}
                  style={{ padding: '8px 24px', borderRadius: 10, fontWeight: 700 }}
                >
                  حسناً، فهمت!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
