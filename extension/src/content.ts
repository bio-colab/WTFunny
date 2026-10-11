// Jahdar - Live Web Extension Content Script
// Injects the complete physics destruction sandbox into any active website using Shadow DOM.

import { DestroyEngine, GameStats, MilestoneInfo, weaponList, weaponIcons, buildIcon } from '../../src/lib/game/engine'
import { extractLiveDocumentLevel } from '../../src/lib/game/liveExtractor'
import { sound } from '../../src/lib/game/sound'

let activeEngine: DestroyEngine | null = null
let jahdarHostEl: HTMLElement | null = null
let origHtmlOverflow = ''
let origBodyOverflow = ''
let isPhotoMode = false
let windowListeners: Array<{ type: string; handler: (e: any) => void; opts?: any }> = []

function isJahdarActive(): boolean {
  return jahdarHostEl !== null && document.getElementById('jahdar-root') !== null
}

function teardownJahdar() {
  if (activeEngine) {
    try {
      activeEngine.stop()
    } catch (e) {
      console.warn('Error stopping engine:', e)
    }
    activeEngine = null
  }

  // Restore document overflow
  document.documentElement.style.overflow = origHtmlOverflow
  if (document.body) {
    document.body.style.overflow = origBodyOverflow
  }

  // Remove window listeners
  for (const { type, handler, opts } of windowListeners) {
    window.removeEventListener(type, handler, opts)
  }
  windowListeners = []

  // Remove root container
  if (jahdarHostEl) {
    jahdarHostEl.remove()
    jahdarHostEl = null
  }

  const existing = document.getElementById('jahdar-root')
  if (existing) existing.remove()

  isPhotoMode = false
}

