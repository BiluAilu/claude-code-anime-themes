import type { Mode, Phase, ToolKind } from '../types'
import { ART } from './art.js'
import { place } from './place.js'
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
  waiting: { energy: 0.6, drift: 0.7 },
  compacting: { energy: 0.9, drift: 2.2 },
}

const KNIGHT = { x: 380, y: 880, scale: 1.0 }
const KIND: Record<Mode, Kind> = { system: 'hunter', monarch: 'knight', dungeon: 'knight' }

export function buildScene(args: { mode: Mode; phase: Phase; pct: number; army: number; tool: ToolKind; agents: number }) {
  const { mode, phase } = args
  const tone = TONE[mode]
  const pct = clamp(args.pct, 0, 100)
  const p = PHASE[phase]
  const hot = pct >= 80 ? clamp((pct - 75) / 25, 0.2, 1) : 0
  const world = WORLD[mode]({ tone, energy: p.energy, drift: p.drift, pct, army: args.army })
  const isError = phase === 'error'
  const shock = isError ? '#FF4D63' : tone.glow2

  // The effect follows the kind of the real tool that is running.
  const kx = KNIGHT.x
  const ky = KNIGHT.y
  let fx = ''

  if (phase === 'tools') {
    if (args.tool === 'shell' || args.tool === 'mcp') {
      for (let i = 0; i < 6; i++) {
        const y = 140 + i * 130
        fx += `<path class="speed sp${i}" d="M0 ${y} L${800 + i * 90} ${y - 40}"/>`
      }
    }

    if (args.tool === 'mcp') {
      fx += `<path class="bolt" d="M${kx + 260} 0 L${kx + 215} 150 L${kx + 262} 190 L${kx + 200} 360 L${kx + 246} 396 L${kx + 190} ${ky - 180}"/>`
    }

    if (args.tool === 'edit') {
      fx += `<path class="cut" d="M${kx - 170} ${ky - 520} Q${kx + 40} ${ky - 330} ${kx + 250} ${ky - 40}"/><path class="cut cut2" d="M${kx - 120} ${ky - 560} Q${kx + 100} ${ky - 340} ${kx + 300} ${ky - 120}"/>`
    }

    if (args.tool === 'read') {
      fx += `<circle class="sonar" cx="${kx}" cy="${ky - 200}" r="40"/><circle class="sonar so2" cx="${kx}" cy="${ky - 200}" r="40"/><circle class="sonar so3" cx="${kx}" cy="${ky - 200}" r="40"/>`
    }

    if (args.tool === 'web') {
      fx += `<rect class="beam" x="${kx - 34}" y="0" width="68" height="${ky - 60}" fill="url(#g-beam)"/>`
    }

    if (args.tool === 'agent') {
      fx += `<ellipse class="summon" cx="${kx + 40}" cy="${ky - 6}" rx="80" ry="16"/><ellipse class="summon su2" cx="${kx + 40}" cy="${ky - 6}" rx="80" ry="16"/>`
    }
  }

  if (phase === 'waiting') {
    fx += `<circle class="wait-glow" cx="${kx}" cy="${ky - 200}" r="260" fill="url(#g-wait)"/><circle class="wait-ring" cx="${kx}" cy="${ky - 200}" r="150"/><circle class="wait-ring wr2" cx="${kx}" cy="${ky - 200}" r="150"/>`
  }

  if (phase === 'compacting') {
    fx += `<rect width="1600" height="900" fill="url(#g-purge)" opacity="0.7"/><circle class="purge" cx="${kx}" cy="${ky - 200}" r="300"/><circle class="purge pu2" cx="${kx}" cy="${ky - 200}" r="300"/><circle class="purge pu3" cx="${kx}" cy="${ky - 200}" r="300"/>`
  }
  let summoned = ''

  for (let i = 0; i < Math.min(args.agents, 6); i++) {
    summoned += place([ART.soldierSpear, ART.soldierSword, ART.soldierBrute][i % 3] ?? ART.soldierSpear, {
      x: 600 + i * 64,
      y: 878,
      s: 0.85,
      cls: 'sum',
    })
  }
  const shockRing =
    (phase === 'tools' && (args.tool === 'shell' || args.tool === 'mcp')) || phase === 'done'
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
.sum{fill:#04020A;stroke:${tone.glow2};stroke-width:3;fill-rule:evenodd;animation:glow 3s ease-in-out infinite}
.bolt{fill:none;stroke:#00F0FF;stroke-width:5;stroke-linejoin:round;opacity:0;animation:zap 4.5s ease-in-out infinite}
@keyframes zap{0%,70%,100%{opacity:0}74%{opacity:1}78%{opacity:.2}82%{opacity:.9}90%{opacity:0}}
.cut{fill:none;stroke:${tone.glow2};stroke-width:9;stroke-linecap:round;stroke-dasharray:700;stroke-dashoffset:700;opacity:0;animation:cut 2.6s ease-out infinite}
.cut2{stroke-width:4;animation-delay:.2s}
@keyframes cut{0%,12%{stroke-dashoffset:700;opacity:0}18%{opacity:1}40%{stroke-dashoffset:0;opacity:.9}70%,100%{stroke-dashoffset:-700;opacity:0}}
.sonar{fill:none;stroke:${tone.glow2};stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:sonar 3s ease-out infinite}
.so2{animation-delay:1s}.so3{animation-delay:2s}
@keyframes sonar{0%{transform:scale(.4);opacity:.9}100%{transform:scale(9);opacity:0}}
.beam{opacity:.7;animation:glow 2.4s ease-in-out infinite}
.summon{fill:none;stroke:${tone.glow2};stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:summon 2.6s ease-out infinite}
.su2{animation-delay:1.3s}
@keyframes summon{0%{transform:scale(.3);opacity:.9}100%{transform:scale(3.2);opacity:0}}
.wait-glow{animation:glow 2.6s ease-in-out infinite}
.wait-ring{fill:none;stroke:#FFB02E;stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:waitring 2.6s ease-out infinite}
.wr2{animation-delay:1.3s}
@keyframes waitring{0%{transform:scale(.5);opacity:.8}100%{transform:scale(1.5);opacity:0}}
.purge{fill:none;stroke:${tone.glow2};stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:purge 2.4s ease-in infinite}
.pu2{animation-delay:.8s}.pu3{animation-delay:1.6s}
@keyframes purge{0%{transform:scale(1.6);opacity:0}30%{opacity:.8}100%{transform:scale(.1);opacity:0}}
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
<linearGradient id="g-beam" x1="0" y1="1" x2="0" y2="0">
<stop offset="0" stop-color="${tone.glow2}" stop-opacity="0.7"/>
<stop offset="1" stop-color="${tone.glow2}" stop-opacity="0"/>
</linearGradient>
<radialGradient id="g-wait" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="#FFB02E" stop-opacity="0.45"/>
<stop offset="1" stop-color="#FFB02E" stop-opacity="0"/>
</radialGradient>
<radialGradient id="g-purge" cx="0.2" cy="0.65" r="0.8">
<stop offset="0.3" stop-color="#000" stop-opacity="0"/>
<stop offset="1" stop-color="#000" stop-opacity="0.6"/>
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
${fx}${summoned}
${shockRing}
${companion(phase, KIND[mode], args.tool, KNIGHT)}
${hotV}${errV}${flash}
</g>
</svg>`
}
