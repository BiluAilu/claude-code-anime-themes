import type { Mode } from '../types'
import { ART } from './art.js'
import { place } from './place.js'
import { mix } from './tint.js'

// Three worlds, each its own layered scene (far, middle, near), built from traced
// original silhouettes plus vector glow, mist, particles and light.

export type Tone = {
  sky: [string, string, string]
  glow: string
  glow2: string
  eye: string
  rim: string
  ink: string
}

export const TONE: Record<Mode, Tone> = {
  godspeed: { sky: ['#04060C', '#081426', '#0B2548'], glow: '#00A8FF', glow2: '#00F0FF', eye: '#E6FEFF', rim: '#00A8FF', ink: '#05080F' },
  arena: { sky: ['#170A2A', '#3B1655', '#C0502A'], glow: '#FF5E8A', glow2: '#FFB35C', eye: '#FFF1DD', rim: '#FF7A45', ink: '#0B0612' },
  estate: { sky: ['#04050A', '#0D1220', '#1A2440'], glow: '#9FB4FF', glow2: '#E6EDFF', eye: '#FFFFFF', rim: '#7B8CD9', ink: '#05070C' },
}

// The world's lights move toward the character's own color; the sky and scenery keep their identity.
export function tintTone(t: Tone, accent: string): Tone {
  return {
    sky: [mix(t.sky[0], accent, 0.08), mix(t.sky[1], accent, 0.12), mix(t.sky[2], accent, 0.14)],
    glow: mix(t.glow, accent, 0.4),
    glow2: mix(t.glow2, accent, 0.22),
    eye: t.eye,
    rim: mix(t.rim, accent, 0.4),
    ink: t.ink,
  }
}

export type Layer = { css: string; out: string }

