import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Built-in demo page: a rich parody SaaS page (Arabic+English) like the original's
// "Indestructible" demo. Designed to showcase all destruction mechanics.
function demoPage(): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>غير قابل للتدمير — الموقع الذي لا يمكن تدميره</title>
<style>
  * { box-sizing: border-box; }
  html { background: #ffffff; }
  body { margin: 0; font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #0f172a; }
  a { color: inherit; text-decoration: none; }
  nav { background: #0b1020; color: #fff; }
  .wrap { max-width: 1040px; margin: 0 auto; padding: 0 36px; }
  nav .wrap { display: flex; align-items: center; height: 64px; gap: 30px; }
  .logo { font-weight: 800; font-size: 20px; display: flex; align-items: center; gap: 10px; }
  .logo i { display: inline-block; width: 22px; height: 22px; border-radius: 6px; background: linear-gradient(135deg, #ff7a2e, #ff3d8b); }
  .links { display: flex; gap: 24px; font-size: 15px; color: #b6bfd6; margin-right: auto; }
  .cta { background: #fff; color: #0b1020; font-weight: 700; font-size: 14px; padding: 9px 16px; border-radius: 8px; }
  .hero { padding: 64px 0 48px; background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%); }
  .hero .wrap { display: grid; grid-template-columns: 1.05fr 1fr; gap: 48px; align-items: center; }
  .badge { display: inline-block; font-size: 13px; font-weight: 700; color: #c2410c; background: #ffedd5; border: 1px solid #fed7aa; padding: 6px 12px; border-radius: 99px; }
  h1 { font-size: 58px; line-height: 1.05; margin: 16px 0; font-weight: 800; }
  h1 em { font-style: normal; color: #ff3d8b; }
  .lede { font-size: 18px; line-height: 1.7; color: #475569; margin: 0 0 26px; max-width: 500px; }
  .btns { display: flex; gap: 12px; }
  .btn { display: inline-block; font-weight: 700; font-size: 16px; padding: 14px 22px; border-radius: 12px; }
  .btn.primary { background: #0f172a; color: #fff; box-shadow: 0 8px 20px -8px rgba(15,23,42,0.6); }
  .btn.ghost { background: #fff; border: 2px solid #e2e8f0; }
  .trust { margin-top: 34px; font-size: 13px; color: #94a3b8; }
  .trust b { display: inline-block; margin: 8px 18px 0 0; font-size: 17px; color: #64748b; }
  .mock { background: #0f172a; border-radius: 16px; padding: 14px; box-shadow: 0 30px 60px -20px rgba(15,23,42,0.45); }
  .mock .top { display: flex; gap: 7px; margin-bottom: 12px; }
  .mock .top i { width: 12px; height: 12px; border-radius: 50%; background: #ff5f57; }
  .mock .top i:nth-child(2) { background: #febc2e; }
  .mock .top i:nth-child(3) { background: #28c840; }
  .screen { background: #fff; border-radius: 10px; padding: 20px; }
  .stat { display: inline-block; width: 31%; margin-inline-end: 2%; padding: 12px; border-radius: 10px; background: #f1f5f9; }
  .stat small { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
  .stat b { font-size: 26px; }
  .bars { display: flex; align-items: flex-end; gap: 8px; height: 110px; margin-top: 14px; }
  .bars i { flex: 1; border-radius: 6px 6px 0 0; background: linear-gradient(180deg, #818cf8, #f472b6); }
  section.feats { padding: 54px 0 64px; background: #f8fafc; }
  h2 { font-size: 34px; margin: 0 0 10px; }
  .sub { color: #64748b; margin: 0 0 30px; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .card { border-radius: 14px; padding: 22px; border: 1px solid #e2e8f0; }
  .card h3 { margin: 12px 0 8px; font-size: 19px; }
  .card p { margin: 0; color: #475569; line-height: 1.7; font-size: 14.5px; }
  .ic { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .c1 { background: #fef9c3; } .c2 { background: #dcfce7; } .c3 { background: #dbeafe; }
  footer { background: #0b1020; color: #94a3b8; padding: 26px 0; font-size: 13.5px; }
  footer b { color: #fff; }
</style>
</head>
<body>
<nav>
  <div class="wrap">
    <div class="logo"><i></i> غير قابل للتدمير</div>
    <div class="links"><span>المنتج</span><span>الحماية</span><span>الأسعار</span><span>الوثائق</span></div>
    <span class="cta">تسجيل الدخول</span>
  </div>
</nav>
<div class="hero">
  <div class="wrap">
    <div>
      <span class="badge">جديد · الآن بدرع أقوى بـ 100%</span>
      <h1>الموقع الذي <em>لا يمكن</em> تدميره.</h1>
      <p class="lede">بنية HTML مدرّعة عسكرياً، وCSS مقاوم للرصاص، وتنسيق ثابت لم يتحرك بكسل واحد منذ إطلاقه. تفضّل وجرّب أن تكسرها.</p>
      <div class="btns">
        <span class="btn primary">ابدأ مجاناً</span>
        <span class="btn ghost">احجز عرضاً</span>
      </div>
      <div class="trust">موثوق من فرق تحب مواقعها حقاً <b>NORTHWIND</b> <b>GLOBEX</b> <b>INITECH</b> <b>UMBRELLA</b></div>
    </div>
    <div class="mock">
      <div class="top"><i></i><i></i><i></i></div>
      <div class="screen">
        <span class="stat"><small>الجاهزية</small><b>100%</b></span>
        <span class="stat"><small>الأضرار</small><b>0.00</b></span>
        <span class="stat"><small>التهديدات</small><b>1</b></span>
        <div class="bars">
          <i style="height:35%"></i><i style="height:55%"></i><i style="height:42%"></i>
          <i style="height:70%"></i><i style="height:88%"></i><i style="height:64%"></i>
          <i style="height:94%"></i><i style="height:78%"></i>
        </div>
      </div>
    </div>
  </div>
</div>
<section class="feats">
  <div class="wrap">
    <h2>لماذا لا نتصدّع أبداً؟</h2>
    <p class="sub">ثلاث طبقات من الحماية أسطورية (بحسب فريق التسويق).</p>
    <div class="cards">
      <div class="card" style="background:#fefce8">
        <span class="ic c1">🛡️</span>
        <h3>فقرات مدعّمة</h3>
        <p>كل حرف ملحَد بخط القاعدة بلحام صناعي. لا شيء يسقط مهما اهتزّ الموقع. الضمانة تشمل الحروف المتحركة والأرقام.</p>
      </div>
      <div class="card" style="background:#f0fdf4">
        <span class="ic c2">🔒</span>
        <h3>تنسيق مقفول</h3>
        <p>الصناديق تبقى تماماً حيث وضعها المصمم. الجاذبية تم تعطيلها من أجلك — من نحن لنخترعها من جديد.</p>
      </div>
      <div class="card" style="background:#eff6ff">
        <span class="ic c3">🔥</span>
        <h3>صور تقاوم اللهب</h3>
        <p>صورنا مصنوعة من بكسلات مُطفأة الحرارة، تتحمل حتى 3000 درجة من أي قاذف. جرّب النار، ستعود إليك.</p>
      </div>
    </div>
  </div>
</section>
<footer>
  <div class="wrap">© 2026 <b>غير قابل للتدمير</b> — شركة وهمية لأغراض العرض. كل الحروف هنا قابلة للسقوط فعلياً.</div>
</footer>
</body>
</html>`
}

// Descriptive bot UA: many anti-bot services (e.g. Wikipedia) block generic
// browser UAs coming from cloud IPs, but happily serve descriptive bots.
const UA = 'DestroyAnyWebsiteDemo/1.0 (browser-game level exporter; +https://localhost)'
const MAX_BYTES = 4_000_000

// Freeze animations, kill scripts, inject base
function prepareHtml(html: string, baseUrl: string): string {
  const inject = `<base href="${baseUrl.replace(/"/g, '&quot;')}"><style id="daw-inject">
*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
html{scroll-behavior:auto!important}
.mw-jump-link,.navbox,.vector-menu,#mw-navigation,#siteNotice,.noprint,.mw-editsection,.reference,.citation-needed,.reflist,#catlinks,.mw-indicator,.cx-callout{display:none!important}
body{word-spacing:normal!important;letter-spacing:normal!important}
</style>`
  let out = html
  // strip scripts & iframes
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '')
  out = out.replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
  out = out.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  out = out.replace(/ on[a-z]+="[^"]*"/gi, '')
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, `<head$1>${inject}`)
  } else {
    out = inject + out
  }
  return out
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = (searchParams.get('url') || '').trim()
  if (!raw) return NextResponse.json({ error: 'أدخل عنوان موقع' }, { status: 400 })

  if (raw === 'demo') {
    return new NextResponse(demoPage(), { headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  let target: URL
  try {
    target = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    if (!/^https?:$/.test(target.protocol)) throw new Error()
  } catch {
    return NextResponse.json({ error: 'عنوان غير صالح' }, { status: 400 })
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 14000)
  try {
    const resp = await fetch(target.href, {
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml', 'accept-language': 'en,ar;q=0.9' },
      redirect: 'follow',
      signal: ctrl.signal,
    })
    if (!resp.ok) {
      clearTimeout(timer)
      return NextResponse.json({ error: `الموقع رد بالرمز ${resp.status}` }, { status: 502 })
    }
    const ct = resp.headers.get('content-type') || ''
    if (!/text\/html|application\/xhtml|text\/plain/i.test(ct)) {
      clearTimeout(timer)
      return NextResponse.json({ error: 'العنوان لا يُعيد صفحة HTML' }, { status: 415 })
    }
    let buf = await resp.arrayBuffer()
    clearTimeout(timer)
    if (buf.byteLength > MAX_BYTES) {
      buf = buf.slice(0, MAX_BYTES)
    }
    const charset = /charset=([\w-]+)/i.exec(ct)?.[1] ?? 'utf-8'
    let html = new TextDecoder(charset, { fatal: false }).decode(buf)
    html = prepareHtml(html, resp.url || target.href)
    return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } })
  } catch (e) {
    clearTimeout(timer)
    const msg = e instanceof Error && e.name === 'AbortError' ? 'انتهت المهلة أثناء جلب الموقع' : 'تعذّر الوصول إلى الموقع (قد يحجب الزوار أو يكون معطلاً)'
    return NextResponse.json({ error: msg }, { status: 504 })
  }
}
