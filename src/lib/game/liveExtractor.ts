// Live In-Situ DOM & Text Extractor for the Browser Extension:
// Directly inspects the active webpage's DOM, computed styles, text ranges, and images
// without iframes or server proxies, producing crisp SolidBody objects and layout backplates.

import { LevelData, LoadProgress } from './loader'
import { LevelElement, SolidBody } from './world'

const MAX_GLYPHS = 5000
const MAX_BOXES = 3000
const MAX_IMAGES = 350
const MAX_H = 4800

const SKIP_TAGS = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'head',
  'meta',
  'link',
  'title',
  'iframe',
  'br',
  'source',
  'track',
  'param',
  'object',
  'embed',
  'sup',
  'sub',
])

const SKIP_CLASSES = [
  'mw-jump-link',
  'mw-editsection',
  'noprint',
  'navbox',
  'vector-menu',
  'visually-hidden',
  'sr-only',
  'reference',
  'citation',
  'reflist',
  'mw-indicator',
  'hatnote',
  'infobox-navbar',
]

type LiveBox = {
  x: number
  y: number
  w: number
  h: number
  radius: [number, number, number, number]
  bg: string | null
  grad: { type: 'linear'; angle: number; stops: { c: string; p: number }[] } | null
  border: { w: number; c: string } | null
  shadow?: { color: string; x: number; y: number; blur: number } | null
  image: HTMLImageElement | null
  imgFit: string
  opacity: number
  tag?: string
  semanticRole?: 'portal' | 'structure' | 'trigger' | 'platform' | 'heavy' | 'decorative'
  href?: string
  isScenery: boolean
}

type LiveGlyph = {
  ch: string
  x: number
  y: number
  w: number
  h: number
  base: number
  font: string
  color: string
  underline: boolean
  fs: number
  blockId: number
  tag?: string
  semanticRole?: 'portal' | 'structure' | 'trigger' | 'platform' | 'heavy' | 'decorative'
  href?: string
}

function parseColor(s: string | null | undefined): string | null {
  if (!s) return null
  const t = s.trim()
  if (t === 'transparent' || t === 'none' || t === '') return null
  const m = t.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)$/i)
  if (m) {
    const a = m[4] ? (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1
    if (a <= 0.03) return null
    const r = Math.round(+m[1])
    const g = Math.round(+m[2])
    const b = Math.round(+m[3])
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
  }
  if (/^#[0-9a-f]{3,8}$/i.test(t)) {
    if (t.length === 4 || t.length === 5) {
      const r = t[1]
      const g = t[2]
      const b = t[3]
      return `#${r}${r}${g}${g}${b}${b}`
    }
    if (t.length === 9) {
      const a = parseInt(t.slice(7, 9), 16) / 255
      if (a <= 0.03) return null
      return t.slice(0, 7)
    }
    return t.slice(0, 7)
  }
  return null
}

function parseGradient(bg: string): LiveBox['grad'] {
  const m = bg.match(/linear-gradient\(([^)]*)\)/i)
  if (!m) return null
  const inner = m[1]
  let angle = 180
  const parts: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of inner) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  let i = 0
  const first = parts[0]
  const am = first.match(/^([\d.]+)(deg|turn)/i)
  const am2 = first.match(/to\s+(top|bottom|left|right)/i)
  if (am) {
    angle = parseFloat(am[1])
    if (am[2] === 'turn') angle = parseFloat(am[1]) * 360
    i = 1
  } else if (am2) {
    const dirs: Record<string, number> = { top: 0, right: 90, bottom: 180, left: 270 }
    angle = dirs[am2[1]]
    i = 1
  }
  const stops: { c: string; p: number }[] = []
  for (; i < parts.length; i++) {
    const pm = parts[i].match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|[a-z]+)\s*([\d.]+%)?/i)
    if (!pm) continue
    const c = parseColor(pm[1]) ?? '#888888'
    const p = pm[2] ? parseFloat(pm[2]) / 100 : -1
    stops.push({ c, p })
  }
  if (stops.length < 2) return null
  for (let k = 0; k < stops.length; k++) {
    if (stops[k].p < 0) stops[k].p = k / (stops.length - 1)
  }
  return { type: 'linear', angle, stops }
}

