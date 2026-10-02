// HTML → destructible pixel level converter.
// Loads fetched HTML into a sandboxed iframe, walks the DOM, extracts boxes,
// per-character glyphs and images, renders a layout canvas, and builds the
// 2px grid (colors + element ownership) for the World.

import { CELL, MAT_SOLID, LevelElement, SolidBody, packColor } from './world'

export type LoadProgress = (msg: string, pct: number) => void

export type LevelData = {
  W: number // world px width (layout px)
  H: number // world px height
  bodies: SolidBody[]
  colors: Uint32Array // grid res ABGR
  owners: Int32Array // grid res element ids (-1 bg)
  elements: Map<number, LevelElement>
  title: string
  backdropCanvas?: HTMLCanvasElement // Page background sheet canvas
}

const MAX_GLYPHS = 4200
const MAX_BOXES = 2600
const MAX_IMAGES = 260
const MAX_H = 3400 // layout px height cap

type DrawBox = {
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
  el: LevelElement | null
}

type DrawGlyph = {
  ch: string
  x: number
  y: number
  w: number
  h: number
  base: number
  font: string
  color: string
  underline: boolean
  el: LevelElement
  fs: number
  blockId: number
}

function parseColor(s: string | null | undefined): string | null {
  if (!s) return null
  const t = s.trim()
  if (t === 'transparent' || t === 'none' || t === '') return null
  // convert rgb()/rgba() to #hex (alpha>0.03)
  let m = t.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)$/i)
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
      // #rrggbbaa
      const a = parseInt(t.slice(7, 9), 16) / 255
      if (a <= 0.03) return null
      return t.slice(0, 7)
    }
    return t.slice(0, 7)
  }
  return null
}

function parseGradient(bg: string): DrawBox['grad'] {
  const m = bg.match(/linear-gradient\(([^)]*)\)/i)
  if (!m) return null
  const inner = m[1]
  let angle = 180
  const parts: string[] = []
  // split by commas not inside parens
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
  // fill in missing positions
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
  const tl = raw(s.borderTopLeftRadius)
  const tr = raw(s.borderTopRightRadius)
  const br = raw(s.borderBottomRightRadius)
  const bl = raw(s.borderBottomLeftRadius)
  return [tl, tr, br, bl]
}

