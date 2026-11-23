import type { Mode, Phase } from '../types'
import { companion, companionCss } from './companion.js'
import type { Kind } from './companion.js'
import { TONE, WORLD, clamp } from './worlds.js'

// Composes one world, the companion and the effects of what the session is doing.
// Pure vector, CSS animation only, no inline styles; well under the 131072 limit.

const PHASE: Record<Phase, { energy: number; drift: number }> = {
  idle: { energy: 0.45, drift: 1 },
  thinking: { energy: 0.8, drift: 1.6 },
  generating: { energy: 1, drift: 1.3 },
  tools: { energy: 1.4, drift: 1.2 },
  done: { energy: 0.8, drift: 1 },
  error: { energy: 0.5, drift: 0.8 },
}

const KNIGHT = { x: 380, y: 880, scale: 1.0 }
const KIND: Record<Mode, Kind> = { system: 'hunter', monarch: 'knight', dungeon: 'knight' }

export function buildScene(args: { mode: Mode; phase: Phase; pct: number; army: number }) {
  const { mode, phase } = args
  const tone = TONE[mode]
  const pct = clamp(args.pct, 0, 100)
  const p = PHASE[phase]
  const hot = pct >= 80 ? clamp((pct - 75) / 25, 0.2, 1) : 0
  const world = WORLD[mode]({ tone, energy: p.energy, drift: p.drift, pct, army: args.army })
  const isError = phase === 'error'
  const shock = isError ? '#FF4D63' : tone.glow2

  let speed = ''

  if (phase === 'tools') {
    for (let i = 0; i < 6; i++) {
      const y = 140 + i * 130
      speed += `<path class="speed sp${i}" d="M0 ${y} L${800 + i * 90} ${y - 40}"/>`
    }
  }
  const shockRing =
    phase === 'tools' || phase === 'done'
      ? `<circle class="${phase === 'done' ? 'big-ring' : 'shock'}" cx="${KNIGHT.x}" cy="${KNIGHT.y - 150}" r="60"/>`
      : ''
  const flash = phase === 'done' ? '<rect class="flash" width="1600" height="900" fill="url(#g-flash)"/>' : ''
  const hotV = hot > 0 ? `<rect width="1600" height="900" fill="url(#g-hot)" opacity="${(0.3 + hot * 0.5).toFixed(2)}"/>` : ''
  const errV = isError
    ? '<rect width="1600" height="900" fill="url(#g-err)" opacity="0.65"/><path class="err-crack" d="M0 380 L90 410 L130 470 L210 480 M1600 300 L1500 340 L1470 410 L1390 420"/>'
    : ''

  const css = `
@keyframes rise{0%{transform:translate(0,50px);opacity:0}25%{opacity:.85}60%{transform:translate(16px,-110px);opacity:.55}100%{transform:translate(-8px,-260px);opacity:0}}
.shock{fill:none;stroke:${shock};stroke-width:4;opacity:0;transform-origin:${KNIGHT.x}px ${KNIGHT.y - 150}px;animation:shock 3.4s ease-out infinite}
@keyframes shock{0%,14%{transform:scale(.4);opacity:0}20%{opacity:.8}100%{transform:scale(7);opacity:0}}
.big-ring{fill:none;stroke:${tone.glow2};stroke-width:5;opacity:0;transform-origin:${KNIGHT.x}px ${KNIGHT.y - 150}px;animation:bigring 2.6s ease-out 1 forwards}
@keyframes bigring{0%{transform:scale(.3);opacity:.95}100%{transform:scale(13);opacity:0}}
.speed{fill:none;stroke:${tone.glow2};stroke-width:2;stroke-linecap:round;stroke-dasharray:150 1500;stroke-dashoffset:1600;animation:dash 2.6s ease-out infinite}
.sp1{animation-delay:.4s}.sp2{animation-delay:.9s}.sp3{animation-delay:1.3s}.sp4{animation-delay:1.8s}.sp5{animation-delay:2.2s}
@keyframes dash{0%{stroke-dashoffset:1600;opacity:0}12%{opacity:1}65%,100%{stroke-dashoffset:-260;opacity:0}}
.flash{opacity:0;animation:flash 2.4s ease-out 1 forwards}
@keyframes flash{0%{opacity:0}10%{opacity:.75}100%{opacity:.1}}
.err-crack{fill:none;stroke:#FF4D63;stroke-width:3;stroke-linejoin:round;opacity:.7}
${companionCss({ glow: tone.glow, eye: tone.eye, rim: tone.rim })}
${world.css}`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<style>${css}</style>
<defs>
<linearGradient id="g-knight" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#1A0E36"/>
<stop offset="0.5" stop-color="#07030F"/>
<stop offset="1" stop-color="#020106"/>
</linearGradient>
<radialGradient id="g-aura" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="${tone.glow}" stop-opacity="0.5"/>
<stop offset="1" stop-color="${tone.glow}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="g-sky" x1="0" y1="0" x2="0.4" y2="1">
<stop offset="0" stop-color="${tone.sky[0]}"/>
<stop offset="0.55" stop-color="${tone.sky[1]}"/>
<stop offset="1" stop-color="${tone.sky[2]}"/>
</linearGradient>
<radialGradient id="g-moon" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="${tone.eye}" stop-opacity="0.6"/>
<stop offset="0.5" stop-color="${tone.glow2}" stop-opacity="0.28"/>
<stop offset="1" stop-color="${tone.glow}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="g-gate" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="${tone.glow2}" stop-opacity="0.45"/>
<stop offset="0.6" stop-color="${tone.glow}" stop-opacity="0.2"/>
<stop offset="1" stop-color="${tone.glow}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="g-mist" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="${tone.glow}" stop-opacity="0.3"/>
<stop offset="1" stop-color="${tone.glow}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="g-pillar" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#0A0418"/>
<stop offset="1" stop-color="#2A1060"/>
</linearGradient>
<radialGradient id="g-flash" cx="0.15" cy="0.85" r="1">
<stop offset="0" stop-color="${tone.eye}" stop-opacity="0.8"/>
<stop offset="1" stop-color="${tone.glow}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="g-hot" cx="0.5" cy="0.5" r="0.75">
<stop offset="0.6" stop-color="#FFB02E" stop-opacity="0"/>
<stop offset="1" stop-color="#FF6A3D" stop-opacity="0.6"/>
</radialGradient>
<radialGradient id="g-err" cx="0.5" cy="0.5" r="0.75">
<stop offset="0.6" stop-color="#FF4D63" stop-opacity="0"/>
<stop offset="1" stop-color="#FF4D63" stop-opacity="0.5"/>
</radialGradient>
</defs>
<rect width="1600" height="900" fill="url(#g-sky)"/>
<g class="stage">
${world.out}
${speed}
${shockRing}
${companion(phase, KIND[mode], KNIGHT)}
${hotV}${errV}${flash}
</g>
</svg>`
}
