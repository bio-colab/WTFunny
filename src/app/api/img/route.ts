import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Image proxy: fetch remote image, return as data-feedable binary (avoids canvas taint)
const UA = 'DestroyAnyWebsiteDemo/1.0 (browser-game level exporter)'
const MAX_BYTES = 6_000_000

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = (searchParams.get('url') || '').trim()
  if (!raw) return new NextResponse('missing url', { status: 400 })
  let target: URL
  try {
    target = new URL(raw)
    if (!/^https?:$/.test(target.protocol)) throw new Error()
  } catch {
    return new NextResponse('bad url', { status: 400 })
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 9000)
  try {
    const resp = await fetch(target.href, {
      headers: { 'user-agent': UA, accept: 'image/*,*/*;q=0.8', referer: target.origin + '/' },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!resp.ok) return new NextResponse('upstream error', { status: 502 })
    const ct = resp.headers.get('content-type') || 'image/png'
    if (!/^image\//i.test(ct) && !/svg/i.test(ct)) return new NextResponse('not an image', { status: 415 })
    const buf = await resp.arrayBuffer()
    if (buf.byteLength > MAX_BYTES) return new NextResponse('too large', { status: 413 })
    return new NextResponse(buf, {
      headers: { 'content-type': ct, 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' },
    })
  } catch {
    clearTimeout(timer)
    return new NextResponse('fetch failed', { status: 504 })
  }
}