export type WorldArgs = {
  tone: Tone
  energy: number
  drift: number
  pct: number
  army: number
  fails: number
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

// Rising particles; each gets its own class so there is no inline style.
export function motes(prefix: string, count: number, drift: number, fill: string, size = 1) {
  let css = `.${prefix}{fill:${fill};animation-name:rise;animation-iteration-count:infinite;animation-timing-function:ease-in-out}`
  let out = ''

  for (let i = 0; i < count; i++) {
    const x = ((i * 241 + 97) % 1500) + 50
    const y = ((i * 173 + 411) % 640) + 180
    const r = (1.2 + (i % 4) * 0.8) * size
    const dur = ((10 + (i % 7) * 2.3) / drift).toFixed(1)
    const delay = (-((i * 1.9) % 15)).toFixed(1)
    css += `.${prefix}${i}{animation-duration:${dur}s;animation-delay:${delay}s}`
    out += `<circle class="${prefix} ${prefix}${i}" cx="${x}" cy="${y}" r="${r.toFixed(1)}"/>`
  }

  return { css, out }
}

function mist(y: number, h: number, dur: number, cls: string, delay = 0) {
  return {
    css: `.${cls}{animation:mist ${dur}s ease-in-out infinite;animation-delay:${-delay}s}`,
    out: `<ellipse class="${cls}" cx="800" cy="${y}" rx="1100" ry="${h}" fill="url(#g-mist)"/>`,
  }
}

const MIST_KEYFRAMES = '@keyframes mist{0%,100%{transform:translateX(-90px)}50%{transform:translateX(90px)}}'

const COMMON = (t: Tone) => `
@keyframes glow{0%,100%{opacity:.75}50%{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes cheer{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.far{fill:#070B14;stroke:${t.rim};stroke-width:1;stroke-opacity:.3;opacity:.95;fill-rule:evenodd}
.sil{fill:#03050A;stroke:${t.rim};stroke-width:1.5;fill-rule:evenodd}
.sil-dim{fill:#06091A;stroke:${t.rim};stroke-width:1.2;stroke-opacity:.4;opacity:.9;fill-rule:evenodd}
.cloud{fill:${t.glow};opacity:.12;animation:cloud 60s linear infinite}
.cl2{animation-duration:90s;animation-delay:-30s}
@keyframes cloud{0%{transform:translateX(-300px)}100%{transform:translateX(300px)}}
`

// --------------------------------------------------------------- GODSPEED
export function godspeed(a: WorldArgs): Layer {
  const t = a.tone
  const m = motes('wg', Math.round(12 + 18 * a.energy), a.drift * 1.3, t.glow2, 0.9)
  const m1 = mist(800, 80, 30, 'mi1')
  const m2 = mist(850, 60, 20, 'mi2', 6)
  const en = clamp(a.energy, 0.3, 1.5)
  const lo = (0.12 + 0.12 * en).toFixed(2)
  const hi = clamp(0.45 + 0.4 * en, 0, 1).toFixed(2)
  const period = (14 - en * 7).toFixed(1)
  let charge = ''
  const n = clamp(a.army, 0, 12)

  for (let i = 0; i < n; i++) {
    charge += place(ART.lightning2, { x: 1090 + i * 30, y: 880, s: 0.11, cls: 'charge' })
  }
  const css = `${COMMON(t)}
.moon-halo{animation:glow 9s ease-in-out infinite}
.moon-ring{fill:none;stroke:${t.glow2};stroke-width:3;opacity:.9}
.moon-ring2{fill:none;stroke:${t.glow};stroke-width:1.4;stroke-dasharray:3 14;transform-box:fill-box;transform-origin:50% 50%;animation:spin 140s linear infinite}
.moon{fill:#04060C;stroke:${t.glow};stroke-width:1.2;fill-rule:evenodd}
.bolt{fill:${t.glow2};stroke:${t.glow};stroke-width:12;stroke-opacity:.3;paint-order:stroke;fill-rule:evenodd;opacity:${lo};animation:flick ${period}s ease-in-out infinite}
.bb{animation-delay:-3.1s}.bc{animation-delay:-6.4s}
@keyframes flick{0%,100%{opacity:${lo}}6%{opacity:${hi}}12%{opacity:${lo}}18%{opacity:${hi}}30%{opacity:${lo}}}
.charge{fill:${t.glow2};fill-rule:evenodd;opacity:.9}
${m1.css}${m2.css}${MIST_KEYFRAMES}
${m.css}`
  const out = `
<circle class="moon-halo" cx="1180" cy="240" r="260" fill="url(#g-moon)"/>
<circle class="moon-ring" cx="1180" cy="240" r="124"/>
${place(ART.moon, { x: 1180, y: 240, s: 0.92, cls: 'moon', anchor: 'center' })}
<circle class="moon-ring2" cx="1180" cy="240" r="166"/>
<ellipse class="cloud" cx="760" cy="230" rx="260" ry="14"/>
<g transform="translate(800,904) scale(0.95,0.62)"><path class="far" d="${ART.cityRoofs.d}" transform="translate(-850,-506)"/></g>
<rect x="0" y="880" width="1600" height="20" fill="#05080F"/>
${place(ART.lightning2, { x: 980, y: 644, s: 1.15, cls: 'bolt' })}
${place(ART.lightning1, { x: 1330, y: 700, s: 1.25, cls: 'bolt bb' })}
${place(ART.lightning3, { x: 1500, y: 600, s: 1.07, cls: 'bolt bc' })}
${place(ART.skateboard, { x: 660, y: 884, s: 1.0, cls: 'sil' })}
${place(ART.yoyo, { x: 800, y: 884, s: 0.9, cls: 'sil' })}
${charge}
${m.out}
${m1.out}${m2.out}`

  return { css, out }
}

// ------------------------------------------------------------------ ARENA
export function arena(a: WorldArgs): Layer {
  const t = a.tone
  const m = motes('wa', Math.round(14 + 18 * a.energy), a.drift * 1.2, t.glow2, 1.1)
  const m1 = mist(820, 70, 24, 'mi1')
  const groups = 1 + (a.army >= 4 ? 1 : 0) + (a.army >= 8 ? 1 : 0)
  let crowd = ''

  for (let i = 0; i < groups; i++) {
    crowd += place(ART.crowd, { x: [560, 1000, 1480][i] ?? 560, y: 906, s: 1.15, cls: `crowd cheer${i}` })
  }
  const css = `${COMMON(t)}
.sun-halo{animation:glow 10s ease-in-out infinite}
.sun{fill:${t.glow2};opacity:.55}
.beam{fill:url(#g-ray);transform-origin:1230px 260px;animation:sweep 14s ease-in-out infinite}
.beam2{animation-duration:19s;animation-delay:-6s}
.beam3{animation-duration:23s;animation-delay:-12s}
@keyframes sweep{0%,100%{transform:rotate(-26deg);opacity:.6}50%{transform:rotate(24deg);opacity:1}}
.crowd{fill:#03050A;stroke:${t.glow2};stroke-width:3;stroke-opacity:.85;fill-rule:evenodd}
.cheer0{animation:cheer 1.6s ease-in-out infinite}
.cheer1{animation:cheer 1.3s ease-in-out infinite;animation-delay:-.5s}
.cheer2{animation:cheer 1.9s ease-in-out infinite;animation-delay:-1s}
${m1.css}${MIST_KEYFRAMES}
${m.css}`
  const out = `
<circle class="sun-halo" cx="700" cy="600" r="330" fill="url(#g-moon)"/>
${place(ART.moon, { x: 700, y: 600, s: 1.0, cls: 'sun', anchor: 'center' })}
<ellipse class="cloud" cx="700" cy="220" rx="280" ry="16"/>
<g transform="translate(800,904) scale(0.95,0.7)"><path class="far" d="${ART.cityRoofs.d}" transform="translate(-850,-506)"/></g>
<polygon class="beam" points="1218,260 1242,260 1500,-100 1100,-100"/>
<polygon class="beam beam2" points="1222,260 1238,260 1700,100 1500,-20"/>
<polygon class="beam beam3" points="1222,260 1238,260 700,60 900,-80"/>
${place(ART.arenaTower, { x: 1230, y: 890, s: 1.0, cls: 'sil' })}
${crowd}
${m.out}
${m1.out}`

  return { css, out }
}

// ----------------------------------------------------------------- ESTATE
export function estate(a: WorldArgs): Layer {
  const t = a.tone
  const m = motes('we', Math.round(8 + 10 * a.energy), a.drift * 0.7, t.glow2, 1)
  const m1 = mist(760, 110, 32, 'mi1')
  const m2 = mist(830, 90, 22, 'mi2', 8)
  const m3 = mist(885, 60, 16, 'mi3', 4)
  const css = `${COMMON(t)}
.moon-halo{animation:glow 11s ease-in-out infinite}
.moon-pale{fill:${t.glow2};opacity:.8}
.lamp-glow{fill:url(#g-lamp);animation:glow 5s ease-in-out infinite}
.gate{fill:#03050A;stroke:${t.rim};stroke-width:1.4;fill-rule:evenodd}
.search{fill:url(#g-ray);transform-origin:1230px 330px;animation:sweep 16s ease-in-out infinite}
.search2{animation-duration:22s;animation-delay:-8s}
@keyframes sweep{0%,100%{transform:rotate(-30deg);opacity:.4}50%{transform:rotate(30deg);opacity:.8}}
${m1.css}${m2.css}${m3.css}${MIST_KEYFRAMES}
${m.css}`
  const out = `
<circle class="moon-halo" cx="250" cy="200" r="230" fill="url(#g-moon)"/>
${place(ART.moon, { x: 250, y: 200, s: 0.8, cls: 'moon-pale', anchor: 'center' })}
<ellipse class="cloud" cx="760" cy="300" rx="280" ry="14"/>
<g transform="translate(800,900) scale(0.95,0.8)"><path class="far" d="${ART.mountain.d}" transform="translate(-850,-621)"/></g>
<rect x="0" y="886" width="1600" height="14" fill="#05070C"/>
<polygon class="search" points="1222,330 1238,330 1560,-60 1260,-120"/>
<polygon class="search search2" points="1222,330 1238,330 1000,-60 760,-100"/>
<ellipse class="lamp-glow" cx="1230" cy="690" rx="320" ry="280"/>
${place(ART.estateGate, { x: 1230, y: 888, s: 1.15, cls: 'gate' })}
${place(ART.yoyo, { x: 780, y: 886, s: 0.9, cls: 'sil' })}
${m.out}
${m1.out}${m2.out}
${m3.out}`

  return { css, out }
}

export const WORLD: Record<Mode, (a: WorldArgs) => Layer> = { godspeed, arena, estate }
