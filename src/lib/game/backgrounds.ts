// Procedural pixel-art parallax backgrounds (synthwave city, mountain dusk, sunny land).
// Each theme generates layered canvases at load time; layers scroll at different rates.

export type BgLayer = {
  canvas: HTMLCanvasElement
  factor: number // parallax factor
  repeat: boolean // tile horizontally
  yOffset: number // draw offset from world bottom
}

export type BgTheme = {
  id: string
  name: string
  layers: BgLayer[]
  sky: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
}

function cv(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

// ---------- synthwave city (default, like "Cities") ----------
function makeCitiesLayer(w: number, h: number, layer: number): HTMLCanvasElement {
  // layer 0 = far skyline, 1 = mid buildings, 2 = near foreground
  const c = cv(w, h)
  const ctx = c.getContext('2d')!
  const P = ['#241a3d', '#1a1230', '#16102a', '#2a1f4a', '#120d22']
  const win = ['#ffd23d', '#7ff3ff', '#ff3d8b', '#f97316']
  if (layer === 0) {
    // far flat skyline
    ctx.fillStyle = P[3]
    let x = 0
    while (x < w) {
      const bw = 30 + Math.random() * 70
      const bh = 40 + Math.random() * 90
      ctx.fillRect(x, h - bh, bw, bh)
      // antenna
      if (Math.random() < 0.3) ctx.fillRect(x + bw / 2, h - bh - 14, 2, 14)
      // sparse windows
      ctx.fillStyle = Math.random() < 0.5 ? win[0] : win[1]
      for (let k = 0; k < 4; k++) {
        if (Math.random() < 0.5) ctx.fillRect(x + 4 + Math.random() * (bw - 8), h - bh + 6 + Math.random() * (bh - 12), 2, 3)
      }
      ctx.fillStyle = P[3]
      x += bw + 2 + Math.random() * 10
    }
  } else if (layer === 1) {
    const bw0 = 46
    let x = -10
    while (x < w) {
      const bw = bw0 + Math.floor(Math.random() * 3) * 14
      const bh = 90 + Math.random() * 190
      const yy = h - bh
      ctx.fillStyle = Math.random() < 0.5 ? P[0] : P[1]
      ctx.fillRect(x, yy, bw, bh)
      ctx.fillStyle = P[4]
      ctx.fillRect(x, yy, 3, bh) // side shade
      // window grid
      for (let wy = yy + 8; wy < h - 8; wy += 10) {
        for (let wx = x + 5; wx < x + bw - 5; wx += 8) {
          if (Math.random() < 0.42) {
            ctx.fillStyle = win[(Math.random() * win.length) | 0]
            ctx.globalAlpha = 0.5 + Math.random() * 0.5
            ctx.fillRect(wx, wy, 4, 5)
            ctx.globalAlpha = 1
          }
        }
      }
      // rooftop
      if (Math.random() < 0.4) {
        ctx.fillStyle = P[4]
        ctx.fillRect(x + bw * 0.3, yy - 10, 6, 10)
        ctx.fillStyle = '#ff3d8b'
        ctx.fillRect(x + bw * 0.3 + 2, yy - 12, 2, 2)
      }
      x += bw + 4
    }
  } else {
    // near: dark rooftop silhouettes + pink trim
    let x = -20
    while (x < w) {
      const bw = 80 + Math.random() * 120
      const bh = 40 + Math.random() * 120
      const yy = h - bh
      ctx.fillStyle = P[2]
      ctx.fillRect(x, yy, bw, bh)
      ctx.fillStyle = '#2a1f4a'
      ctx.fillRect(x, yy, bw, 4)
      ctx.fillStyle = '#ff3d8b'
      ctx.globalAlpha = 0.75
      ctx.fillRect(x, yy + 4, bw, 2)
      ctx.globalAlpha = 1
      // water tanks
      if (Math.random() < 0.5) {
        ctx.fillStyle = P[4]
        ctx.fillRect(x + 10, yy - 12, 14, 12)
      }
      x += bw + 6
    }
  }
  return c
}

export function buildCities(viewW: number, viewH: number): BgTheme {
  const sky = cv(viewW, viewH)
  const sctx = sky.getContext('2d')!
  // dusk gradient sky
  const g = sctx.createLinearGradient(0, 0, 0, viewH)
  g.addColorStop(0, '#1a0f33')
  g.addColorStop(0.45, '#3d1d52')
  g.addColorStop(0.72, '#8a2f52')
  g.addColorStop(0.88, '#e0633e')
  g.addColorStop(1, '#f9a03f')
  sctx.fillStyle = g
  sctx.fillRect(0, 0, viewW, viewH)
  // stars
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * viewW
    const y = Math.random() * viewH * 0.55
    sctx.fillStyle = Math.random() < 0.3 ? '#ffd23d' : '#ffffff'
    sctx.globalAlpha = 0.3 + Math.random() * 0.7
    sctx.fillRect(x, y, 2, 2)
    sctx.globalAlpha = 1
  }
  // sun with scanlines
  const sx = viewW * 0.5
  const sy = viewH * 0.62
  const R = Math.min(viewW, viewH) * 0.16
  const sg = sctx.createLinearGradient(0, sy - R, 0, sy + R)
  sg.addColorStop(0, '#ffe26b')
  sg.addColorStop(0.5, '#ff8a2a')
  sg.addColorStop(1, '#ff3d8b')
  sctx.save()
  sctx.beginPath()
  sctx.arc(sx, sy, R, 0, Math.PI * 2)
  sctx.clip()
  sctx.fillStyle = sg
  sctx.fillRect(sx - R, sy - R, R * 2, R * 2)
  sctx.fillStyle = 'rgba(26,15,51,0.55)'
  for (let yy = sy; yy < sy + R; yy += 7) {
    sctx.fillRect(sx - R, yy, R * 2, 2 + (yy - sy) / (R / 3))
  }
  sctx.restore()

  return {
    id: 'cities',
    name: 'مدن الغروب',
    sky: (ctx, w, h) => {
      ctx.drawImage(sky, 0, 0, w, h)
    },
    layers: [
      { canvas: makeCitiesLayer(Math.max(1600, viewW * 1.4), viewH, 0), factor: 0.06, repeat: true, yOffset: 0 },
      { canvas: makeCitiesLayer(Math.max(1900, viewW * 1.6), viewH, 1), factor: 0.16, repeat: true, yOffset: 0 },
      { canvas: makeCitiesLayer(Math.max(2200, viewW * 1.8), viewH, 2), factor: 0.32, repeat: true, yOffset: 0 },
    ],
  }
}