async function launchJahdar() {
  if (isJahdarActive()) {
    teardownJahdar()
    return
  }

  // Save current scroll & overflow styles
  origHtmlOverflow = document.documentElement.style.overflow
  origBodyOverflow = document.body ? document.body.style.overflow : ''
  document.documentElement.style.overflow = 'hidden'
  if (document.body) {
    document.body.style.overflow = 'hidden'
  }

  // Create isolated Host container
  const host = document.createElement('div')
  host.id = 'jahdar-root'
  host.style.position = 'fixed'
  host.style.inset = '0'
  host.style.width = '100vw'
  host.style.height = '100vh'
  host.style.zIndex = '2147483647'
  host.style.pointerEvents = 'auto'
  host.style.userSelect = 'none'

  const shadow = host.attachShadow({ mode: 'open' })
  document.documentElement.appendChild(host)
  jahdarHostEl = host

  // Inject Styles into Shadow DOM
  const styleEl = document.createElement('style')
  styleEl.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "Tahoma", sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }

    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #090d16;
      color: #f3f4f6;
    }

    #jahdar-viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      cursor: crosshair;
      z-index: 1;
    }

    /* HUD Container */
    #hud-layer {
      position: absolute;
      inset: 0;
      z-index: 10;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px 20px;
      transition: opacity 0.25s ease;
    }

    #hud-layer.photo-hidden {
      opacity: 0;
      pointer-events: none;
    }

    /* Top Bar */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: rgba(9, 13, 22, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 16px;
      padding: 10px 18px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      pointer-events: auto;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
      direction: rtl;
    }

    .brand-title {
      font-size: 16px;
      font-weight: 800;
      color: #fef08a;
      letter-spacing: -0.3px;
      text-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
    }

    .site-pill {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 3px 10px;
      font-size: 11px;
      color: #38bdf8;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      direction: ltr;
      font-family: monospace;
    }

    .meter-section {
      flex: 1;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meter-labels {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      direction: rtl;
    }

    .pct-val {
      font-weight: 800;
      color: #f59e0b;
      font-size: 14px;
      text-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
    }

    .meter-counts {
      color: #94a3b8;
      font-size: 11px;
    }

    .progress-track {
      height: 8px;
      background: #1e293b;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
    }

    .progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b);
      background-size: 200% 100%;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.8);
      border-radius: 6px;
      transition: width 0.15s ease-out;
    }

    .actions-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .hud-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      direction: rtl;
    }

    .hud-btn:hover {
      background: #334155;
      border-color: #f59e0b;
      color: #fef08a;
      transform: translateY(-1px);
    }

    .hud-btn-danger {
      background: rgba(185, 28, 28, 0.3);
      border-color: #ef4444;
      color: #fca5a5;
    }

    .hud-btn-danger:hover {
      background: #dc2626;
      color: #fff;
      border-color: #f87171;
    }

    .fps-badge {
      font-size: 11px;
      font-family: monospace;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 8px;
      border-radius: 8px;
    }

    /* Bottom Weapon Bar */
    .weapon-bar-wrap {
      display: flex;
      justify-content: center;
      pointer-events: auto;
    }

    .weapon-bar {
      display: flex;
      gap: 6px;
      background: rgba(9, 13, 22, 0.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 18px;
      padding: 8px 12px;
      box-shadow: 0 8px 36px rgba(0, 0, 0, 0.7);
      max-width: 95vw;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .weapon-bar::-webkit-scrollbar {
      display: none;
    }

    .weapon-card {
      position: relative;
      background: #111827;
      border: 1px solid #1f293d;
      border-radius: 12px;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      min-width: 68px;
      transition: all 0.18s ease;
    }

    .weapon-card:hover {
      background: #1e293b;
      border-color: #64748b;
      transform: translateY(-2px);
    }

    .weapon-card.active {
      background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
      border-color: #f59e0b;
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.5), inset 0 0 8px rgba(245, 158, 11, 0.2);
      transform: translateY(-4px);
    }

    .weapon-hotkey {
      position: absolute;
      top: 3px;
      left: 5px;
      font-size: 9.5px;
      font-family: monospace;
      font-weight: 700;
      color: #94a3b8;
    }

    .weapon-card.active .weapon-hotkey {
      color: #fef08a;
    }

    .weapon-canvas {
      width: 32px;
      height: 32px;
      image-rendering: pixelated;
      margin-top: 4px;
    }

    .weapon-name {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
      white-space: nowrap;
    }

    .weapon-card.active .weapon-name {
      color: #fef08a;
      font-weight: 800;
    }

    /* Milestone Banner */
    #milestone-banner {
      position: absolute;
      top: 86px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95));
      color: #0b0f19;
      padding: 12px 28px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(245, 158, 11, 0.6);
      font-size: 17px;
      font-weight: 900;
      text-align: center;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 20;
      direction: rtl;
    }

    #milestone-banner.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    /* Photo Mode Watermark */
    #photo-watermark {
      position: absolute;
      bottom: 20px;
      right: 24px;
      z-index: 15;
      background: rgba(9, 13, 22, 0.75);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(245, 158, 11, 0.4);
      padding: 8px 16px;
      border-radius: 12px;
      color: #fef08a;
      font-size: 12px;
      font-weight: 700;
      direction: rtl;
      display: none;
      pointer-events: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    /* Splash / Loading Screen */
    #loading-splash {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, #111827 0%, #090d16 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      z-index: 50;
      transition: opacity 0.3s ease;
      direction: rtl;
    }

    .splash-card {
      background: rgba(17, 24, 39, 0.85);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 32px 40px;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
      max-width: 440px;
      text-align: center;
    }

    .splash-title {
      font-size: 24px;
      font-weight: 900;
      color: #fef08a;
      text-shadow: 0 0 16px rgba(245, 158, 11, 0.5);
    }

    .splash-desc {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
    }

    .splash-progress-track {
      width: 100%;
      height: 10px;
      background: #1e293b;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .splash-progress-fill {
      height: 100%;
      width: 10%;
      background: linear-gradient(90deg, #f59e0b, #38bdf8);
      border-radius: 8px;
      transition: width 0.15s ease-out;
    }

    .splash-status-text {
      font-size: 12px;
      color: #38bdf8;
      font-family: monospace;
    }
  `
  shadow.appendChild(styleEl)

  // Construct UI HTML
  const rootWrap = document.createElement('div')
  rootWrap.style.width = '100%'
  rootWrap.style.height = '100%'
  rootWrap.style.position = 'relative'

  rootWrap.innerHTML = `
    <!-- Canvas for Engine -->
    <canvas id="jahdar-viewport"></canvas>

    <!-- Milestone Banner -->
    <div id="milestone-banner"></div>

    <!-- Photo Mode Watermark -->
    <div id="photo-watermark">
      <span>⚔️ جَحْدَر — قاهر عمالقة الويب</span>
      <span style="color: #94a3b8; margin: 0 4px;">|</span>
      <span id="photo-site-name"></span>
    </div>

    <!-- HUD Layer -->
    <div id="hud-layer">
      <!-- Top Bar -->
      <div class="top-bar">
        <div class="brand-section">
          <span class="brand-title">جَحْدَر</span>
          <div class="site-pill" id="site-pill">جاري التحميل...</div>
        </div>

        <div class="meter-section">
          <div class="meter-labels">
            <span class="pct-val" id="pct-val">0% دمار</span>
            <span class="meter-counts" id="meter-counts">0 جسم صلب | 0 حرف</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
        </div>

        <div class="actions-section">
          <div class="fps-badge" id="fps-badge">60 FPS</div>
          <button class="hud-btn" id="mute-btn" title="كتم / تشغيل الصوت [M]">🔊 صوت</button>
          <button class="hud-btn" id="photo-btn" title="وضع التصوير التذكاري [H]">📷 لقطة</button>
          <button class="hud-btn hud-btn-danger" id="exit-btn" title="خروج فوري [Esc]">❌ خروج</button>
        </div>
      </div>

      <!-- Bottom Weapon Bar -->
      <div class="weapon-bar-wrap">
        <div class="weapon-bar" id="weapon-bar"></div>
      </div>
    </div>

    <!-- Loading Splash -->
    <div id="loading-splash">
      <div class="splash-card">
        <div style="font-size: 40px;">⚔️</div>
        <h2 class="splash-title">جَحْدَر — قاهر عمالقة الويب</h2>
        <p class="splash-desc">جاري تفكيك شفرة الصفحة الحية وتحويل عناصرها إلى أجسام صلبة قابلة للتدمير الفيزيائي...</p>
        <div class="splash-progress-track">
          <div class="splash-progress-fill" id="splash-fill"></div>
        </div>
        <span class="splash-status-text" id="splash-status">قراءة DOM الحي...</span>
      </div>
    </div>
  `
  shadow.appendChild(rootWrap)

  // Element handles
  const canvas = shadow.getElementById('jahdar-viewport') as HTMLCanvasElement
  const hudLayer = shadow.getElementById('hud-layer') as HTMLElement
  const sitePill = shadow.getElementById('site-pill') as HTMLElement
  const pctVal = shadow.getElementById('pct-val') as HTMLElement
  const meterCounts = shadow.getElementById('meter-counts') as HTMLElement
  const progressFill = shadow.getElementById('progress-fill') as HTMLElement
  const fpsBadge = shadow.getElementById('fps-badge') as HTMLElement
  const muteBtn = shadow.getElementById('mute-btn') as HTMLElement
  const photoBtn = shadow.getElementById('photo-btn') as HTMLElement
  const exitBtn = shadow.getElementById('exit-btn') as HTMLElement
  const weaponBar = shadow.getElementById('weapon-bar') as HTMLElement
  const milestoneBanner = shadow.getElementById('milestone-banner') as HTMLElement
  const photoWatermark = shadow.getElementById('photo-watermark') as HTMLElement
  const photoSiteName = shadow.getElementById('photo-site-name') as HTMLElement
  const loadingSplash = shadow.getElementById('loading-splash') as HTMLElement
  const splashFill = shadow.getElementById('splash-fill') as HTMLElement
  const splashStatus = shadow.getElementById('splash-status') as HTMLElement

  const siteTitle = document.title || window.location.hostname
  sitePill.textContent = window.location.hostname || siteTitle
  photoSiteName.textContent = window.location.hostname || siteTitle

  // Populate Weapon Bar Buttons
  const weaponCards: HTMLElement[] = []
  weaponList.forEach((w, idx) => {
    const card = document.createElement('div')
    card.className = `weapon-card ${idx === 0 ? 'active' : ''}`
    card.dataset.idx = idx.toString()

    const hotkey = document.createElement('span')
    hotkey.className = 'weapon-hotkey'
    hotkey.textContent = idx === 9 ? '0' : (idx + 1).toString()
    card.appendChild(hotkey)

    const iconSpr = weaponIcons[w.id]
    if (iconSpr) {
      const cv = buildIcon(iconSpr, 2)
      cv.className = 'weapon-canvas'
      card.appendChild(cv)
    }

    const nameSpan = document.createElement('span')
    nameSpan.className = 'weapon-name'
    nameSpan.textContent = w.nameAr
    card.appendChild(nameSpan)

    card.addEventListener('click', (e) => {
      e.stopPropagation()
      if (activeEngine) {
        activeEngine.selectWeapon(idx)
        updateActiveWeapon(idx)
      }
    })

    weaponBar.appendChild(card)
    weaponCards.push(card)
  })

  function updateActiveWeapon(idx: number) {
    weaponCards.forEach((c, i) => {
      if (i === idx) c.classList.add('active')
      else c.classList.remove('active')
    })
  }

  // Milestone Toast Helper
  let milestoneTimer: any = null
  function showMilestone(info: MilestoneInfo) {
    milestoneBanner.textContent = `💥 [${info.pct}% دمار] ${info.titleAr}`
    milestoneBanner.classList.add('show')
    if (milestoneTimer) clearTimeout(milestoneTimer)
    milestoneTimer = setTimeout(() => {
      milestoneBanner.classList.remove('show')
    }, 4500)
  }

  // Photo Mode Toggle
  function togglePhotoMode() {
    isPhotoMode = !isPhotoMode
    if (isPhotoMode) {
      hudLayer.classList.add('photo-hidden')
      photoWatermark.style.display = 'block'
    } else {
      hudLayer.classList.remove('photo-hidden')
      photoWatermark.style.display = 'none'
    }
  }

  // Audio Toggle
  let isMuted = false
  function toggleMute() {
    isMuted = !isMuted
    sound.setMuted(isMuted)
    muteBtn.textContent = isMuted ? '🔇 كتم' : '🔊 صوت'
  }

  muteBtn.addEventListener('click', toggleMute)
  photoBtn.addEventListener('click', togglePhotoMode)
  exitBtn.addEventListener('click', teardownJahdar)

  // Loading Progress Callback
  const onProgress = (msg: string, pct: number) => {
    splashStatus.textContent = msg
    splashFill.style.width = `${Math.round(pct * 100)}%`
  }

  try {
    // 1. Extract Live Document Level
    onProgress('قراءة خريطة الموقع الحي…', 0.1)
    const level = await extractLiveDocumentLevel(document, window, onProgress)

    // 2. Initialize Engine
    const engine = new DestroyEngine({
      onProgress,
      onStats: (stats: GameStats) => {
        pctVal.textContent = `${Math.round(stats.pct)}% دمار`
        progressFill.style.width = `${Math.min(100, Math.round(stats.pct))}%`
        meterCounts.textContent = `${stats.blocks} صلب | ${stats.letters} حرف | ${stats.explosions} انفجار`
        fpsBadge.textContent = `${Math.round(stats.fps)} FPS`
        updateActiveWeapon(stats.weapon)
      },
      onComplete: (s) => {
        showMilestone({ pct: 100, titleAr: 'نصر كاسح! تم محو الموقع بالكامل!', titleEn: 'Total Obliteration!' })
      },
      onPauseRequest: () => {
        // Can toggle pause or show exit prompt
      },
      onMilestone: (m) => {
        showMilestone(m)
      },
    })

    activeEngine = engine
    engine.setCanvas(canvas)

    // 3. Start Engine with Extracted Level
    await engine.startWithLevel(level, siteTitle, 'grid')

    // 4. Fade out Loading Splash
    loadingSplash.style.opacity = '0'
    setTimeout(() => {
      loadingSplash.remove()
    }, 350)

    // 5. Wire Input Listeners
    const onResize = () => {
      engine.resize()
    }
    window.addEventListener('resize', onResize)
    windowListeners.push({ type: 'resize', handler: onResize })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        teardownJahdar()
        return
      }
      if (e.key === 'h' || e.key === 'H') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          togglePhotoMode()
          return
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          toggleMute()
          return
        }
      }
      engine.onKey(e, true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      engine.onKey(e, false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    windowListeners.push({ type: 'keydown', handler: onKeyDown })
    windowListeners.push({ type: 'keyup', handler: onKeyUp })

    canvas.addEventListener('mousemove', (e) => {
      engine.onMouseMove(e.clientX, e.clientY)
    })
    canvas.addEventListener('mousedown', (e) => {
      engine.onMouseDown(e.button)
    })
    canvas.addEventListener('mouseup', (e) => {
      engine.onMouseUp(e.button)
    })
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
    canvas.addEventListener('wheel', (e) => {
      engine.onWheel(e.deltaY)
    }, { passive: true })

  } catch (err) {
    console.error('Failed to launch Jahdar on live page:', err)
    splashStatus.textContent = 'حدث خطأ أثناء تحميل الموقع: ' + String(err)
    setTimeout(() => {
      teardownJahdar()
    }, 3000)
  }
}

// Global Message Listener for Chrome Extension
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TOGGLE_JAHDAR') {
      if (isJahdarActive()) {
        teardownJahdar()
        sendResponse({ status: 'closed' })
      } else {
        launchJahdar().then(() => {
          sendResponse({ status: 'launched' })
        })
      }
      return true
    }
  })
}

// Keyboard shortcut fallback within the page: Alt+Shift+J
window.addEventListener('keydown', (e) => {
  if (e.altKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
    e.preventDefault()
    if (isJahdarActive()) teardownJahdar()
    else launchJahdar()
  }
})