function parseBoxShadow(s: string | null | undefined): { color: string; x: number; y: number; blur: number } | null {
  if (!s || s === 'none' || s.trim() === '') return null
  // Match standard computed styles: "rgb(15, 23, 42) 0px 8px 20px -8px" or "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px"
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

export async function buildLevel(html: string, baseUrl: string, layoutW: number, onProgress: LoadProgress): Promise<LevelData> {
  onProgress('تحضير الصفحة…', 0.12)

  // sandboxed iframe positioned in live DOM for full subpixel layout accuracy
  const iframe = document.createElement('iframe')
  iframe.sandbox.add('allow-same-origin')
  iframe.style.cssText = `position:fixed;left:0;top:0;width:${layoutW}px;height:3600px;z-index:-9999;opacity:0.001;pointer-events:none;border:0;`
  document.body.appendChild(iframe)

  const cleanup = () => {
    try {
      iframe.remove()
    } catch {
      /* noop */
    }
  }

  try {
    const doc = iframe.contentDocument
    if (!doc) throw new Error('تعذر إنشاء إطار الصفحة')
    doc.open()
    doc.write(html)
    doc.close()

    // wait for fonts + layout
    await new Promise<void>((resolve) => {
      let done = false
      const finish = () => {
        if (!done) {
          done = true
          resolve()
        }
      }
      iframe.onload = finish
      setTimeout(finish, 2500)
    })
    try {
      await iframe.contentWindow?.document.fonts?.ready
    } catch {
      /* noop */
    }
    await new Promise((r) => setTimeout(r, 150))

    const win = iframe.contentWindow!
    const idoc = win.document
    const body = idoc.body
    if (!body) throw new Error('صفحة بلا محتوى')

    onProgress('قراءة الصفحة…', 0.25)

    const pageH = Math.min(MAX_H, Math.max(600, Math.ceil(idoc.documentElement.scrollHeight)))
    const W = layoutW
    const H = pageH

    // --- backdrop sheet canvas (visual page background, scenery sections & boundary) ---
    const backdropCv = document.createElement('canvas')
    backdropCv.width = W
    backdropCv.height = H
    const bctx = backdropCv.getContext('2d')!

    // --- layout canvas (holds only destructible solid elements: text, buttons, cards, images) ---
    const cv = document.createElement('canvas')
    cv.width = W
    cv.height = H
    const ctx = cv.getContext('2d', { willReadFrequently: true })!
    ctx.textBaseline = 'alphabetic'

    // page background: drawn onto backdrop sheet ONLY (transparent on cv so air is empty)
    const csHtml = win.getComputedStyle(idoc.documentElement)
    const csBody = win.getComputedStyle(body)
    let pageBg = parseColor(csBody.backgroundColor) ?? parseColor(csHtml.backgroundColor) ?? '#ffffff'
    bctx.fillStyle = pageBg
    bctx.fillRect(0, 0, W, H)
    // subtle page boundary border on backdrop
    bctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
    bctx.lineWidth = 2
    bctx.strokeRect(1, 1, W - 2, H - 2)

    // cv starts transparent:
    ctx.clearRect(0, 0, W, H)

    const boxes: DrawBox[] = []
    const glyphs: DrawGlyph[] = []
    const images: { box: DrawBox; src: string; svg?: string }[] = []
    let glyphCount = 0
    let boxCount = 0
    let imgCount = 0
    let elemId = 0

    const newElement = (kind: LevelElement['kind'], approxCells: number): LevelElement => {
      const el: LevelElement = {
        id: elemId++,
        kind,
        cells: [],
        lost: 0,
        hp: 20 + (kind === 'image' ? 0.32 : 0.4) * Math.sqrt(Math.max(16, approxCells * CELL * CELL)),
        alive: true,
      }
      return el
    }

    // ---- pass 1: collect draw commands ----
    let blockIdCounter = 0
    const walk = (node: Element, curBlockId = 0) => {
      if (boxes.length + glyphs.length > MAX_BOXES + MAX_GLYPHS) return
      const tag = node.tagName.toLowerCase()
      if (SKIP_TAGS.has(tag)) return
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
      if (isBlockTag) {
        blockId = ++blockIdCounter
      }

      const rect = node.getBoundingClientRect()
      const x = rect.left
      const y = rect.top
      const w = rect.width
      const h = rect.height

      const isImg = tag === 'img'
      const inlineSvg = tag === 'svg'
      const anchor = node.closest('a') as HTMLAnchorElement | null
      const href = anchor ? anchor.getAttribute('href') : null
      const shadow = parseBoxShadow(cs.boxShadow)
      const hasBg =
        parseColor(cs.backgroundColor) !== null ||
        /gradient\(/i.test(cs.backgroundImage || '') ||
        isImg ||
        inlineSvg

      const visibleBox = (hasBg || parseColor(cs.borderTopColor)) && w >= 3 && h >= 3 && boxCount < MAX_BOXES

      let box: DrawBox | null = null
      if (visibleBox) {
        let bg = parseColor(cs.backgroundColor)
        let grad = /gradient\(/i.test(cs.backgroundImage || '') ? parseGradient(cs.backgroundImage) : null
        let image: HTMLImageElement | null = null
        let imgSrc: string | null = null
        let svgXml: string | null = null
        let imgFit = cs.objectFit || 'cover'

        if (isImg) {
          imgSrc = (node as HTMLImageElement).getAttribute('src')
          if (!imgSrc) {
            const srcset = (node as HTMLImageElement).getAttribute('srcset')
            if (srcset) imgSrc = srcset.split(',')[0]?.trim().split(' ')[0] ?? null
          }
        } else if (inlineSvg) {
          svgXml = new XMLSerializer().serializeToString(node)
        } else {
          const bm = (cs.backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/i)
          if (bm) imgSrc = bm[1]
        }
        if ((imgSrc || svgXml) && imgCount < MAX_IMAGES && w >= 8 && h >= 8) {
          imgCount++
          const bw = Math.ceil(w)
          const bh = Math.ceil(h)
          const bel = newElement('image', bw * bh)
          bel.w = w
          bel.h = h
          bel.svgXml = svgXml ?? undefined
          bel.label = svgXml ? 'SVG Icon' : 'Image'
          bel.tag = tag
          bel.semanticRole = anchor && href ? 'portal' : 'heavy'
          if (anchor && href) bel.href = href
          box = {
            x,
            y,
            w,
            h,
            radius: radiusOf(cs),
            bg: bg ?? (tag === 'img' ? '#c8c8c8' : '#9aa4b0'),
            grad,
            border: null,
            shadow,
            image: null,
            imgFit,
            opacity: op,
            el: bel,
          }
          images.push({ box, src: imgSrc ?? '', svg: svgXml ?? undefined })
          boxes.push(box)
          boxCount++
        } else {
          const bw = Math.ceil(w)
          const bh = Math.ceil(h)
          // Scenery containers: full page or massive sections where text/buttons live inside
          const isScenery = (bw >= W - 12 && bh >= H - 12) || (bw >= W * 0.72 && bh >= 160) || (bw >= W * 0.5 && bh >= 280)
          const bel = isScenery ? null : newElement('box', bw * bh)
          if (bel) {
            bel.tag = tag
            if (anchor && href) {
              bel.href = href
              bel.semanticRole = 'portal'
            } else if (isButton) {
              bel.semanticRole = 'trigger'
            } else if (isHeading) {
              bel.semanticRole = 'structure'
            } else {
              bel.semanticRole = 'platform'
            }
          }
          box = {
            x,
            y,
            w,
            h,
            radius: radiusOf(cs),
            bg,
            grad,
            border: null,
            shadow,
            image: null,
            imgFit,
            opacity: op,
            el: bel,
          }
          const bwid = parseFloat(cs.borderLeftWidth) || 0
          if (bwid > 0) {
            const bc = parseColor(cs.borderLeftColor)
            if (bc) box.border = { w: Math.min(14, bwid), c: bc }
          }
          boxes.push(box)
          boxCount++
        }
      }

      // ---- text: direct child text nodes only to eliminate duplication across ancestor walk calls ----
      if (glyphCount < MAX_GLYPHS) {
        const childNodes = Array.from(node.childNodes)
        for (let cIdx = 0; cIdx < childNodes.length && glyphCount < MAX_GLYPHS; cIdx++) {
          const childNode = childNodes[cIdx]
          if (childNode.nodeType !== Node.TEXT_NODE) continue
          const tn = childNode as Text
          const txt = tn.data
          if (txt.trim().length > 0) {
            const pcs = win.getComputedStyle(node)
            const fs = parseFloat(pcs.fontSize) || 16
            if (fs >= 7) {
              const fill = parseColor(pcs.webkitTextFillColor) ?? parseColor(pcs.color) ?? '#111111'
              const fam = pcs.fontFamily || 'sans-serif'
              const weight = pcs.fontWeight || '400'
              const style = pcs.fontStyle === 'italic' ? 'italic ' : ''
              const font = `${style}${weight} ${fs}px ${fam}`
              const range = idoc.createRange()
              const len = txt.length
              // Word-level extraction: splits text by whitespace, preserving intact words as crisp solid bodies for ALL languages
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
                    if (r.width > 0 && r.height > 0 && r.right > -50 && r.left < W + 50 && r.bottom > -20 && r.top < H && r.top > -10) {
                      const wordText = txt.slice(i, j)
                      const el = newElement('glyph', Math.max(9, Math.ceil(r.width) * Math.ceil(r.height)))
                      el.label = wordText
                      el.text = wordText
                      el.font = font
                      el.colorStr = fill
                      el.w = r.width
                      el.h = r.height
                      el.isWord = true
                      el.tag = tag
                      if (anchor && href) {
                        el.href = href
                        el.semanticRole = 'portal'
                      } else if (isHeading) {
                        el.semanticRole = 'structure'
                      } else if (isButton) {
                        el.semanticRole = 'trigger'
                      } else {
                        el.semanticRole = 'platform'
                      }
                      glyphs.push({
                        ch: wordText,
                        x: r.left,
                        y: r.top,
                        w: r.width,
                        h: r.height,
                        base: r.bottom - (r.height - fs * 0.78) * 0.32,
                        font,
                        color: fill,
                        underline: (pcs.textDecorationLine || '').includes('underline'),
                        el,
                        fs,
                        blockId,
                      })
                      glyphCount++
                    }
                  } catch {
                    /* ignore */
                  }
                }
                i = j
              }
            }
          }
        }
      }

      // children
      for (const child of Array.from(node.children)) {
        if (child.tagName.toLowerCase() === 'svg' && !inlineSvg) {
          // svg wrapper handled separately
        }
        walk(child, blockId)
      }
    }

    // root containers walk from body
    for (const child of Array.from(body.children)) walk(child, 0)

    // ---- PASS 1.5: COMPONENT MAP LAYOUT NORMALIZATION ----
    const blockMap = new Map<number, DrawGlyph[]>()
    for (const g of glyphs) {
      let list = blockMap.get(g.blockId)
      if (!list) {
        list = []
        blockMap.set(g.blockId, list)
      }
      list.push(g)
    }

    for (const [, words] of blockMap) {
      if (words.length === 0) continue

      // Sort words vertically by top
      words.sort((a, b) => a.y - b.y)

      // Partition into visual lines
      const lines: DrawGlyph[][] = []
      let curLine: DrawGlyph[] = []
      let curY = -1e9
      let curH = 16

      for (const w of words) {
        if (curLine.length === 0) {
          curLine.push(w)
          curY = w.y
          curH = w.h
        } else {
          if (Math.abs(w.y - curY) <= curH * 0.48) {
            curLine.push(w)
            curY = Math.min(curY, w.y)
          } else {
            lines.push(curLine)
            curLine = [w]
            curY = w.y
            curH = w.h
          }
        }
      }
      if (curLine.length > 0) lines.push(curLine)

      // Normalize each line:
      for (const line of lines) {
        line.sort((a, b) => a.x - b.x)

        const dominantFs = Math.max(...line.map((w) => w.fs))
        const minGap = Math.max(5, Math.round(dominantFs * 0.28))
        const maxBase = Math.max(...line.map((w) => w.base))

        // Enforce horizontal gap between consecutive words
        for (let k = 0; k < line.length; k++) {
          const curr = line[k]
          if (k > 0) {
            const prev = line[k - 1]
            if (curr.x < prev.x + prev.w + minGap) {
              curr.x = prev.x + prev.w + minGap
            }
          }
          // Snap baseline across the line so words don't jitter up/down
          curr.base = maxBase
          curr.y = maxBase - curr.h * 0.82
        }
      }

      // Enforce vertical line leading between consecutive lines in this block
      for (let l = 1; l < lines.length; l++) {
        const prevLine = lines[l - 1]
        const currLine = lines[l]
        const prevBottom = Math.max(...prevLine.map((w) => w.y + w.h))
        const fs = Math.max(...currLine.map((w) => w.fs))
        const minLineTop = prevBottom + Math.max(4, Math.round(fs * 0.35))

        const curTop = Math.min(...currLine.map((w) => w.y))
        if (curTop < minLineTop) {
          const shiftY = minLineTop - curTop
          for (const w of currLine) {
            w.y += shiftY
            w.base += shiftY
          }
        }
      }
    }

    // Inter-block spacing: prevent consecutive paragraphs from stacking on top of each other
    const sortedBlocks = Array.from(blockMap.values()).filter((list) => list.length > 0)
    sortedBlocks.sort((a, b) => {
      const topA = Math.min(...a.map((w) => w.y))
      const topB = Math.min(...b.map((w) => w.y))
      return topA - topB
    })

    for (let b = 1; b < sortedBlocks.length; b++) {
      const prevBlock = sortedBlocks[b - 1]
      const currBlock = sortedBlocks[b]
      const prevBottom = Math.max(...prevBlock.map((w) => w.y + w.h))
      const prevLeft = Math.min(...prevBlock.map((w) => w.x))
      const prevRight = Math.max(...prevBlock.map((w) => w.x + w.w))

      const currTop = Math.min(...currBlock.map((w) => w.y))
      const currLeft = Math.min(...currBlock.map((w) => w.x))
      const currRight = Math.max(...currBlock.map((w) => w.x + w.w))

      // If the blocks overlap horizontally (stacked in the same column)
      const horizOverlap = Math.min(prevRight, currRight) - Math.max(prevLeft, currLeft)
      if (horizOverlap > 40) {
        const minBlockTop = prevBottom + 14 // 14px clean paragraph margin
        if (currTop < minBlockTop) {
          const shiftY = minBlockTop - currTop
          for (const w of currBlock) {
            w.y += shiftY
            w.base += shiftY
          }
        }
      }
    }

    // Floating Image Protection: wrap words that would overlap images
    for (const im of images) {
      const b = im.box
      const imgLeft = b.x - 16
      const imgRight = b.x + b.w + 16
      const imgTop = b.y - 12
      const imgBottom = b.y + b.h + 16

      for (const g of glyphs) {
        if (g.y + g.h > imgTop && g.y < imgBottom) {
          if (g.x + g.w > imgLeft && g.x < imgRight) {
            if (g.x < imgLeft) {
              g.y = imgBottom + 8
              g.base = g.y + g.h * 0.82
            }
          }
        }
      }
    }

    onProgress('رسم الصفحة…', 0.5)

    // ---- pass 2: paint ----
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

    const paintBox = (c: CanvasRenderingContext2D, b: DrawBox) => {
      c.save()
      c.globalAlpha = b.opacity
      rr(c, b.x, b.y, b.w, b.h, b.radius)
      if (b.grad) {
        const rad = (b.grad.angle * Math.PI) / 180
        const cx = b.x + b.w / 2
        const cy = b.y + b.h / 2
        const len = (Math.abs(Math.cos(rad)) * b.w + Math.abs(Math.sin(rad)) * b.h) / 2
        const dx = Math.cos(rad) * len
        const dy = Math.sin(rad) * len
        const gr = c.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy)
        for (const s of b.grad.stops) gr.addColorStop(Math.max(0, Math.min(1, s.p)), s.c)
        c.fillStyle = gr
      } else if (b.bg) {
        c.fillStyle = b.bg
      } else {
        c.fillStyle = 'rgba(0,0,0,0)'
      }
      c.fill()
      if (b.border) {
        c.strokeStyle = b.border.c
        c.lineWidth = b.border.w * 2
        rr(c, b.x + b.border.w / 2, b.y + b.border.w / 2, b.w - b.border.w, b.h - b.border.w, b.radius)
        c.stroke()
      }
      c.restore()
    }

    for (const b of boxes) {
      if (!b.el) {
        // Scenery container: paint onto backdrop sheet (open air inside)
        paintBox(bctx, b)
      } else {
        // Interactive platform element: paint onto elements canvas
        paintBox(ctx, b)
      }
    }

    // Structured backdrop plates:
    for (const im of images) {
      const b = im.box
      if (b.w >= 24 && b.h >= 24) {
        bctx.save()
        bctx.fillStyle = '#f8fafc'
        bctx.shadowColor = 'rgba(15, 23, 42, 0.08)'
        bctx.shadowBlur = 18
        bctx.shadowOffsetY = 6
        rr(bctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, [10, 10, 10, 10])
        bctx.fill()
        bctx.strokeStyle = '#cbd5e1'
        bctx.lineWidth = 1.2
        bctx.stroke()
        bctx.restore()
      }
    }

    if (glyphs.length > 0) {
      const minX = Math.max(16, Math.min(...glyphs.map((w) => w.x)) - 16)
      const minY = Math.max(16, Math.min(...glyphs.map((w) => w.y)) - 20)
      const maxX = Math.min(W - 16, Math.max(...glyphs.map((w) => w.x + w.w)) + 16)
      const maxY = Math.min(H - 16, Math.max(...glyphs.map((w) => w.y + w.h)) + 24)

      if (maxX > minX + 60 && maxY > minY + 60) {
        bctx.save()
        bctx.fillStyle = '#ffffff'
        bctx.shadowColor = 'rgba(15, 23, 42, 0.04)'
        bctx.shadowBlur = 20
        bctx.shadowOffsetY = 8
        rr(bctx, minX, minY, maxX - minX, maxY - minY, [16, 16, 16, 16])
        bctx.fill()
        bctx.strokeStyle = 'rgba(226, 232, 240, 0.85)'
        bctx.lineWidth = 1.2
        bctx.stroke()
        bctx.restore()
      }
    }

    // images: proxy-load then draw
    if (images.length) onProgress('تنزيل الصور…', 0.6)
    const imgJobs = images.map(async (im) => {
      try {
        let url: string | null = null
        if (im.svg) {
          url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(im.svg)))
        } else if (im.src) {
          const abs = new URL(im.src, baseUrl).href
          url = `/api/img?url=${encodeURIComponent(abs)}`
        }
        if (!url) return
        const image = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = url!
          setTimeout(() => resolve(null), 9000)
        })
        if (!image) return
        im.box.image = image
        if (im.box.el) {
          im.box.el.image = image
        }
        const b = im.box
        ctx.save()
        ctx.globalAlpha = b.opacity
        rr(ctx, b.x, b.y, b.w, b.h, b.radius)
        ctx.clip()
        // cover/contain fit
        const ir = image.width / image.height
        const br = b.w / b.h
        let dw = b.w
        let dh = b.h
        if (b.imgFit === 'contain' ? ir > br : ir < br) {
          dh = b.w / ir
        } else {
          dw = b.h * ir
        }
        if (b.imgFit === 'fill') {
          dw = b.w
          dh = b.h
        }
        ctx.drawImage(image, b.x + (b.w - dw) / 2, b.y + (b.h - dh) / 2, dw, dh)
        ctx.restore()
      } catch {
        /* leave box fill */
      }
    })
    await Promise.all(imgJobs)

    onProgress('رسم النصوص…', 0.72)

    // glyphs
    ctx.textBaseline = 'alphabetic'
    for (const g of glyphs) {
      ctx.save()
      ctx.font = g.font
      ctx.fillStyle = g.color
      ctx.fillText(g.ch, g.x, g.base)
      if (g.underline) {
        ctx.fillRect(g.x, g.base + Math.max(1.5, g.h * 0.08), g.w, Math.max(1.5, g.h / 15))
      }
      ctx.restore()
    }

    onProgress('بناء المستوى…', 0.82)

    // ---- pass 3: grid build ----
    const GW = Math.ceil(W / CELL)
    const GH = Math.ceil(H / CELL)
    const layout = ctx.getImageData(0, 0, W, H)
    const lbuf = new Uint32Array(layout.data.buffer)

    const colors = new Uint32Array(GW * GH)
    if (CELL === 1) {
      // 1:1 Native Resolution: direct transfer preserving original vector element fidelity
      for (let i = 0; i < GW * GH; i++) {
        const c = lbuf[i]
        if ((c >>> 24) > 28) {
          colors[i] = c
        }
      }
    } else {
      // sample: dominant color of each 2x2 block (skip transparent)
      for (let cy = 0; cy < GH; cy++) {
        for (let cx = 0; cx < GW; cx++) {
          let best = 0
          let bestA = 0
          let r = 0
          let g = 0
          let b = 0
          let n = 0
          for (let sy = 0; sy < CELL; sy++) {
            const ly = Math.min(H - 1, cy * CELL + sy)
            for (let sx = 0; sx < CELL; sx++) {
              const lx = Math.min(W - 1, cx * CELL + sx)
              const c = lbuf[ly * W + lx]
              const a = c >>> 24
              if (a > bestA) {
                bestA = a
                best = c
              }
              if (a > 24) {
                r += c & 255
                g += (c >>> 8) & 255
                b += (c >>> 16) & 255
                n++
              }
            }
          }
          if (n > 0 && bestA > 40) {
            const rr2 = Math.round(r / n)
            const gg = Math.round(g / n)
            const bb = Math.round(b / n)
            const aa = bestA
            colors[cy * GW + cx] = (aa << 24) | (bb << 16) | (gg << 8) | rr2
          }
        }
      }
    }

    // ownership
    const owners = new Int32Array(GW * GH).fill(-1)
    const elements = new Map<number, LevelElement>()

    const markRect = (el: LevelElement, bx: number, by: number, bw: number, bh: number, rad: [number, number, number, number]) => {
      const cx0 = Math.max(0, Math.floor(bx / CELL))
      const cy0 = Math.max(0, Math.floor(by / CELL))
      const cx1 = Math.min(GW - 1, Math.ceil((bx + bw) / CELL) - 1)
      const cy1 = Math.min(GH - 1, Math.ceil((by + bh) / CELL) - 1)
      const maxr = Math.min(bw, bh) / 2
      const rtl = Math.min(rad[0], maxr)
      const rtr = Math.min(rad[1], maxr)
      const rbr = Math.min(rad[2], maxr)
      const rbl = Math.min(rad[3], maxr)
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
          const i = cy * GW + cx
          if (colors[i] === 0) continue
          // radius check (cell center)
          const wx = (cx + 0.5) * CELL
          const wy = (cy + 0.5) * CELL
          if (rtl > 0 && wx < bx + rtl && wy < by + rtl) {
            if (Math.hypot(wx - (bx + rtl), wy - (by + rtl)) > rtl) continue
          }
          if (rtr > 0 && wx > bx + bw - rtr && wy < by + rtr) {
            if (Math.hypot(wx - (bx + bw - rtr), wy - (by + rtr)) > rtr) continue
          }
          if (rbr > 0 && wx > bx + bw - rbr && wy > by + bh - rbr) {
            if (Math.hypot(wx - (bx + bw - rbr), wy - (by + bh - rbr)) > rbr) continue
          }
          if (rbl > 0 && wx < bx + rbl && wy > by + bh - rbl) {
            if (Math.hypot(wx - (bx + rbl), wy - (by + bh - rbl)) > rbl) continue
          }
          owners[i] = el.id
          el.cells.push(i)
        }
      }
      if (el.cells.length < (CELL === 1 ? 8 : 3)) {
        for (const i of el.cells) owners[i] = -1
        el.cells.length = 0
      }
    }

    for (const b of boxes) {
      if (b.el) markRect(b.el, b.x, b.y, b.w, b.h, b.radius)
    }

    // glyphs: rasterize masks
    const maskCv = document.createElement('canvas')
    const maskCtx = maskCv.getContext('2d', { willReadFrequently: true })!
    for (const g of glyphs) {
      const mw = Math.max(2, Math.ceil(g.w) + 2)
      const mh = Math.max(2, Math.ceil(g.h) + 2)
      if (maskCv.width < mw || maskCv.height < mh) {
        maskCv.width = Math.max(mw, maskCv.width, 64)
        maskCv.height = Math.max(mh, maskCv.height, 64)
      }
      maskCtx.clearRect(0, 0, maskCv.width, maskCv.height)
      maskCtx.font = g.font
      maskCtx.textBaseline = 'alphabetic'
      maskCtx.fillStyle = '#000'
      maskCtx.fillText(g.ch, 1, 1 + (g.base - g.y))
      const md = maskCtx.getImageData(0, 0, mw, mh).data
      const gx0 = Math.floor(g.x / CELL)
      const gy0 = Math.floor(g.y / CELL)
      const gCol = packColor(g.color)
      for (let py = 0; py < mh; py += CELL) {
        for (let px = 0; px < mw; px += CELL) {
          if (md[(py * mw + px) * 4 + 3] > 60) {
            const cx = gx0 + Math.floor((px - 1) / CELL)
            const cy = gy0 + Math.floor((py - 1) / CELL)
            if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue
            const i = cy * GW + cx
            if (colors[i] === 0) colors[i] = gCol
            if (owners[i] >= 0) {
              const prev = elements.get(owners[i])
              if (prev && prev !== g.el) {
                const k = prev.cells.indexOf(i)
                if (k >= 0) prev.cells.splice(k, 1)
              }
            }
            owners[i] = g.el.id
            if (!g.el.cells.includes(i)) g.el.cells.push(i)
          }
        }
      }

      // Solid baseline strip: ensures the entire text line / word is a rock-solid platform to walk on
      const baseCy = Math.floor((g.base - 1) / CELL)
      const cxStart = Math.max(0, Math.floor(g.x / CELL))
      const cxEnd = Math.min(GW - 1, Math.floor((g.x + g.w) / CELL))
      for (let cx = cxStart; cx <= cxEnd; cx++) {
        if (baseCy >= 0 && baseCy < GH) {
          const i = baseCy * GW + cx
          if (colors[i] === 0) colors[i] = gCol
          owners[i] = g.el.id
          if (!g.el.cells.includes(i)) g.el.cells.push(i)
        }
      }

      elements.set(g.el.id, g.el)
    }

    // images: override with actual image mask
    for (const im of images) {
      if (!im.box.image || !im.box.el) continue
      const b = im.box
      const iw = Math.max(2, Math.ceil(b.w))
      const ih = Math.max(2, Math.ceil(b.h))
      maskCtx.clearRect(0, 0, Math.max(maskCv.width, iw), Math.max(maskCv.height, ih))
      if (maskCv.width < iw) maskCv.width = iw
      if (maskCv.height < ih) maskCv.height = ih
      maskCtx.clearRect(0, 0, maskCv.width, maskCv.height)
      rr(maskCtx, 0, 0, iw, ih, b.radius)
      maskCtx.clip()
      if (b.image) maskCtx.drawImage(b.image, 0, 0, iw, ih)
      const md = maskCtx.getImageData(0, 0, iw, ih).data
      const gx0 = Math.floor(b.x / CELL)
      const gy0 = Math.floor(b.y / CELL)
      for (let py = 0; py < ih; py += CELL) {
        for (let px = 0; px < iw; px += CELL) {
          if (md[(py * iw + px) * 4 + 3] > 90) {
            const cx = gx0 + Math.floor(px / CELL)
            const cy = gy0 + Math.floor(py / CELL)
            if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue
            const i = cy * GW + cx
            if (colors[i] === 0) continue
            if (owners[i] >= 0 && owners[i] !== b.el!.id) {
              const prev = elements.get(owners[i])
              if (prev && prev.kind !== 'box') continue // don't steal from glyphs/text
              if (prev) {
                const k = prev.cells.indexOf(i)
                if (k >= 0) prev.cells.splice(k, 1)
              }
            }
            owners[i] = b.el!.id
            if (!b.el!.cells.includes(i)) b.el!.cells.push(i)
          }
        }
      }
    }

    // register box elements that got cells
    for (const b of boxes) {
      if (b.el && b.el.cells.length > 0) elements.set(b.el.id, b.el)
    }

    // Assemble Solid Bodies (Words, Boxes, Images)
    const bodies: SolidBody[] = []
    let bodyId = 0

    // 1) Words (from glyphs)
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
        tag: g.el.tag,
        semanticRole: g.el.semanticRole,
        href: g.el.href,
        damageDecals: [],
      }
      bodies.push(b)
    }

    // 2) Boxes & Images
    for (const bx of boxes) {
      if (!bx.el) continue // scenery
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
        tag: bx.el.tag,
        semanticRole: bx.el.semanticRole,
        href: bx.el.href,
        damageDecals: [],
      }
      bodies.push(b)
    }

    // title
    const title = idoc.title || baseUrl

    cleanup()

    return { W, H, bodies, colors, owners, elements, title, backdropCanvas: backdropCv }
  } catch (e) {
    cleanup()
    throw e
  }
}