// ---------- mountain dusk ----------
export function buildMountain(viewW: number, viewH: number): BgTheme {
  const sky = cv(viewW, viewH)
  const sctx = sky.getContext('2d')!
  const g = sctx.createLinearGradient(0, 0, 0, viewH)
  g.addColorStop(0, '#2a2440')
  g.addColorStop(0.5, '#5b3a5e')
  g.addColorStop(0.78, '#c96a4a')
  g.addColorStop(1, '#e8a05c')
  sctx.fillStyle = g
  sctx.fillRect(0, 0, viewW, viewH)
  // sun low
  sctx.fillStyle = '#ffd23d'
  sctx.beginPath()
  sctx.arc(viewW * 0.68, viewH * 0.6, Math.min(viewW, viewH) * 0.09, 0, Math.PI * 2)
  sctx.fill()
  for (let i = 0; i < 60; i++) {
    sctx.fillStyle = '#ffffff'
    sctx.globalAlpha = 0.25 + Math.random() * 0.5
    sctx.fillRect(Math.random() * viewW, Math.random() * viewH * 0.5, 2, 2)
    sctx.globalAlpha = 1
  }

  const mkRidge = (w: number, h: number, color: string, amp: number, base: number, snow: boolean) => {
    const c = cv(w, h)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, h)
    let x = 0
    let up = true
    const peaks: { x: number; y: number }[] = []
    while (x < w) {
      const px = x + 120 + Math.random() * 180
      const py = h - base - Math.random() * amp
      peaks.push({ x: px, y: py })
      ctx.lineTo(px, py)
      x = px
      up = !up
    }
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()
    if (snow) {
      for (const p of peaks) {
        ctx.fillStyle = '#ededed'
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - 16, p.y + 22)
        ctx.lineTo(p.x - 8, p.y + 18)
        ctx.lineTo(p.x, p.y + 26)
        ctx.lineTo(p.x + 8, p.y + 18)
        ctx.lineTo(p.x + 16, p.y + 22)
        ctx.closePath()
        ctx.fill()
      }
    }
    return c
  }

  const mkTrees = (w: number, h: number, color: string, count: number, minH: number) => {
    const c = cv(w, h)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = color
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w
      const th = minH + Math.random() * minH
      const base = h - 6 - Math.random() * 10
      ctx.beginPath()
      ctx.moveTo(x, base - th)
      ctx.lineTo(x - th * 0.3, base)
      ctx.lineTo(x + th * 0.3, base)
      ctx.closePath()
      ctx.fill()
      ctx.fillRect(x - 1.5, base - 4, 3, 6)
    }
    return c
  }

  return {
    id: 'mountain',
    name: 'جبل الشفق',
    sky: (ctx, w, h) => ctx.drawImage(sky, 0, 0, w, h),
    layers: [
      { canvas: mkRidge(Math.max(1700, viewW * 1.4), viewH, '#4a3a6b', 140, 130, true), factor: 0.05, repeat: true, yOffset: 0 },
      { canvas: mkRidge(Math.max(1900, viewW * 1.6), viewH, '#37294f', 170, 70, false), factor: 0.12, repeat: true, yOffset: 0 },
      { canvas: mkRidge(Math.max(2200, viewW * 1.8), viewH, '#241a38', 120, 30, false), factor: 0.24, repeat: true, yOffset: 0 },
      { canvas: mkTrees(Math.max(2200, viewW * 1.8), viewH, '#160f26', 70, 44), factor: 0.38, repeat: true, yOffset: 0 },
    ],
  }
}