function radiusOf(s: CSSStyleDeclaration): [number, number, number, number] {
  const raw = (v: string) => {
    const f = parseFloat(v) || 0
    return Math.max(0, Math.min(f, 999))
  }
  return [raw(s.borderTopLeftRadius), raw(s.borderTopRightRadius), raw(s.borderBottomRightRadius), raw(s.borderBottomLeftRadius)]
}

function parseBoxShadow(s: string | null | undefined): { color: string; x: number; y: number; blur: number } | null {
  if (!s || s === 'none' || s.trim() === '') return null
  const m1 = s.match(/(rgba?\([^)]+\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/)
  if (m1) {
    const blur = parseFloat(m1[4]) || 0
    if (blur > 0.5) {
      return {
        color: m1[1],
        x: parseFloat(m1[2]) || 0,
        y: parseFloat(m1[3]) || 0,
        blur: Math.min(24, blur),
      }
    }
  }
  return null
}

const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: [number, number, number, number]) => {
  const maxr = Math.min(w / 2, h / 2)
  const [tl, tr, br, bl] = r.map((v) => Math.min(v, maxr)) as [number, number, number, number]
  c.beginPath()
  c.moveTo(x + tl, y)
  c.lineTo(x + w - tr, y)
  c.arcTo(x + w, y, x + w, y + tr, tr)
  c.lineTo(x + w, y + h - br)
  c.arcTo(x + w, y + h, x + w - br, y + h, br)
  c.lineTo(x + bl, y + h)
  c.arcTo(x, y + h, x, y + h - bl, bl)
  c.lineTo(x, y + tl)
  c.arcTo(x, y, x + tl, y, tl)
  c.closePath()
}

