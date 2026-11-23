import type { Mode } from '../types'
import { ART } from './art.js'
import { place } from './place.js'

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
  system: { sky: ['#030812', '#071A33', '#0B2C52'], glow: '#2E9BFF', glow2: '#7FD0FF', eye: '#DFF4FF', rim: '#2E9BFF', ink: '#050E1E' },
  monarch: { sky: ['#05030C', '#12072A', '#220B46'], glow: '#9B4DFF', glow2: '#C58BFF', eye: '#E9D2FF', rim: '#7B2CFF', ink: '#07030F' },
  dungeon: { sky: ['#080102', '#2A040E', '#4E0B1C'], glow: '#FF2D55', glow2: '#FF8A3D', eye: '#FFD7C2', rim: '#C21E40', ink: '#0A0204' },
}

export type Layer = { css: string; out: string }

export type WorldArgs = {
  tone: Tone
  energy: number
  drift: number
  pct: number
  army: number
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
@keyframes wisp{0%{opacity:0;transform:translateY(30px)}25%{opacity:.5}100%{opacity:0;transform:translateY(-170px)}}
.far{fill:#0A0418;stroke:${t.rim};stroke-width:1;stroke-opacity:.3;opacity:.95;fill-rule:evenodd}
.sil{fill:#04020A;stroke:${t.rim};stroke-width:1.5;fill-rule:evenodd}
.sil-dim{fill:#07030F;stroke:${t.rim};stroke-width:1.2;stroke-opacity:.35;opacity:.9;fill-rule:evenodd}
.wisp{fill:${t.glow2};opacity:0;fill-rule:evenodd;animation:wisp 8s ease-out infinite}
.wi2{animation-delay:-3.5s}
.wi3{animation-delay:-6s}
`

// ---------------------------------------------------------------- MONARCH
export function monarch(a: WorldArgs): Layer {
  const t = a.tone
  const m = motes('wm', Math.round(10 + 14 * a.energy), a.drift, t.glow2)
  const m1 = mist(790, 90, 30, 'mi1')
  const m2 = mist(840, 70, 22, 'mi2', 8)
  const m3 = mist(880, 50, 16, 'mi3', 4)
  const sold = [ART.soldierSpear, ART.soldierSword, ART.soldierBrute]
  let army = ''
  const n = clamp(a.army, 0, 12)

  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 6)
    const x = 840 + (i % 6) * 80 + row * 40
    const y = 872 - row * 22
    army += place(sold[i % 3] ?? ART.soldierSpear, { x, y, s: 0.72, cls: 'sol' })
  }
  const css = `${COMMON(t)}
.moon-halo{animation:glow 11s ease-in-out infinite}
.moon-rim{fill:none;stroke:${t.glow2};stroke-width:1.4;stroke-dasharray:3 16;transform-box:fill-box;transform-origin:50% 50%;animation:spin 160s linear infinite}
.moon-core{fill:${t.glow};opacity:.8}
.moon{fill:#06030F;stroke:${t.glow};stroke-width:1.2;fill-rule:evenodd}
.cloud{fill:${t.glow};opacity:.12;animation:cloud 60s linear infinite}
.cl2{animation-duration:90s;animation-delay:-30s}
@keyframes cloud{0%{transform:translateX(-300px)}100%{transform:translateX(300px)}}
.win-glow{fill:url(#g-gate);animation:glow 6s ease-in-out infinite}
.sol{fill:#04020A;stroke:${t.rim};stroke-width:2;fill-rule:evenodd}
${m1.css}${m2.css}${m3.css}${MIST_KEYFRAMES}
${m.css}`
  const out = `
<circle class="moon-halo" cx="1020" cy="250" r="230" fill="url(#g-moon)"/>
<circle class="moon-core" cx="1020" cy="250" r="96"/>
${place(ART.moon, { x: 1020, y: 250, s: 0.66, cls: 'moon', anchor: 'center' })}
<circle class="moon-rim" cx="1020" cy="250" r="150"/>
<ellipse class="cloud" cx="760" cy="220" rx="260" ry="14"/>
<ellipse class="cloud cl2" cx="1200" cy="330" rx="300" ry="12"/>
${place(ART.castle, { x: 760, y: 800, s: 1.55, cls: 'far' })}
<rect x="0" y="796" width="1600" height="104" fill="#07030F"/>
${place(ART.arch, { x: 360, y: 880, s: 1.5, cls: 'sil-dim' })}
<ellipse class="win-glow" cx="1300" cy="520" rx="150" ry="230"/>
${place(ART.throne, { x: 1300, y: 880, s: 1.45, cls: 'sil' })}
${place(ART.wisp1, { x: 1180, y: 720, s: 0.9, cls: 'wisp' })}
${place(ART.wisp3, { x: 1420, y: 700, s: 0.9, cls: 'wisp wi2' })}
${place(ART.wisp1, { x: 560, y: 700, s: 0.7, cls: 'wisp wi3' })}
${m.out}
${m1.out}${m2.out}
${army}
${m3.out}`

  return { css, out }
}

// ----------------------------------------------------------------- SYSTEM
export function system(a: WorldArgs): Layer {
  const t = a.tone
  const m = motes('ws', Math.round(8 + 12 * a.energy), a.drift, t.glow2, 0.9)
  let city = ''
  let wins = ''
  let x = 0
  let i = 0

  while (x < 1600) {
    const w = 38 + ((i * 29) % 36)
    const h = 90 + ((i * 67) % 190)
    city += `M${x} 790 V${790 - h} H${x + w} V790 Z `

    for (let k = 0; k < 3; k++) {
      const wx = x + 8 + (k % 2) * 16
      const wy = 790 - h + 14 + ((k * 31 + i * 7) % Math.max(20, h - 40))
      wins += `<rect class="win w${(i + k) % 4}" x="${wx}" y="${wy}" width="5" height="7"/>`
    }
    x += w + 4
    i += 1
  }
  let rain = ''

  for (let r = 0; r < 8; r++) {
    const rx = r < 4 ? 40 + r * 34 : 1430 + (r - 4) * 40
    rain += `<path class="rain r${r}" d="M${rx} 0 V160"/>`
  }
  let grid = ''

  for (const gy of [800, 812, 828, 850, 880]) {
    grid += `<path d="M0 ${gy} H1600"/>`
  }

  for (let g = -6; g <= 6; g++) {
    grid += `<path d="M${800 + g * 40} 790 L${800 + g * 190} 900"/>`
  }
  const bar = Math.round(clamp(a.pct, 0, 100) * 2.2)
  const hot = a.pct >= 80
  const css = `${COMMON(t)}
.seal{fill:${t.glow2};opacity:.4;fill-rule:evenodd}
.gate-glow{fill:url(#g-gate);animation:glow 7s ease-in-out infinite}
.gate-in{fill:url(#g-gate);opacity:.9}
.portal{fill:#040A16;stroke:${t.glow2};stroke-width:2;fill-rule:evenodd}
.city{fill:${t.ink};stroke:${t.rim};stroke-width:.8;opacity:.98}
.win{fill:${t.glow2};opacity:.5}
.w0{animation:glow 4s ease-in-out infinite}
.w1{animation:glow 6s ease-in-out infinite;animation-delay:-2s}
.w2{opacity:.25}
.w3{animation:glow 9s ease-in-out infinite;animation-delay:-5s}
.grid{fill:none;stroke:${t.glow};stroke-width:1;opacity:.35}
.hud{fill:none;stroke:${t.glow2};stroke-width:3;stroke-linecap:square;opacity:.8}
.scan{fill:${t.glow2};opacity:.07;animation:scan 14s linear infinite}
@keyframes scan{0%{transform:translateY(-60px)}100%{transform:translateY(960px)}}
.panel{fill:#06142A;fill-opacity:.55;stroke:${t.glow};stroke-width:1.5}
.panel-h{fill:${t.glow};opacity:.5}
.bar-bg{fill:#0B2A52;opacity:.9}
.bar{fill:${hot ? '#FFB02E' : t.glow2}}
.tick{stroke:${t.glow2};stroke-width:1;opacity:.5}
.rain{fill:none;stroke:${t.glow2};stroke-width:2;stroke-dasharray:6 22;opacity:.4;animation:rain 3.2s linear infinite}
.r1{animation-delay:-.6s}.r2{animation-delay:-1.4s}.r3{animation-delay:-2.2s}.r4{animation-delay:-.9s}.r5{animation-delay:-1.7s}.r6{animation-delay:-2.6s}.r7{animation-delay:-.3s}
@keyframes rain{to{stroke-dashoffset:-280}}
${m.css}`
  const out = `
${place(ART.emblem, { x: 1430, y: 160, s: 0.9, cls: 'seal', anchor: 'center' })}
<ellipse class="gate-glow" cx="1250" cy="470" rx="320" ry="400"/>
<ellipse class="gate-in" cx="1250" cy="450" rx="150" ry="215"/>
${place(ART.portal, { x: 1250, y: 700, s: 1.35, cls: 'portal' })}
<path class="city" d="${city}"/>
${wins}
<g class="grid">${grid}</g>
${rain}
${m.out}
<rect class="scan" x="0" y="0" width="1600" height="60"/>
<g transform="translate(70,110)">
<rect class="panel" x="0" y="0" width="260" height="120"/>
<rect class="panel-h" x="0" y="0" width="260" height="14"/>
<rect class="bar-bg" x="20" y="60" width="220" height="14"/>
<rect class="bar" x="20" y="60" width="${bar}" height="14"/>
<path class="tick" d="M20 90 V100 M75 90 V100 M130 90 V100 M185 90 V100 M240 90 V100"/>
</g>
<path class="hud" d="M30 30 H90 M30 30 V90 M1570 30 H1510 M1570 30 V90 M30 870 H90 M30 870 V810 M1570 870 H1510 M1570 870 V810"/>`

  return { css, out }
}

// ---------------------------------------------------------------- DUNGEON
export function dungeon(a: WorldArgs): Layer {
  const t = a.tone
  const m = motes('wd', Math.round(14 + 18 * a.energy), a.drift * 1.5, t.glow2, 1.1)
  const m1 = mist(800, 90, 26, 'mi1')
  const m2 = mist(860, 60, 18, 'mi2', 6)
  const css = `${COMMON(t)}
.sun-halo{animation:glow 10s ease-in-out infinite}
.sun-core{fill:${t.glow};opacity:.8}
.sun{fill:#12040A;stroke:${t.glow};stroke-width:1.2;fill-rule:evenodd}
.sun-r{fill:none;stroke:${t.glow2};stroke-width:1.4;stroke-dasharray:2 14;transform-box:fill-box;transform-origin:50% 50%;animation:spin 120s linear infinite}
.ground{fill:#0A0204}
.crack{fill:none;stroke:${t.glow2};stroke-width:3;stroke-linejoin:round;opacity:.5;animation:glow 5s ease-in-out infinite}
.cr2{animation-delay:-2s}.cr3{animation-delay:-3.4s}
.crack-b{fill:none;stroke:${t.glow};stroke-width:12;stroke-linejoin:round;opacity:.14}
.stat{fill:#12040A;stroke:${t.rim};stroke-width:1.4;stroke-opacity:.6;fill-rule:evenodd}
.chain{fill:none;stroke:${t.rim};stroke-width:3;stroke-dasharray:10 8;opacity:.5;animation:sway 9s ease-in-out infinite;transform-origin:50% 0}
@keyframes sway{0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
${m1.css}${m2.css}${MIST_KEYFRAMES}
${m.css}`
  const out = `
<circle class="sun-halo" cx="1000" cy="250" r="260" fill="url(#g-moon)"/>
<circle class="sun-core" cx="1000" cy="250" r="100"/>
${place(ART.moon, { x: 1000, y: 250, s: 0.7, cls: 'sun', anchor: 'center' })}
<circle class="sun-r" cx="1000" cy="250" r="160"/>
<path class="chain" d="M560 0 V320 M600 0 V250 M1380 0 V300"/>
${place(ART.sentinel, { x: 40, y: 930, s: 1.7, cls: 'stat' })}
${place(ART.sentinel, { x: 1560, y: 930, s: 1.7, cls: 'stat', flip: true })}
<path class="ground" d="M0 820 L300 800 L700 830 L1100 805 L1600 825 V900 H0 Z"/>
<path class="crack-b" d="M240 900 L300 850 L380 880 L460 835 M900 900 L960 860 L1040 885 L1120 840 L1200 870"/>
<path class="crack" d="M240 900 L300 850 L380 880 L460 835"/>
<path class="crack cr2" d="M900 900 L960 860 L1040 885 L1120 840 L1200 870"/>
<path class="crack cr3" d="M560 900 L600 868 L660 890 L720 856"/>
${place(ART.wisp2, { x: 700, y: 880, s: 1.0, cls: 'wisp' })}
${place(ART.wisp2, { x: 1180, y: 880, s: 0.8, cls: 'wisp wi2' })}
${m.out}
${m1.out}${m2.out}`

  return { css, out }
}

export const WORLD: Record<Mode, (a: WorldArgs) => Layer> = { system, monarch, dungeon }