// ---------- sunny land ----------
export function buildSunny(viewW: number, viewH: number): BgTheme {
  const sky = cv(viewW, viewH)
  const sctx = sky.getContext('2d')!
  const g = sctx.createLinearGradient(0, 0, 0, viewH)
  g.addColorStop(0, '#7fd4ff')
  g.addColorStop(0.7, '#b8ecff')
  g.addColorStop(1, '#e8fbff')
  sctx.fillStyle = g
  sctx.fillRect(0, 0, viewW, viewH)
  // sun
  sctx.fillStyle = '#fff3a6'
  sctx.beginPath()
  sctx.arc(viewW * 0.16, viewH * 0.16, Math.min(viewW, viewH) * 0.07, 0, Math.PI * 2)
  sctx.fill()
  // pixel clouds
  const cloud = (x: number, y: number, s: number) => {
    sctx.fillStyle = '#ffffff'
    sctx.fillRect(x, y, 34 * s, 10 * s)
    sctx.fillRect(x + 6 * s, y - 6 * s, 20 * s, 8 * s)
    sctx.fillRect(x + 10 * s, y - 11 * s, 12 * s, 7 * s)
  }
  for (let i = 0; i < 8; i++) cloud(Math.random() * viewW, viewH * 0.08 + Math.random() * viewH * 0.3, 0.8 + Math.random() * 1.4)

  const mkHills = (w: number, h: number, color: string, amp: number, base: number, deco?: (ctx: CanvasRenderingContext2D, x: number, y: number) => void) => {
    const c = cv(w, h)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, h)
    let x = 0
    while (x < w) {
      const cw = 90 + Math.random() * 160
      const cy = h - base - Math.random() * amp
      ctx.quadraticCurveTo(x + cw / 2, cy, x + cw, cy + Math.random() * amp * 0.3)
      x += cw
    }
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()
    if (deco) {
      for (let i = 0; i < 10; i++) deco(ctx, Math.random() * w, h - base - Math.random() * amp * 0.5)
    }
    return c
  }

  const tree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#5b4023'
    ctx.fillRect(x, y - 14, 4, 14)
    ctx.fillStyle = '#2f7a3a'
    ctx.fillRect(x - 8, y - 26, 20, 12)
    ctx.fillRect(x - 5, y - 32, 14, 8)
  }

  return {
    id: 'sunny',
    name: 'أرض الشمس',
    sky: (ctx, w, h) => ctx.drawImage(sky, 0, 0, w, h),
    layers: [
      { canvas: mkHills(Math.max(1700, viewW * 1.4), viewH, '#9fd98f', 90, 150), factor: 0.05, repeat: true, yOffset: 0 },
      { canvas: mkHills(Math.max(2000, viewW * 1.7), viewH, '#5cb85c', 70, 90, tree), factor: 0.14, repeat: true, yOffset: 0 },
      { canvas: mkHills(Math.max(2300, viewW * 1.9), viewH, '#2f7a3a', 50, 40), factor: 0.3, repeat: true, yOffset: 0 },
    ],
  }
}

export type BgBundle = BgTheme & { draw: (ctx: CanvasRenderingContext2D, camX: number, camY: number, viewW: number, viewH: number, worldH: number) => void }

export function buildBackgrounds(viewW: number, viewH: number, which: string): BgBundle {
  const theme = which === 'mountain' ? buildMountain(viewW, viewH) : which === 'sunny' ? buildSunny(viewW, viewH) : buildCities(viewW, viewH)

  const draw = (ctx: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, worldH: number) => {
    theme.sky(ctx, vw, vh)
    for (const layer of theme.layers) {
      const lw = layer.canvas.width
      const lx = ((-camX * layer.factor) % lw + lw) % lw
      // vertical: keep layer anchored to world bottom, move slightly with camY
      const ly = worldH - vh - camY * (layer.factor * 0.55) - (worldH - vh) * 0.0
      if (layer.repeat) {
        for (let x = -lx; x < vw; x += lw) {
          ctx.drawImage(layer.canvas, x, ly - (worldH - vh) * 0, lw, vh)
        }
      } else {
        ctx.drawImage(layer.canvas, -camX * layer.factor, ly, lw, vh)
      }
    }
  }

  return { ...theme, draw }
}
