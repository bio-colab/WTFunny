// Jahdar - Live Web Extension Content Script
// Injects the complete physics destruction sandbox into any active website using Shadow DOM.

import { DestroyEngine, GameStats, MilestoneInfo, weaponList, weaponIcons, buildIcon } from '../../src/lib/game/engine'
import { extractLiveDocumentLevel } from '../../src/lib/game/liveExtractor'
import { sound } from '../../src/lib/game/sound'
import { ConfigManager, getDestructionRank, CHARACTER_SKINS, PHYSICS_PRESETS, CharacterSkin } from '../../src/lib/game/engineConfig'

let activeEngine: DestroyEngine | null = null
let jahdarHostEl: HTMLElement | null = null
let origHtmlOverflow = ''
let origBodyOverflow = ''
let isPhotoMode = false
let windowListeners: Array<{ type: string; handler: (e: any) => void; opts?: any }> = []
let currentTheme = 'cities'
let currentPhysicsPreset = 'arcade'
let latestStats: GameStats = {
  fps: 60,
  letters: 0,
  blocks: 0,
  explosions: 0,
  shots: 0,
  pct: 0,
  weapon: 0,
  grounded: true,
  health: 100,
  jetFuel: 100,
  grenades: 3,
  time: 0,
}

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
  ;(document.activeElement as HTMLElement | null)?.blur?.() // don't type into a page field while playing

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
      cursor: none;
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
      max-width: 56px;
      max-height: 28px;
      width: auto;
      height: auto;
      image-rendering: pixelated;
      margin-top: 4px;
      object-fit: contain;
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

    /* Screen Flash Overlay */
    #photo-flash {
      position: absolute;
      inset: 0;
      background: #ffffff;
      opacity: 0;
      pointer-events: none;
      z-index: 100;
      transition: opacity 0.35s ease-out;
    }

    /* Floating Toast */
    #jahdar-toast {
      position: absolute;
      bottom: 82px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fef08a;
      padding: 9px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s ease;
      z-index: 95;
      direction: rtl;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #jahdar-toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    /* Victory Modal Backdrop & Card */
    .modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(4, 7, 13, 0.85);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 80;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      direction: rtl;
    }

    .modal-backdrop.show {
      opacity: 1;
      pointer-events: auto;
    }

    .victory-card {
      background: rgba(17, 24, 39, 0.94);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 24px;
      padding: 30px 34px;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.2);
      display: flex;
      flex-direction: column;
      gap: 20px;
      transform: scale(0.92);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-backdrop.show .victory-card {
      transform: scale(1);
    }

    .victory-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .victory-rank-badge {
      width: 68px;
      height: 68px;
      border-radius: 18px;
      background: #090d16;
      border: 2px solid #f59e0b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      font-weight: 900;
      color: #f59e0b;
      box-shadow: 0 0 24px rgba(245, 158, 11, 0.5);
      flex-shrink: 0;
    }

    .victory-header-text h2 {
      font-size: 19px;
      font-weight: 800;
      color: #fef08a;
      margin-bottom: 4px;
    }

    .victory-header-text p {
      font-size: 12.5px;
      color: #94a3b8;
      line-height: 1.4;
    }

    .victory-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      background: rgba(9, 13, 22, 0.7);
      padding: 14px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .stat-box {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-label {
      font-size: 11px;
      color: #94a3b8;
    }

    .stat-value {
      font-size: 15px;
      font-weight: 700;
      color: #38bdf8;
      font-family: monospace;
    }

    .victory-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .vic-btn {
      padding: 11px 16px;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      direction: rtl;
    }

    .vic-btn-primary {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #0b0f19;
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
    }
    .vic-btn-primary:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .vic-btn-photo {
      background: #1e293b;
      border: 1px solid #38bdf8;
      color: #38bdf8;
    }
    .vic-btn-photo:hover {
      background: rgba(56, 189, 248, 0.15);
      color: #7dd3fc;
      transform: translateY(-1px);
    }

    .vic-btn-close {
      background: transparent;
      color: #94a3b8;
      border: 1px solid #334155;
      font-size: 12px;
    }
    .vic-btn-close:hover {
      background: #1e293b;
      color: #e2e8f0;
    }

    /* Settings Drawer */
    .settings-drawer {
      position: absolute;
      top: 66px;
      right: 20px;
      max-width: 480px;
      width: calc(100% - 40px);
      background: rgba(9, 13, 22, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 18px;
      padding: 18px 20px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
      z-index: 25;
      direction: rtl;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-8px);
      transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .settings-drawer.show {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .drawer-title {
      font-size: 14px;
      font-weight: 800;
      color: #fef08a;
    }

    .drawer-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
    }
    .drawer-close:hover {
      color: #ef4444;
    }

    .drawer-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .drawer-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .section-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #38bdf8;
    }

    .drawer-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .drawer-pill {
      background: #1e293b;
      border: 1px solid #334155;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      direction: rtl;
    }

    .drawer-pill:hover {
      background: #334155;
      color: #e2e8f0;
      border-color: #64748b;
    }

    .drawer-pill.active {
      background: rgba(245, 158, 11, 0.18);
      border-color: #f59e0b;
      color: #fef08a;
      box-shadow: 0 0 10px rgba(245, 158, 11, 0.35);
      font-weight: 700;
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
          <button class="hud-btn" id="settings-btn" title="معمل جَحْدَر السريع [L]">⚙️ ضبط</button>
          <button class="hud-btn" id="mute-btn" title="كتم / تشغيل الصوت [M]">🔊 صوت</button>
          <button class="hud-btn" id="photo-btn" title="حفظ لقطة شاشة تذكارية [H]">📷 لقطة</button>
          <button class="hud-btn hud-btn-danger" id="exit-btn" title="خروج فوري [Esc]">❌ خروج</button>
        </div>
      </div>

      <!-- Settings Drawer (GameLab Quick Studio) -->
      <div id="settings-drawer" class="settings-drawer">
        <div class="drawer-header">
          <span class="drawer-title">🔬 معمل جَحْدَر — الضبط السريع</span>
          <button class="drawer-close" id="drawer-close-btn" type="button">✕</button>
        </div>
        <div class="drawer-content">
          <div class="drawer-section">
            <div class="section-title">🎭 شخصية البطل</div>
            <div class="drawer-pills" id="skin-pills">
              <button class="drawer-pill" data-skin="stickman">جَحْدَر (الفارس)</button>
              <button class="drawer-pill" data-skin="robot">الروبوت 9000</button>
              <button class="drawer-pill" data-skin="commando">كوماندوز</button>
              <button class="drawer-pill" data-skin="voidMage">ساحر الظلال</button>
              <button class="drawer-pill" data-skin="custom">المخصص</button>
            </div>
          </div>
          <div class="drawer-section">
            <div class="section-title">⚡ نمط الفيزياء</div>
            <div class="drawer-pills" id="physics-pills">
              <button class="drawer-pill" data-physics="arcade">كلاسيكي (Arcade)</button>
              <button class="drawer-pill" data-physics="hyper">خارق (Hyper)</button>
              <button class="drawer-pill" data-physics="moon">قمر (Moon)</button>
              <button class="drawer-pill" data-physics="heavy">ثقيل (Heavy)</button>
            </div>
          </div>
          <div class="drawer-section">
            <div class="section-title">🌆 الخلفية البانورامية</div>
            <div class="drawer-pills" id="theme-pills">
              <button class="drawer-pill" data-theme="cities">مدينة السايبربانك</button>
              <button class="drawer-pill" data-theme="mountain">الغسق الجبلي</button>
              <button class="drawer-pill" data-theme="sunny">أرض الشمس</button>
            </div>
          </div>
          <div class="drawer-section">
            <div class="section-title">🔊 النمط الصوتي</div>
            <div class="drawer-pills" id="audio-pills">
              <button class="drawer-pill" data-audio="retro">ريترو 8-بت</button>
              <button class="drawer-pill" data-audio="heavyBass">بيس ثقيل</button>
              <button class="drawer-pill" data-audio="cinematic">سينمائي</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Weapon Bar -->
      <div class="weapon-bar-wrap">
        <div class="weapon-bar" id="weapon-bar"></div>
      </div>
    </div>

    <!-- Screen Flash Overlay for Photo Capture -->
    <div id="photo-flash"></div>

    <!-- Floating Toast Notification -->
    <div id="jahdar-toast"></div>

    <!-- Victory Screen Modal -->
    <div id="victory-modal" class="modal-backdrop">
      <div class="victory-card">
        <div class="victory-header">
          <div class="victory-rank-badge" id="vic-rank-badge">S</div>
          <div class="victory-header-text">
            <h2 class="victory-title" id="vic-title">أسطورة التدمير (Rank S)</h2>
            <p class="victory-desc" id="vic-desc">سرعة إبادة خارقة في أقل من 50 ثانية!</p>
          </div>
        </div>

        <div class="victory-stats-grid">
          <div class="stat-box">
            <span class="stat-label">⏱️ الزمن</span>
            <span class="stat-value" id="vic-time">0 ثانية</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">💥 نسبة الدمار</span>
            <span class="stat-value" id="vic-pct">100%</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">🧱 الأجسام الصلبة</span>
            <span class="stat-value" id="vic-blocks">0</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">🔤 الحروف المسحوقة</span>
            <span class="stat-value" id="vic-letters">0</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">💣 التفجيرات</span>
            <span class="stat-value" id="vic-explosions">0</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">🎯 الطلقات</span>
            <span class="stat-value" id="vic-shots">0</span>
          </div>
        </div>

        <div class="victory-actions">
          <button class="vic-btn vic-btn-primary" id="vic-reload-btn" type="button">🔄 إعادة بناء الموقع</button>
          <button class="vic-btn vic-btn-photo" id="vic-photo-btn" type="button">📷 حفظ لقطة النصر</button>
          <button class="vic-btn vic-btn-close" id="vic-close-btn" type="button">✕ متابعة الاستكشاف</button>
        </div>
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
  const settingsBtn = shadow.getElementById('settings-btn') as HTMLElement
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

  const settingsDrawer = shadow.getElementById('settings-drawer') as HTMLElement
  const drawerCloseBtn = shadow.getElementById('drawer-close-btn') as HTMLElement
  const skinPills = shadow.getElementById('skin-pills') as HTMLElement
  const physicsPills = shadow.getElementById('physics-pills') as HTMLElement
  const themePills = shadow.getElementById('theme-pills') as HTMLElement
  const audioPills = shadow.getElementById('audio-pills') as HTMLElement
  const photoFlash = shadow.getElementById('photo-flash') as HTMLElement
  const jahdarToast = shadow.getElementById('jahdar-toast') as HTMLElement

  const victoryModal = shadow.getElementById('victory-modal') as HTMLElement
  const vicRankBadge = shadow.getElementById('vic-rank-badge') as HTMLElement
  const vicTitle = shadow.getElementById('vic-title') as HTMLElement
  const vicDesc = shadow.getElementById('vic-desc') as HTMLElement
  const vicTime = shadow.getElementById('vic-time') as HTMLElement
  const vicPct = shadow.getElementById('vic-pct') as HTMLElement
  const vicBlocks = shadow.getElementById('vic-blocks') as HTMLElement
  const vicLetters = shadow.getElementById('vic-letters') as HTMLElement
  const vicExplosions = shadow.getElementById('vic-explosions') as HTMLElement
  const vicShots = shadow.getElementById('vic-shots') as HTMLElement
  const vicReloadBtn = shadow.getElementById('vic-reload-btn') as HTMLElement
  const vicPhotoBtn = shadow.getElementById('vic-photo-btn') as HTMLElement
  const vicCloseBtn = shadow.getElementById('vic-close-btn') as HTMLElement

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
    const displayPct = Math.round(info.pct <= 1 ? info.pct * 100 : info.pct)
    milestoneBanner.textContent = `💥 [${displayPct}% دمار] ${info.titleAr}`
    milestoneBanner.classList.add('show')
    if (milestoneTimer) clearTimeout(milestoneTimer)
    milestoneTimer = setTimeout(() => {
      milestoneBanner.classList.remove('show')
    }, 4500)
  }

  // Floating Toast Notification
  let toastTimer: any = null
  function showToast(msg: string) {
    jahdarToast.textContent = msg
    jahdarToast.classList.add('show')
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      jahdarToast.classList.remove('show')
    }, 3200)
  }

  // Watermark Drawer for Canvas Export
  function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, pct: number, site: string, rank?: string) {
    const pad = 20
    const boxW = 340
    const boxH = 74
    const boxX = w - boxW - pad
    const boxY = h - boxH - pad

    ctx.save()
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)'
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(boxX, boxY, boxW, boxH, 12)
    } else {
      ctx.rect(boxX, boxY, boxW, boxH)
    }
    ctx.fill()
    ctx.stroke()

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.25)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.fillStyle = '#fef08a'
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Cairo, Tahoma, sans-serif'
    ctx.fillText('⚔️ جَحْدَر — قاهر عمالقة الويب', boxX + boxW - 14, boxY + 25)

    ctx.fillStyle = '#38bdf8'
    ctx.font = '600 12px monospace'
    const rankStr = rank ? ` • رتبة [${rank}]` : ''
    ctx.fillText(`${site} • ${pct}% دمار${rankStr}`, boxX + boxW - 14, boxY + 46)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px monospace'
    const dateStr = new Date().toLocaleDateString('ar-EG')
    ctx.fillText(`JAHDAR WEB RUNTIME // ${dateStr}`, boxX + boxW - 14, boxY + 63)

    ctx.restore()
  }

  // True Photo Mode: Screen Flash + Watermarked PNG Capture & Download
  function takePhotoScreenshot() {
    sound.click()
    if (photoFlash) {
      photoFlash.style.opacity = '0.75'
      setTimeout(() => {
        photoFlash.style.opacity = '0'
      }, 350)
    }
    try {
      const offscreen = document.createElement('canvas')
      offscreen.width = canvas.width
      offscreen.height = canvas.height
      const ctx = offscreen.getContext('2d')
      if (!ctx) return
      ctx.drawImage(canvas, 0, 0)

      const pct100 = Math.min(100, Math.max(0, Math.round(latestStats.pct * 100)))
      const rank = latestStats.pct >= 0.85 ? getDestructionRank(latestStats.time, latestStats.pct).rank : undefined
      drawWatermark(ctx, offscreen.width, offscreen.height, pct100, siteTitle, rank)

      offscreen.toBlob((blob) => {
        if (!blob) {
          showToast('⚠️ تعذر استخراج لقطة الشاشة')
          return
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const safeHost = (window.location.hostname || 'site').replace(/[^a-zA-Z0-9_-]/g, '_')
        a.download = `jahdar-${safeHost}-${Date.now()}.png`
        a.href = url
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
        showToast('📸 تم التقاط وحفظ لقطة الشاشة بنجاح!')
      }, 'image/png')
    } catch (e) {
      console.warn('Screenshot capture failed:', e)
      showToast('⚠️ تم حظر تصدير اللقطة بسبب قيود حماية المتصفح')
    }
  }

  // Victory Screen Display
  function showVictoryModal(info: { time: number; pct: number; blocks: number; letters: number; explosions: number; shots: number }) {
    const rankInfo = getDestructionRank(info.time, info.pct)
    vicRankBadge.textContent = rankInfo.rank
    vicRankBadge.style.color = rankInfo.color
    vicRankBadge.style.borderColor = rankInfo.color
    vicRankBadge.style.boxShadow = `0 0 26px ${rankInfo.color}88`
    vicTitle.textContent = rankInfo.title
    vicDesc.textContent = rankInfo.desc

    vicTime.textContent = `${info.time} ثانية`
    vicPct.textContent = `${Math.min(100, Math.max(0, Math.round(info.pct * 100)))}%`
    vicBlocks.textContent = info.blocks.toString()
    vicLetters.textContent = info.letters.toString()
    vicExplosions.textContent = info.explosions.toString()
    vicShots.textContent = info.shots.toString()

    victoryModal.classList.add('show')
    sound.complete()
  }

  // Settings Drawer Sync & Controls
  function syncDrawerPills() {
    const cfg = ConfigManager.get().getConfig()
    skinPills.querySelectorAll('.drawer-pill').forEach((btn) => {
      const s = btn.getAttribute('data-skin')
      if (s === cfg.character.skin) btn.classList.add('active')
      else btn.classList.remove('active')
    })
    physicsPills.querySelectorAll('.drawer-pill').forEach((btn) => {
      const p = btn.getAttribute('data-physics')
      if (p === currentPhysicsPreset) btn.classList.add('active')
      else btn.classList.remove('active')
    })
    themePills.querySelectorAll('.drawer-pill').forEach((btn) => {
      const t = btn.getAttribute('data-theme')
      if (t === currentTheme) btn.classList.add('active')
      else btn.classList.remove('active')
    })
    audioPills.querySelectorAll('.drawer-pill').forEach((btn) => {
      const a = btn.getAttribute('data-audio')
      if (a === cfg.audio.profile) btn.classList.add('active')
      else btn.classList.remove('active')
    })
  }

  function toggleSettingsDrawer() {
    const isShow = settingsDrawer.classList.contains('show')
    if (isShow) {
      settingsDrawer.classList.remove('show')
    } else {
      syncDrawerPills()
      settingsDrawer.classList.add('show')
    }
  }

  settingsBtn.addEventListener('click', toggleSettingsDrawer)
  drawerCloseBtn.addEventListener('click', () => settingsDrawer.classList.remove('show'))

  skinPills.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.drawer-pill') as HTMLElement | null
    if (!target) return
    const skin = target.getAttribute('data-skin') as CharacterSkin
    if (skin && CHARACTER_SKINS[skin]) {
      ConfigManager.get().selectCharacterSkin(skin)
      syncDrawerPills()
      sound.click()
      showToast(`🎭 الشخصية: ${CHARACTER_SKINS[skin].nameAr}`)
    }
  })

  physicsPills.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.drawer-pill') as HTMLElement | null
    if (!target) return
    const preset = target.getAttribute('data-physics')
    if (preset && PHYSICS_PRESETS[preset]) {
      currentPhysicsPreset = preset
      ConfigManager.get().applyPhysicsPreset(preset)
      syncDrawerPills()
      sound.click()
      showToast(`⚡ فيزياء: ${PHYSICS_PRESETS[preset].name}`)
    }
  })

  themePills.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.drawer-pill') as HTMLElement | null
    if (!target) return
    const theme = target.getAttribute('data-theme')
    if (theme && activeEngine) {
      currentTheme = theme
      activeEngine.setBgTheme(theme)
      syncDrawerPills()
      sound.click()
      const themeNames: Record<string, string> = {
        cities: 'مدينة السايبربانك',
        mountain: 'الغسق الجبلي',
        sunny: 'أرض الشمس',
      }
      showToast(`🌆 خلفية: ${themeNames[theme] || theme}`)
    }
  })

  audioPills.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.drawer-pill') as HTMLElement | null
    if (!target) return
    const profile = target.getAttribute('data-audio') as any
    if (profile) {
      ConfigManager.get().updateAudio({ profile })
      syncDrawerPills()
      sound.click()
      const audioNames: Record<string, string> = {
        retro: 'ريترو 8-بت',
        heavyBass: 'بيس ثقيل',
        cinematic: 'سينمائي',
      }
      showToast(`🔊 نمط الصوت: ${audioNames[profile] || profile}`)
    }
  })

  // Victory screen buttons
  vicReloadBtn.addEventListener('click', () => {
    window.location.reload()
  })
  vicPhotoBtn.addEventListener('click', () => {
    takePhotoScreenshot()
  })
  vicCloseBtn.addEventListener('click', () => {
    victoryModal.classList.remove('show')
  })

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
  photoBtn.addEventListener('click', takePhotoScreenshot)
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
    sitePill.textContent = `${window.location.hostname} • ${level.bodies.length} عنصر صلب`

    // DOM State Caching to prevent redundant mutations
    let lastPct = -1
    let lastWeaponIdx = -1
    let lastFps = -1
    let lastBlocks = -1
    let lastLetters = -1
    let lastExplosions = -1

    // 2. Initialize Engine
    const engine = new DestroyEngine({
      onProgress,
      onStats: (stats: GameStats) => {
        latestStats = stats
        const pct100 = Math.min(100, Math.max(0, Math.round(stats.pct * 100)))
        if (pct100 !== lastPct) {
          lastPct = pct100
          pctVal.textContent = `${pct100}% دمار`
          progressFill.style.width = `${pct100}%`
        }
        if (stats.blocks !== lastBlocks || stats.letters !== lastLetters || stats.explosions !== lastExplosions) {
          lastBlocks = stats.blocks
          lastLetters = stats.letters
          lastExplosions = stats.explosions
          meterCounts.textContent = `💥 ${stats.blocks} صلب مدمّر | 🔤 ${stats.letters} حرف مسحوق | 💣 ${stats.explosions} تفجير`
        }
        const roundedFps = Math.round(stats.fps)
        if (roundedFps !== lastFps) {
          lastFps = roundedFps
          fpsBadge.textContent = `${roundedFps} FPS`
        }
        if (stats.weapon !== lastWeaponIdx) {
          lastWeaponIdx = stats.weapon
          updateActiveWeapon(stats.weapon)
        }
      },
      onComplete: (s) => {
        showMilestone({ pct: 100, titleAr: 'نصر كاسح! تم محو الموقع بالكامل!', titleEn: 'Total Obliteration!' })
        showVictoryModal({
          time: s.time,
          pct: 1.0,
          blocks: s.blocks,
          letters: s.letters,
          explosions: s.explosions,
          shots: s.shots,
        })
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
    await engine.startWithLevel(level, siteTitle, currentTheme)

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

    // Capture phase + stopImmediatePropagation: page shortcuts (YouTube space/K, Gmail, GitHub, etc.)
    // must not fire while Jahdar owns keyboard controls
    const swallow = (e: KeyboardEvent) => {
      if (!(e.altKey && e.shiftKey) && !e.ctrlKey && !e.metaKey) e.stopImmediatePropagation()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      swallow(e)
      if (e.key === 'Escape') {
        if (victoryModal.classList.contains('show')) {
          victoryModal.classList.remove('show')
          return
        }
        if (settingsDrawer.classList.contains('show')) {
          settingsDrawer.classList.remove('show')
          return
        }
        teardownJahdar()
        return
      }
      if (e.key === 'h' || e.key === 'H') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          takePhotoScreenshot()
          return
        }
      }
      if (e.key === 'l' || e.key === 'L') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          toggleSettingsDrawer()
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
      swallow(e)
      engine.onKey(e, false)
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    windowListeners.push({ type: 'keydown', handler: onKeyDown, opts: true })
    windowListeners.push({ type: 'keyup', handler: onKeyUp, opts: true })
    const onBlur = () => engine.onBlur()
    window.addEventListener('blur', onBlur)
    windowListeners.push({ type: 'blur', handler: onBlur })

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
