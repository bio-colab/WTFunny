// Procedural WebAudio SFX engine - every sound synthesized, no external assets.
// Bus layout mirrors the original: fx / boom / ui with a master compressor.

type Ctx = AudioContext

export class SoundEngine {
  private ctx: Ctx | null = null
  private master: GainNode | null = null
  private busFx: GainNode | null = null
  private busBoom: GainNode | null = null
  private busUi: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private loops = new Map<string, { src: AudioBufferSourceNode; gain: GainNode }>()
  muted = false

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new AC({ latencyHint: 'interactive' })
    const comp = this.ctx.createDynamicsCompressor()
    comp.threshold.value = -10
    comp.knee.value = 8
    comp.ratio.value = 4
    comp.attack.value = 0.003
    comp.release.value = 0.2
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.85
    comp.connect(this.master)
    this.master.connect(this.ctx.destination)
    this.busFx = this.ctx.createGain()
    this.busBoom = this.ctx.createGain()
    this.busUi = this.ctx.createGain()
    this.busFx.connect(comp)
    this.busBoom.connect(comp)
    this.busUi.connect(comp)
    // white noise buffer (2s)
    const len = this.ctx.sampleRate * 2
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = this.noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  }

  setMuted(m: boolean) {
    this.muted = m
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.03)
  }

  private noise(dur: number): AudioBufferSourceNode | null {
    if (!this.ctx || !this.noiseBuf) return null
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuf
    src.loop = true
    src.start(this.ctx.currentTime, Math.random() * 1.5, dur + 0.05)
    return src
  }

  private env(gain: GainNode, t0: number, a: number, peak: number, d: number) {
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.linearRampToValueAtTime(peak, t0 + a)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d)
  }

  private out(bus: 'fx' | 'boom' | 'ui', pan: number): AudioNode | null {
    if (!this.ctx) return null
    const b = bus === 'boom' ? this.busBoom : bus === 'ui' ? this.busUi : this.busFx
    if (!b) return null
    if (this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner()
      p.pan.value = Math.max(-1, Math.min(1, pan))
      p.connect(b)
      return p
    }
    return b
  }

  // gunshot-ish: noise burst through lowpass + tiny click
  shot(kind: 'pistol' | 'smg' | 'shotgun' | 'drone' | 'gatling', vol = 1, pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const dur = kind === 'shotgun' ? 0.28 : kind === 'pistol' ? 0.14 : 0.09
    const n = this.noise(dur)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    const base = kind === 'shotgun' ? 1400 : kind === 'pistol' ? 2000 : 2600
    f.frequency.setValueAtTime(base, t)
    f.frequency.exponentialRampToValueAtTime(base * 0.25, t + dur)
    const g = ctx.createGain()
    this.env(g, t, 0.002, (kind === 'shotgun' ? 0.55 : 0.3) * vol, dur)
    n?.connect(f)
    f.connect(g)
    g.connect(o)
    // click transient
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(kind === 'shotgun' ? 320 : 700, t)
    const g2 = ctx.createGain()
    this.env(g2, t, 0.001, 0.12 * vol, 0.03)
    osc.connect(g2)
    g2.connect(o)
    osc.start(t)
    osc.stop(t + 0.05)
    if (kind === 'shotgun') {
      // low boom tail
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(110, t)
      osc2.frequency.exponentialRampToValueAtTime(45, t + 0.25)
      const g3 = ctx.createGain()
      this.env(g3, t, 0.004, 0.5 * vol, 0.25)
      osc2.connect(g3)
      g3.connect(this.out('boom', pan) ?? o)
      osc2.start(t)
      osc2.stop(t + 0.3)
    }
  }

  boom(power = 1, pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('boom', pan)
    if (!o) return
    const dur = 0.7 * power
    const n = this.noise(dur)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(3000, t)
    f.frequency.exponentialRampToValueAtTime(120, t + dur)
    const g = ctx.createGain()
    this.env(g, t, 0.005, 0.9 * power, dur)
    n?.connect(f)
    f.connect(g)
    g.connect(o)
    const sub = ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(160 * power, t)
    sub.frequency.exponentialRampToValueAtTime(30, t + dur * 0.9)
    const g2 = ctx.createGain()
    this.env(g2, t, 0.005, 0.8 * power, dur * 0.9)
    sub.connect(g2)
    g2.connect(o)
    sub.start(t)
    sub.stop(t + dur)
  }

  rail(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('boom', pan)
    if (!o) return
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(3800, t)
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.3)
    const g = ctx.createGain()
    this.env(g, t, 0.003, 0.5, 0.3)
    osc.connect(g)
    g.connect(o)
    osc.start(t)
    osc.stop(t + 0.35)
    const n = this.noise(0.25)
    const f = ctx.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 1200
    const g2 = ctx.createGain()
    this.env(g2, t, 0.002, 0.4, 0.25)
    n?.connect(f)
    f.connect(g2)
    g2.connect(o)
  }

  railCharge(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.exponentialRampToValueAtTime(1500, t + 0.5)
    const g = ctx.createGain()
    this.env(g, t, 0.1, 0.18, 0.45)
    osc.connect(g)
    g.connect(o)
    osc.start(t)
    osc.stop(t + 0.6)
  }

  whoosh(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const n = this.noise(0.5)
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.setValueAtTime(400, t)
    f.frequency.exponentialRampToValueAtTime(2400, t + 0.4)
    f.Q.value = 1.2
    const g = ctx.createGain()
    this.env(g, t, 0.03, 0.4, 0.45)
    n?.connect(f)
    f.connect(g)
    g.connect(o)
  }

  flameBurst(vol = 1, pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const n = this.noise(0.22)
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 900 + Math.random() * 700
    f.Q.value = 0.7
    const g = ctx.createGain()
    this.env(g, t, 0.02, 0.16 * vol, 0.2)
    n?.connect(f)
    f.connect(g)
    g.connect(o)
  }

  hit(kind: 'paper' | 'block' | 'image', vol = 1, pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const n = this.noise(0.08)
    const f = ctx.createBiquadFilter()
    f.type = kind === 'paper' ? 'highpass' : kind === 'image' ? 'bandpass' : 'lowpass'
    f.frequency.value = kind === 'paper' ? 2500 : kind === 'image' ? 1800 : 700
    const g = ctx.createGain()
    this.env(g, t, 0.001, (kind === 'block' ? 0.22 : 0.14) * vol, 0.07)
    n?.connect(f)
    f.connect(g)
    g.connect(o)
  }

  pop(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600 + Math.random() * 500, t)
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08)
    const g = ctx.createGain()
    this.env(g, t, 0.002, 0.2, 0.08)
    osc.connect(g)
    g.connect(o)
    osc.start(t)
    osc.stop(t + 0.1)
  }

  chutePop(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const n = this.noise(0.15)
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.setValueAtTime(600, t)
    f.frequency.exponentialRampToValueAtTime(1600, t + 0.12)
    const g = ctx.createGain()
    this.env(g, t, 0.004, 0.3, 0.14)
    n?.connect(f)
    f.connect(g)
    g.connect(o)
  }

  split(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(900, t)
    osc.frequency.exponentialRampToValueAtTime(2400, t + 0.15)
    const g = ctx.createGain()
    this.env(g, t, 0.005, 0.25, 0.15)
    osc.connect(g)
    g.connect(o)
    osc.start(t)
    osc.stop(t + 0.2)
  }

  jet(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const n = this.noise(0.3)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 800
    const g = ctx.createGain()
    this.env(g, t, 0.03, 0.1, 0.26)
    n?.connect(f)
    f.connect(g)
    g.connect(o)
  }

  // Magical arpeggio for the wand
  wandCast(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('boom', pan)
    if (!o) return
    const notes = [523, 659, 784, 1046, 1318]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const g = ctx.createGain()
      const t0 = t + i * 0.08
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5)
      osc.connect(g)
      g.connect(o)
      osc.start(t0)
      osc.stop(t0 + 0.55)
    })
  }

  wandBlast(power = 1, pan = 0) {
    this.boom(1.2 * power, pan)
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('boom', pan)
    if (!o) return
    ;[1318, 1568, 2093].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(0.12, t + 0.02 + i * 0.04)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
      osc.connect(g)
      g.connect(o)
      osc.start(t)
      osc.stop(t + 0.85)
    })
  }

  starHum(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('boom', pan)
    if (!o) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(60, t)
    osc.frequency.linearRampToValueAtTime(52, t + 2.5)
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 6.5
    const lg = ctx.createGain()
    lg.gain.value = 8
    lfo.connect(lg)
    lg.connect(osc.frequency)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.4, t + 0.3)
    g.gain.setValueAtTime(0.4, t + 2.2)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8)
    osc.connect(g)
    g.connect(o)
    osc.start(t)
    osc.stop(t + 2.9)
    lfo.start(t)
    lfo.stop(t + 2.9)
  }

  droneBeep(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('ui', pan)
    if (!o) return
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 1200
    const g = ctx.createGain()
    this.env(g, t, 0.005, 0.08, 0.09)
    osc.connect(g)
    g.connect(o)
    osc.start(t)
    osc.stop(t + 0.1)
  }

  switch(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('ui', pan)
    if (!o) return
    const n = this.noise(0.05)
    const f = ctx.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 1800
    const g = ctx.createGain()
    this.env(g, t, 0.001, 0.15, 0.05)
    n?.connect(f)
    f.connect(g)
    g.connect(o)
  }

  click() {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('ui', 0)
    if (!o) return
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 880
    const g = ctx.createGain()
    this.env(g, t, 0.001, 0.08, 0.04)
    osc.connect(g)
    g.connect(o)
    osc.start(t)
    osc.stop(t + 0.06)
  }

  start() {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('ui', 0)
    if (!o) return
    ;[392, 523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const g = ctx.createGain()
      const t0 = t + i * 0.09
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.linearRampToValueAtTime(0.14, t0 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4)
      osc.connect(g)
      g.connect(o)
      osc.start(t0)
      osc.stop(t0 + 0.45)
    })
  }

  complete() {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('ui', 0)
    if (!o) return
    ;[523, 659, 784, 1046, 784, 1046, 1318].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const g = ctx.createGain()
      const t0 = t + i * 0.13
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6)
      osc.connect(g)
      g.connect(o)
      osc.start(t0)
      osc.stop(t0 + 0.65)
    })
  }

  jump(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, t)
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.12)
    const g = ctx.createGain()
    this.env(g, t, 0.004, 0.12, 0.12)
    osc.connect(g)
    g.connect(o)
    osc.start(t)
    osc.stop(t + 0.15)
  }

  // Mid-air flip double-jump sound: rising sine whoosh with chirp
  flip(pan = 0) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('fx', pan)
    if (!o) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520, t)
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.16)
    const g = ctx.createGain()
    this.env(g, t, 0.003, 0.15, 0.16)
    osc.connect(g)
    g.connect(o)
    osc.start(t)
    osc.stop(t + 0.18)

    // Air swish
    const n = this.noise(0.14)
    if (n) {
      const f = ctx.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.setValueAtTime(1200, t)
      f.Q.value = 2
      const ng = ctx.createGain()
      this.env(ng, t, 0.005, 0.1, 0.14)
      n.connect(f)
      f.connect(ng)
      ng.connect(o)
    }
  }

  // Milestone announcement sound (e.g. 25%, 50%, 75%, 100% destroyed)
  milestone() {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('ui', 0)
    if (!o) return
    const notes = [587.33, 739.99, 880.0, 1174.66] // D5, F#5, A5, D6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = freq
      const g = ctx.createGain()
      const t0 = t + idx * 0.07
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.linearRampToValueAtTime(0.12, t0 + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35)
      osc.connect(g)
      g.connect(o)
      osc.start(t0)
      osc.stop(t0 + 0.38)
    })
  }

  // UI feedback chirp for Game Lab adjustments
  labBeep(pitchHigh = false) {
    this.ensure()
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const o = this.out('ui', 0)
    if (!o) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(pitchHigh ? 880 : 540, t)
    osc.frequency.exponentialRampToValueAtTime(pitchHigh ? 1320 : 720, t + 0.06)
    const g = ctx.createGain()
    this.env(g, t, 0.002, 0.09, 0.06)
    osc.connect(g)
    g.connect(o)
    osc.start(t)
    osc.stop(t + 0.08)
  }

  land(pan = 0) {
    this.hit('block', 0.7, pan)
  }
}

export const sound = new SoundEngine()