export async function extractLiveDocumentLevel(
  doc: Document,
  win: Window,
  onProgress?: LoadProgress
): Promise<LevelData> {
  onProgress?.('قراءة خريطة الموقع الحي…', 0.15)

  const body = doc.body
  if (!body) throw new Error('لا يوجد محتوى في الصفحة')

  const scrollX = win.scrollX || doc.documentElement.scrollLeft || 0
  const scrollY = win.scrollY || doc.documentElement.scrollTop || 0

  const W = Math.max(1040, win.innerWidth)
  const H = Math.min(MAX_H, Math.max(win.innerHeight, doc.documentElement.scrollHeight, body.scrollHeight))

  const backdropCv = document.createElement('canvas')
  backdropCv.width = W
  backdropCv.height = H
  const bctx = backdropCv.getContext('2d')!

  const csHtml = win.getComputedStyle(doc.documentElement)
  const csBody = win.getComputedStyle(body)
  const pageBg = parseColor(csBody.backgroundColor) ?? parseColor(csHtml.backgroundColor) ?? '#ffffff'
  bctx.fillStyle = pageBg
  bctx.fillRect(0, 0, W, H)

  const boxes: LiveBox[] = []
  const glyphs: LiveGlyph[] = []
  let glyphCount = 0
  let boxCount = 0
  let blockIdCounter = 0

  const walk = (node: Element, curBlockId = 0) => {
    if (boxes.length + glyphs.length > MAX_BOXES + MAX_GLYPHS) return
    const tag = node.tagName.toLowerCase()
    if (SKIP_TAGS.has(tag)) return
    if (node.id === 'jahdar-root') return
    if (node.className && typeof node.className === 'string') {
      const cls = node.className.toLowerCase()
      if (SKIP_CLASSES.some((sc) => cls.includes(sc))) return
    }

    const cs = win.getComputedStyle(node)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return
    const op = parseFloat(cs.opacity || '1')
    if (op < 0.02) return

    let blockId = curBlockId
    const isButton = tag === 'button' || node.getAttribute('role') === 'button'
    const isHeading = /^h[1-6]$/.test(tag)
    const isBlockTag = /^(p|h[1-6]|li|blockquote|pre|td|th|dt|dd|article|section|header|footer|aside)$/i.test(tag) || isButton || isHeading
    if (isBlockTag) blockId = ++blockIdCounter

    const rect = node.getBoundingClientRect()
    const x = rect.left + scrollX
    const y = rect.top + scrollY
    const w = rect.width
    const h = rect.height

    const isImg = tag === 'img'
    const inlineSvg = tag === 'svg'
    const anchor = node.closest('a') as HTMLAnchorElement | null
    const href = anchor ? anchor.getAttribute('href') : null
    const shadow = parseBoxShadow(cs.boxShadow)

    const bwid = parseFloat(cs.borderLeftWidth) || 0
    const hasBorder = bwid > 0 && parseColor(cs.borderLeftColor) !== null
    const hasVisibleBackground = parseColor(cs.backgroundColor) !== null || /gradient\(/i.test(cs.backgroundImage || '')
    const visibleBox = (hasVisibleBackground || hasBorder || isImg || inlineSvg) && w >= 4 && h >= 4 && boxCount < MAX_BOXES

    if (visibleBox) {
      let bg = parseColor(cs.backgroundColor)
      let grad = /gradient\(/i.test(cs.backgroundImage || '') ? parseGradient(cs.backgroundImage) : null
      let image: HTMLImageElement | null = null
      let imgFit = cs.objectFit || 'cover'

      if (isImg) {
        image = node as HTMLImageElement
      } else if (inlineSvg && w >= 6 && h >= 6) {
        try {
          const clone = node.cloneNode(true) as SVGElement
          if (!clone.getAttribute('xmlns')) {
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
          }
          clone.setAttribute('width', `${Math.round(w)}`)
          clone.setAttribute('height', `${Math.round(h)}`)
          const xml = new XMLSerializer().serializeToString(clone)
          const svgImg = new Image()
          svgImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
          image = svgImg
        } catch {
          /* ignore fallback */
        }
      }

      const isScenery = (w >= W - 12 && h >= H - 12) || (w >= W * 0.85 && h >= 220)
      let border: { w: number; c: string } | null = null
      if (hasBorder) {
        const bc = parseColor(cs.borderLeftColor)
        if (bc) border = { w: Math.min(10, bwid), c: bc }
      }

      boxes.push({
        x,
        y,
        w,
        h,
        radius: radiusOf(cs),
        bg,
        grad,
        border,
        shadow,
        image,
        imgFit,
        opacity: op,
        tag,
        semanticRole: anchor && href ? 'portal' : isButton ? 'trigger' : isHeading ? 'structure' : 'platform',
        href: anchor && href ? href : undefined,
        isScenery,
      })
      boxCount++
    }

    // Direct text child nodes
    if (glyphCount < MAX_GLYPHS) {
      const childNodes = Array.from(node.childNodes)
      for (let cIdx = 0; cIdx < childNodes.length && glyphCount < MAX_GLYPHS; cIdx++) {
        const childNode = childNodes[cIdx]
        if (childNode.nodeType !== Node.TEXT_NODE) continue
        const tn = childNode as Text
        const txt = tn.data
        if (txt.trim().length === 0) continue

        const pcs = win.getComputedStyle(node)
        const fs = parseFloat(pcs.fontSize) || 16
        if (fs < 7) continue

        const fill = parseColor(pcs.webkitTextFillColor) ?? parseColor(pcs.color) ?? '#111111'
        const fam = pcs.fontFamily || 'sans-serif'
        const weight = pcs.fontWeight || '400'
        const style = pcs.fontStyle === 'italic' ? 'italic ' : ''
        const font = `${style}${weight} ${fs}px ${fam}`
        const range = doc.createRange()
        const len = txt.length

        let i = 0
        while (i < len && glyphCount < MAX_GLYPHS) {
          while (i < len && !txt[i].trim()) i++
          if (i >= len) break
          let j = i
          while (j < len && txt[j].trim()) j++
          if (j > i) {
            try {
              range.setStart(tn, i)
              range.setEnd(tn, j)
              const r = range.getBoundingClientRect()
              if (r.width > 0 && r.height > 0) {
                const wx = r.left + scrollX
                const wy = r.top + scrollY
                if (wx > -50 && wx < W + 50 && wy > -20 && wy < H + 50) {
                  const wordText = txt.slice(i, j)
                  glyphs.push({
                    ch: wordText,
                    x: wx,
                    y: wy,
                    w: r.width,
                    h: r.height,
                    base: wy + r.height - (r.height - fs * 0.78) * 0.32,
                    font,
                    color: fill,
                    underline: (pcs.textDecorationLine || '').includes('underline'),
                    fs,
                    blockId,
                    tag,
                    semanticRole: anchor && href ? 'portal' : isHeading ? 'structure' : isButton ? 'trigger' : 'platform',
                    href: anchor && href ? href : undefined,
                  })
                  glyphCount++
                }
              }
            } catch {
              /* ignore */
            }
          }
          i = j
        }
      }
    }

    for (const child of Array.from(node.children)) {
      walk(child, blockId)
    }
  }

  for (const child of Array.from(body.children)) walk(child, 0)

  onProgress?.('بناء كائنات جحدر الصلبة…', 0.85)

  // Backdrop Scenery
  for (const b of boxes) {
    if (b.isScenery && b.bg) {
      bctx.save()
      bctx.globalAlpha = b.opacity
      rr(bctx, b.x, b.y, b.w, b.h, b.radius)
      bctx.fillStyle = b.bg
      bctx.fill()
      bctx.restore()
    }
  }

  // Assemble Solid Bodies:
  // CRITICAL: Boxes first (containers/cards), so they render behind words!
  const bodies: SolidBody[] = []
  const elements = new Map<number, LevelElement>()
  let bodyId = 0

  for (const bx of boxes) {
    if (bx.isScenery) continue
    const isImg = bx.image !== null
    const mass = Math.max(25, Math.round(bx.w * bx.h * 0.03))
    const hp = Math.max(30, Math.round(30 + Math.sqrt(bx.w * bx.h) * 1.2))
    const b: SolidBody = {
      id: bodyId++,
      kind: isImg ? 'image' : 'box',
      x: bx.x,
      y: bx.y,
      w: bx.w,
      h: bx.h,
      vx: 0,
      vy: 0,
      rot: 0,
      vrot: 0,
      mass,
      hp,
      maxHp: hp,
      anchored: true,
      settled: false,
      settleT: 0,
      destroyed: false,
      burning: 0,
      bg: bx.bg,
      grad: bx.grad,
      radius: bx.radius,
      border: bx.border,
      shadow: bx.shadow,
      image: bx.image,
      imgFit: bx.imgFit,
      tag: bx.tag,
      semanticRole: bx.semanticRole,
      href: bx.href,
      damageDecals: [],
    }
    bodies.push(b)
  }

  // Glyphs and Words SECOND, so they render on top of boxes!
  for (const g of glyphs) {
    const mass = Math.max(8, Math.round(g.w * g.h * 0.07))
    const hp = Math.max(15, Math.round(15 + g.w * 0.35))
    const b: SolidBody = {
      id: bodyId++,
      kind: 'word',
      x: g.x,
      y: g.y,
      w: g.w,
      h: g.h,
      baseY: g.base,
      vx: 0,
      vy: 0,
      rot: 0,
      vrot: 0,
      mass,
      hp,
      maxHp: hp,
      anchored: true,
      settled: false,
      settleT: 0,
      destroyed: false,
      burning: 0,
      text: g.ch,
      font: g.font,
      color: g.color,
      underline: g.underline,
      tag: g.tag,
      semanticRole: g.semanticRole,
      href: g.href,
      damageDecals: [],
    }
    bodies.push(b)
  }

  return {
    W,
    H,
    bodies,
    colors: new Uint32Array(0),
    owners: new Int32Array(0),
    elements,
    title: doc.title || win.location.hostname,
    backdropCanvas: backdropCv,
  }
}
