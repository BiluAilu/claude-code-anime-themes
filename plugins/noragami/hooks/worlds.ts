import type { Mode } from '../types'
import { ART } from './art.js'
import { place } from './place.js'
import { ld, mix } from './tint.js'

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
  shrine: { sky: ['#050A1C', '#0C1A3A', '#16306A'], glow: '#426BFF', glow2: '#8CCEFF', eye: '#EAF5FF', rim: '#426BFF', ink: '#060C1C' },
  farshore: { sky: ['#03060A', '#07161D', '#0C2A33'], glow: '#2FA3B3', glow2: '#FF6A6F', eye: '#FFE0D8', rim: '#2A8F9C', ink: '#04080C' },
  heaven: { sky: ['#0B0F34', '#232A78', '#4A4FA8'], glow: '#8E96FF', glow2: '#FFD27A', eye: '#FFF6DD', rim: '#9AA1FF', ink: '#0A0D2C' },
}

// The same three worlds by day: pale skies with deeper, more saturated lights.
export const TONE_LIGHT: Record<Mode, Tone> = {
  shrine: { sky: ['#B9D2F6', '#D5E4FA', '#EEF4FD'], glow: '#4A6FE6', glow2: '#3B5BC9', eye: '#16306A', rim: '#4A6FE6', ink: '#DCE7F8' },
  farshore: { sky: ['#B8D5D9', '#D2E6E8', '#EAF3F3'], glow: '#2A98A8', glow2: '#D2525A', eye: '#4A1E22', rim: '#2A8F9C', ink: '#DDEBED' },
  heaven: { sky: ['#D3D6FA', '#E5E2FB', '#F6F0E4'], glow: '#7C86F0', glow2: '#D29A2C', eye: '#5A4410', rim: '#7C86F0', ink: '#E7E3F8' },
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
@keyframes wisp{0%{opacity:0;transform:translateY(30px)}25%{opacity:.55}100%{opacity:0;transform:translateY(-190px)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
.far{fill:${ld('#C2D0EC', '#07101E')};stroke:${t.rim};stroke-width:1;stroke-opacity:.3;opacity:.95;fill-rule:evenodd}
.sil{fill:${ld('#142049', '#03060E')};stroke:${t.rim};stroke-width:1.5;fill-rule:evenodd}
.sil-dim{fill:${ld('#9FB2DA', '#06101E')};stroke:${t.rim};stroke-width:1.2;stroke-opacity:.4;opacity:.9;fill-rule:evenodd}
.wisp{fill:${t.glow2};opacity:0;fill-rule:evenodd;animation:wisp 8s ease-out infinite}
.wi2{animation-delay:-3.5s}
.wi3{animation-delay:-6s}
.cloud{fill:${t.glow};opacity:.12;animation:cloud 60s linear infinite}
.cl2{animation-duration:90s;animation-delay:-30s}
@keyframes cloud{0%{transform:translateX(-300px)}100%{transform:translateX(300px)}}
.eyeglow{fill:${t.glow2};opacity:.9}
.ph{fill:#02050A;stroke:${t.rim};stroke-width:2;fill-rule:evenodd}
.coin{fill:${ld('#142049', '#03060E')};stroke:${t.glow2};stroke-width:3;fill-rule:evenodd}
.lamp{fill:url(#g-lamp)}
.gstrip{fill:${ld('#C2D0EC', '#060C1C')}}
@media (prefers-color-scheme: light){.floor{opacity:.55}.fl1{opacity:.7}.cloud{opacity:.35}}
`

function phantoms(n: number, xs: number[], y: number, cls = 'ph') {
  let out = ''

  for (let i = 0; i < Math.min(n, xs.length); i++) {
    const x = xs[i] ?? 0
    out += `<circle class="eyeglow" cx="${x}" cy="${y - 62}" r="26"/>${place(ART.phantomSmall, { x, y, s: 1, cls })}`
  }

  return out
}

// ----------------------------------------------------------------- SHRINE
export function shrine(a: WorldArgs): Layer {
  const t = a.tone
  const m = motes('wm', Math.round(12 + 16 * a.energy), a.drift, t.glow2)
  const m1 = mist(800, 80, 30, 'mi1')
  const m2 = mist(850, 70, 22, 'mi2', 8)
  const m3 = mist(885, 50, 16, 'mi3', 4)
  let coins = ''
  const n = clamp(a.army, 0, 14)

  for (let i = 0; i < n; i++) {
    coins += place(ART.coin, { x: 800 + i * 26, y: 884, s: 0.55, cls: 'coin' })
  }
  const css = `${COMMON(t)}
.moon-halo{animation:glow 11s ease-in-out infinite}
.moon-core{fill:${t.glow2};opacity:.55}
.moon-rim{fill:none;stroke:${t.glow2};stroke-width:1.4;stroke-dasharray:3 16;transform-box:fill-box;transform-origin:50% 50%;animation:spin 160s linear infinite}
.moon{fill:${ld('#F7FAFF', '#050A1A')};stroke:${t.glow};stroke-width:1.2;fill-rule:evenodd}
.lantern-lit{fill:url(#g-lamp);animation:glow 5s ease-in-out infinite}
${m1.css}${m2.css}${m3.css}${MIST_KEYFRAMES}
${m.css}`
  const out = `
<circle class="moon-halo" cx="1180" cy="240" r="240" fill="url(#g-moon)"/>
<circle class="moon-core" cx="1180" cy="240" r="104"/>
${place(ART.moon, { x: 1180, y: 240, s: 0.86, cls: 'moon', anchor: 'center' })}
<circle class="moon-rim" cx="1180" cy="240" r="150"/>
<ellipse class="cloud" cx="760" cy="230" rx="260" ry="14"/>
<ellipse class="cloud cl2" cx="1300" cy="360" rx="300" ry="12"/>
<g transform="translate(800,904) scale(0.95,0.42)"><path class="far" d="${ART.rooftops.d}" transform="translate(-850,-731)"/></g>
<rect class="gstrip" x="0" y="884" width="1600" height="16"/>
${place(ART.torii, { x: 1210, y: 880, s: 1.15, cls: 'sil' })}
<ellipse class="lantern-lit" cx="720" cy="590" rx="90" ry="110"/>
${place(ART.lantern, { x: 720, y: 884, s: 0.8, cls: 'sil' })}
<ellipse class="lantern-lit" cx="1530" cy="590" rx="90" ry="110"/>
${place(ART.lantern, { x: 1530, y: 884, s: 0.8, cls: 'sil' })}
${place(ART.shrine, { x: 960, y: 884, s: 1.0, cls: 'sil' })}
${coins}
${place(ART.wisp1, { x: 1090, y: 740, s: 0.9, cls: 'wisp' })}
${place(ART.wisp2, { x: 1370, y: 720, s: 0.8, cls: 'wisp wi2' })}
${place(ART.wisp1, { x: 560, y: 720, s: 0.7, cls: 'wisp wi3' })}
${phantoms(a.fails, [470, 600, 1060, 1330, 1480, 880], 884)}
${m.out}
${m1.out}${m2.out}
${m3.out}`

  return { css, out }
}

// --------------------------------------------------------------- FAR SHORE
export function farshore(a: WorldArgs): Layer {
  const t = a.tone
  const m = motes('wf', Math.round(10 + 14 * a.energy), a.drift * 0.7, t.glow, 1.1)
  const m1 = mist(740, 90, 28, 'mi1')
  const m2 = mist(800, 70, 20, 'mi2', 6)
  const lamps = [600, 820, 1560]
  let lamp = ''

  for (const x of lamps) {
    lamp += `<ellipse class="lamp" cx="${x}" cy="${790 - 232}" rx="95" ry="110"/>${place(ART.lantern, { x, y: 790, s: 0.7, cls: 'sil' })}`
  }
  let ripples = ''

  for (let i = 0; i < 7; i++) {
    ripples += `<path class="ripple rp${i % 4}" d="M${(i * 260) % 1500} ${780 + i * 17} h${160 + (i % 3) * 60}"/>`
  }
  const css = `${COMMON(t)}
.moon-halo{animation:glow 10s ease-in-out infinite}
.moon-core{fill:${t.glow2};opacity:.75}
.moon{fill:${ld('#FFF3EE', '#0A0206')};stroke:${t.glow2};stroke-width:1.2;fill-rule:evenodd}
.water{fill:url(#g-water)}
.ripple{fill:none;stroke:${t.glow};stroke-width:2;stroke-linecap:round;opacity:.35;animation:glow 4s ease-in-out infinite}
.rp1{animation-delay:-1s}.rp2{animation-delay:-2s}.rp3{animation-delay:-3s}
.refl{fill:#03080C;opacity:.22;fill-rule:evenodd}
.drift{animation:bob 6s ease-in-out infinite}
.dr2{animation-delay:-2s}.dr3{animation-delay:-4s}
${m1.css}${m2.css}${MIST_KEYFRAMES}
${m.css}`
  const out = `
<circle class="moon-halo" cx="640" cy="250" r="270" fill="url(#g-moon)"/>
<circle class="moon-core" cx="640" cy="250" r="108"/>
${place(ART.moon, { x: 640, y: 250, s: 0.9, cls: 'moon', anchor: 'center' })}
<ellipse class="cloud" cx="900" cy="200" rx="260" ry="14"/>
<rect class="water" x="0" y="770" width="1600" height="130"/>
${place(ART.torii, { x: 1180, y: 790, s: 1.05, cls: 'sil' })}
${place(ART.torii, { x: 1180, y: 790, s: 1.05, cls: 'refl', flipY: true })}
${place(ART.phantomTall, { x: 40, y: 800, s: 0.95, cls: 'ph' })}
${place(ART.phantomTall, { x: 1580, y: 800, s: 0.85, cls: 'ph', flip: true })}
${lamp}
${ripples}
<g class="drift"><circle class="eyeglow" cx="880" cy="508" r="26"/>${place(ART.phantomSmall, { x: 880, y: 570, s: 1, cls: 'ph' })}</g>
<g class="drift dr2"><circle class="eyeglow" cx="360" cy="448" r="26"/>${place(ART.phantomSmall, { x: 360, y: 510, s: 0.9, cls: 'ph' })}</g>
<g class="drift dr3"><circle class="eyeglow" cx="1400" cy="468" r="26"/>${place(ART.phantomSmall, { x: 1400, y: 530, s: 1.1, cls: 'ph' })}</g>
${phantoms(a.fails, [520, 760, 940, 1100, 1300, 200], 860)}
${place(ART.wisp2, { x: 780, y: 840, s: 0.9, cls: 'wisp' })}
${m.out}
${m1.out}${m2.out}`

  return { css, out }
}

// ------------------------------------------------------------------ HEAVEN
export function heaven(a: WorldArgs): Layer {
  const t = a.tone
  const m = motes('wh', Math.round(14 + 18 * a.energy), a.drift, t.glow2, 1.1)
  const m1 = mist(800, 100, 30, 'mi1')
  const m2 = mist(860, 80, 22, 'mi2', 8)
  let floor = ''

  for (let i = 0; i < 6; i++) {
    floor += `<ellipse class="floor fl${i % 3}" cx="${120 + i * 290}" cy="${850 + (i % 2) * 20}" rx="260" ry="48"/>`
  }
  const css = `${COMMON(t)}
.sun-halo{animation:glow 10s ease-in-out infinite}
.sun-core{fill:${t.glow2};opacity:.5}
.ringcloud{fill:${ld('#FFFFFF', '#F2EBFF')};stroke:${t.glow2};stroke-width:1.6;stroke-opacity:.6;opacity:.28;fill-rule:evenodd;transform-box:fill-box;transform-origin:50% 50%;animation:spin 240s linear infinite}
.ray{fill:url(#g-ray);transform-origin:1180px 300px;animation:sway 18s ease-in-out infinite}
.ray2{animation-duration:26s;animation-delay:-9s}
@keyframes sway{0%,100%{transform:rotate(-4deg);opacity:.5}50%{transform:rotate(5deg);opacity:1}}
.gate{fill:${ld('#1F2760', '#0A0D2C')};stroke:${t.glow2};stroke-width:2;fill-rule:evenodd}
.floor{fill:${ld('#FFFFFF', '#E9E2FF')};opacity:.1;animation:floatc 20s ease-in-out infinite}
.fl1{animation-delay:-7s;opacity:.14}.fl2{animation-delay:-13s}
@keyframes floatc{0%,100%{transform:translateX(-30px)}50%{transform:translateX(30px)}}
${m1.css}${m2.css}${MIST_KEYFRAMES}
${m.css}`
  const out = `
<polygon class="ray" points="1150,300 1210,300 1600,900 800,900"/>
<polygon class="ray ray2" points="1170,300 1190,300 1500,900 1000,900"/>
<circle class="sun-halo" cx="1180" cy="300" r="320" fill="url(#g-moon)"/>
<circle class="sun-core" cx="1180" cy="300" r="120"/>
${place(ART.cloudRing, { x: 1180, y: 300, s: 1.0, cls: 'ringcloud', anchor: 'center' })}
<ellipse class="cloud" cx="700" cy="220" rx="280" ry="16"/>
<ellipse class="cloud cl2" cx="1000" cy="560" rx="320" ry="14"/>
${place(ART.heavenGate, { x: 1180, y: 880, s: 1.2, cls: 'gate' })}
${floor}
${place(ART.wisp2, { x: 900, y: 760, s: 0.8, cls: 'wisp' })}
${place(ART.wisp1, { x: 1480, y: 740, s: 0.8, cls: 'wisp wi2' })}
${m.out}
${m1.out}${m2.out}`

  return { css, out }
}

export const WORLD: Record<Mode, (a: WorldArgs) => Layer> = { shrine, farshore, heaven }


// The tone as one CSS value per color that is the day color in light mode and the night
// color in dark mode, plus both plain tones for the few places that need one of them.
export function modeTone(mode: Mode, accent: string) {
  const dark = tintTone(TONE[mode], accent)
  const light = tintTone(TONE_LIGHT[mode], mix(accent, '#1A2452', 0.5))
  const tone: Tone = {
    sky: [ld(light.sky[0], dark.sky[0]), ld(light.sky[1], dark.sky[1]), ld(light.sky[2], dark.sky[2])],
    glow: ld(light.glow, dark.glow),
    glow2: ld(light.glow2, dark.glow2),
    eye: ld(light.eye, dark.eye),
    rim: ld(light.rim, dark.rim),
    ink: ld(light.ink, dark.ink),
  }

  return { tone, dark, light }
}
