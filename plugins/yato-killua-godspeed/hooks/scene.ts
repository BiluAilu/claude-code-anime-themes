import type { Mode, Phase, ToolKind } from '../types'

// Cinematic scene, 1600x900, pure vector, CSS animation only.
// Yato (left): a great torii in Sekki light, rays, a haloed moon, drifting petals.
// Killua (right): Godspeed lightning, afterimages, speed streaks, a crest.

type Weights = { yato: number; bolt: number; period: number; drift: number; speed: number }

const BASE: Record<Phase, Weights> = {
  idle: { yato: 1, bolt: 0.35, period: 14, drift: 1, speed: 0 },
  thinking: { yato: 1.3, bolt: 0.45, period: 10, drift: 1.7, speed: 0 },
  generating: { yato: 1, bolt: 0.75, period: 7, drift: 1.3, speed: 0.35 },
  tools: { yato: 0.75, bolt: 1.15, period: 4.5, drift: 1.1, speed: 1 },
  done: { yato: 1.3, bolt: 0.45, period: 12, drift: 1, speed: 0 },
  error: { yato: 0.7, bolt: 0.8, period: 6, drift: 0.8, speed: 0 },
  waiting: { yato: 1, bolt: 0.2, period: 16, drift: 0.8, speed: 0 },
  compacting: { yato: 1.1, bolt: 0.3, period: 12, drift: 2.2, speed: 0 },
}

const MODE_SCALE: Record<Mode, { yato: number; bolt: number }> = {
  divine: { yato: 1.2, bolt: 0.15 },
  godspeed: { yato: 0.1, bolt: 1.3 },
  dual: { yato: 1, bolt: 1 },
}

const R_MAIN = 'M1500 0 L1530 150 L1476 196 L1546 372 L1490 420 L1560 620 L1512 664 L1572 900'
const R_B1 = 'M1530 150 L1590 236 L1562 280'
const R_B2 = 'M1490 420 L1420 500 L1446 548 L1398 610'
const R_B3 = 'M1546 372 L1482 330'
const L_MAIN = 'M60 0 L34 160 L84 206 L22 392 L74 440 L16 640 L58 690 L12 900'
const L_B1 = 'M84 206 L146 280 L118 326'
const L_B2 = 'M74 440 L140 520 L112 566'
// Mid-screen bolt that only a tool run reveals, high above the chat.
const T_MAIN = 'M1180 0 L1150 80 L1196 118 L1164 196'

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

function bolt(d: string, cls: string) {
  return `<g class="${cls}"><path class="halo" d="${d}"/><path class="mid" d="${d}"/><path class="core" d="${d}"/></g>`
}

function motes(count: number, drift: number, glow: number) {
  let css = ''
  let out = ''

  for (let i = 0; i < count; i++) {
    const x = ((i * 241 + 97) % 1480) + 60
    const y = ((i * 173 + 411) % 700) + 120
    const r = 1.6 + (i % 4) * 0.9
    const dur = ((12 + (i % 7) * 2.4) / drift).toFixed(1)
    const delay = (-((i * 1.9) % 15)).toFixed(1)
    css += `.m${i}{animation-duration:${dur}s;animation-delay:${delay}s}`
    out += `<circle class="mote m${i}" cx="${x}" cy="${y}" r="${r.toFixed(1)}" opacity="${glow.toFixed(2)}"/>`
  }

  return { css, out }
}

function speedLines(show: boolean, power: number) {
  if (!show) {
    return { css: '', out: '' }
  }
  const ys = [120, 240, 380, 520, 640, 780]
  let css = ''
  let out = ''
  ys.forEach((y, i) => {
    css += `.s${i}{animation-delay:${(i * 0.37).toFixed(2)}s}`
    out += `<path class="speed s${i}" d="M0 ${y} L${760 + i * 90} ${y - 36}" opacity="${(0.7 * power).toFixed(2)}"/>`
  })

  return { css, out }
}

export function buildScene(args: { mode: Mode; phase: Phase; pct: number; tool: ToolKind; agents: number }) {
  const { mode, phase } = args
  const pct = clamp(args.pct, 0, 100)
  const w = BASE[phase]
  const m = MODE_SCALE[mode]
  const yato = clamp(w.yato * m.yato, 0, 1.6)
  const hot = pct >= 80 ? clamp((pct - 75) / 25, 0.2, 1) : 0
  const bolt0 = clamp(w.bolt * m.bolt + hot * 0.25, 0, 1.5)
  const isError = phase === 'error'
  const core = isError ? '#FFD0D6' : '#E6FEFF'
  const mid = isError ? '#FF6A7D' : '#00F0FF'
  const halo = isError ? '#FF3355' : '#0090FF'
  const yVis = clamp(yato, 0, 1)
  const bVis = clamp(m.bolt, 0, 1)
  const mo = motes(Math.round(8 + 22 * yVis), w.drift, 0.35 + 0.5 * yVis)
  const speedKind = phase !== 'tools' || args.tool === 'shell' || args.tool === 'mcp'
  const sp = speedLines(w.speed > 0 && m.bolt > 0.3 && speedKind, w.speed * m.bolt)
  const lo = (0.4 * bolt0).toFixed(2)
  const hi = clamp(bolt0, 0, 1).toFixed(2)
  const mi = (0.62 * bolt0).toFixed(2)

  // The effect follows the kind of the real tool that is running.
  let fx = ''

  if (phase === 'tools') {
    if (args.tool === 'mcp') {
      fx += '<path class="zapbolt" d="M1000 0 L960 140 L1010 180 L950 340 L1000 380 L940 560"/>'
    }

    if (args.tool === 'edit') {
      fx += '<path class="cut" d="M120 120 Q480 360 880 780"/><path class="cut cut2" d="M200 80 Q560 340 960 700"/>'
    }

    if (args.tool === 'read') {
      fx += '<circle class="sonar" cx="420" cy="300" r="40"/><circle class="sonar so2" cx="420" cy="300" r="40"/><circle class="sonar so3" cx="420" cy="300" r="40"/>'
    }

    if (args.tool === 'web') {
      fx += '<rect class="beam" x="386" y="0" width="68" height="240" fill="url(#g-beam)"/>'
    }

    if (args.tool === 'agent') {
      fx += '<ellipse class="summon" cx="420" cy="660" rx="150" ry="24"/><ellipse class="summon su2" cx="420" cy="660" rx="150" ry="24"/>'
    }
  }

  if (phase === 'waiting') {
    fx += '<circle class="wait-glow" cx="420" cy="300" r="300" fill="url(#g-wait)"/><circle class="wait-ring" cx="420" cy="300" r="180"/><circle class="wait-ring wr2" cx="420" cy="300" r="180"/>'
  }

  if (phase === 'compacting') {
    fx += '<rect width="1600" height="900" fill="url(#g-purge)" opacity="0.7"/><circle class="purge" cx="420" cy="300" r="320"/><circle class="purge pu2" cx="420" cy="300" r="320"/><circle class="purge pu3" cx="420" cy="300" r="320"/>'
  }
  let orbs = ''

  for (let i = 0; i < Math.min(args.agents, 6); i++) {
    orbs += `<g class="orbit ob${i}"><circle class="orb-halo" cx="${600 + (i % 3) * 22}" cy="300" r="20"/><circle class="orb" cx="${600 + (i % 3) * 22}" cy="300" r="8"/></g>`
  }

  const flash = phase === 'done' ? '<rect class="flash" width="1600" height="900" fill="url(#g-flash)"/>' : ''
  const hotV = hot > 0 ? `<rect width="1600" height="900" fill="url(#g-hot)" opacity="${(0.3 + hot * 0.5).toFixed(2)}"/>` : ''
  const errV = isError ? '<rect width="1600" height="900" fill="url(#g-err)" opacity="0.6"/>' : ''
  const godspeedLeft = mode !== 'divine'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<style>
.mote{fill:#BDE4FF;animation-name:rise;animation-iteration-count:infinite;animation-timing-function:ease-in-out}
${mo.css}
@keyframes rise{0%{transform:translate(0,50px);opacity:0}25%{opacity:.9}60%{transform:translate(18px,-110px);opacity:.6}100%{transform:translate(-8px,-260px);opacity:0}}
.ray{fill:url(#g-ray);transform-origin:420px 0;animation:sway 16s ease-in-out infinite}
.ray2{animation-duration:22s;animation-delay:-7s}
@keyframes sway{0%,100%{transform:rotate(-3deg);opacity:.55}50%{transform:rotate(4deg);opacity:1}}
.moon{animation:breathe 9s ease-in-out infinite}
.ring{fill:none;stroke:#8CCEFF;stroke-width:1.6;stroke-dasharray:3 14;transform-origin:420px 300px;animation:spin 140s linear infinite}
.ring-b{fill:none;stroke:#426BFF;stroke-width:1.2;opacity:.6}
.ring-c{fill:none;stroke:#8176D9;stroke-width:1;stroke-dasharray:40 22;transform-origin:420px 300px;animation:spin2 90s linear infinite;opacity:.7}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spin2{to{transform:rotate(-360deg)}}
.gate-glow{fill:none;stroke:#426BFF;stroke-width:34;stroke-linecap:round;stroke-linejoin:round;opacity:.22;animation:breathe 8s ease-in-out infinite}
.gate{fill:none;stroke:#D9EEFF;stroke-width:9;stroke-linecap:round;stroke-linejoin:round;opacity:.85}
.gate-edge{fill:none;stroke:#8CCEFF;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
@keyframes breathe{0%,100%{opacity:.55}50%{opacity:1}}
.aura{animation:breathe 9s ease-in-out infinite}
.halo{fill:none;stroke:${halo};stroke-width:30;stroke-linejoin:round;stroke-linecap:round;opacity:.3}
.mid{fill:none;stroke:${mid};stroke-width:9;stroke-linejoin:round;stroke-linecap:round;opacity:.8}
.core{fill:none;stroke:${core};stroke-width:3.2;stroke-linejoin:round;stroke-linecap:round}
.bolt{opacity:${mi};animation:pulse ${w.period}s ease-in-out infinite}
.bolt-b{opacity:${lo};animation:pulse ${(w.period * 1.45).toFixed(1)}s ease-in-out infinite;animation-delay:-2.2s}
.bolt-t{opacity:0;animation:strike ${(w.period * 0.9).toFixed(1)}s ease-in-out infinite;animation-delay:-1s}
.afterimage{opacity:.18;transform:translate(-26px,0);animation:pulse ${w.period}s ease-in-out infinite;animation-delay:.25s}
@keyframes pulse{0%,100%{opacity:${lo}}9%{opacity:${hi}}18%{opacity:${mi}}26%{opacity:${hi}}42%{opacity:${lo}}}
@keyframes strike{0%,86%,100%{opacity:0}90%{opacity:${hi}}95%{opacity:${lo}}}
.speed{fill:none;stroke:#00F0FF;stroke-width:2;stroke-linecap:round;stroke-dasharray:140 1500;stroke-dashoffset:1600;animation:dash 2.4s ease-out infinite}
${sp.css}
@keyframes dash{0%{stroke-dashoffset:1600;opacity:0}12%{opacity:1}65%,100%{stroke-dashoffset:-260;opacity:0}}
.crest{opacity:.8}
.zapbolt{fill:none;stroke:#00F0FF;stroke-width:5;stroke-linejoin:round;opacity:0;animation:zap 4.5s ease-in-out infinite}
@keyframes zap{0%,70%,100%{opacity:0}74%{opacity:1}78%{opacity:.2}82%{opacity:.9}90%{opacity:0}}
.cut{fill:none;stroke:#BDE4FF;stroke-width:9;stroke-linecap:round;stroke-dasharray:1300;stroke-dashoffset:1300;opacity:0;animation:cut 2.6s ease-out infinite}
.cut2{stroke-width:4;animation-delay:.2s}
@keyframes cut{0%,12%{stroke-dashoffset:1300;opacity:0}18%{opacity:1}40%{stroke-dashoffset:0;opacity:.9}70%,100%{stroke-dashoffset:-1300;opacity:0}}
.sonar{fill:none;stroke:#8CCEFF;stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:sonar 3s ease-out infinite}
.so2{animation-delay:1s}.so3{animation-delay:2s}
@keyframes sonar{0%{transform:scale(.4);opacity:.9}100%{transform:scale(9);opacity:0}}
.beam{opacity:.7;animation:breathe 2.4s ease-in-out infinite}
.summon{fill:none;stroke:#8CCEFF;stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:summon 2.6s ease-out infinite}
.su2{animation-delay:1.3s}
@keyframes summon{0%{transform:scale(.3);opacity:.9}100%{transform:scale(3.2);opacity:0}}
.wait-glow{animation:breathe 2.6s ease-in-out infinite}
.wait-ring{fill:none;stroke:#FFB02E;stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:waitring 2.6s ease-out infinite}
.wr2{animation-delay:1.3s}
@keyframes waitring{0%{transform:scale(.5);opacity:.8}100%{transform:scale(1.5);opacity:0}}
.purge{fill:none;stroke:#8CCEFF;stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:purge 2.4s ease-in infinite}
.pu2{animation-delay:.8s}.pu3{animation-delay:1.6s}
@keyframes purge{0%{transform:scale(1.6);opacity:0}30%{opacity:.8}100%{transform:scale(.1);opacity:0}}
.orbit{transform-origin:420px 300px;animation:orbit 22s linear infinite}
.ob1{animation-delay:-4s}.ob2{animation-delay:-8s}.ob3{animation-delay:-12s}.ob4{animation-delay:-16s}.ob5{animation-delay:-19s}
@keyframes orbit{to{transform:rotate(360deg)}}
.orb{fill:#EAF5FF}
.orb-halo{fill:#8CCEFF;opacity:.3}
.flash{opacity:0;animation:flash 2.4s ease-out 1 forwards}
@keyframes flash{0%{opacity:0}10%{opacity:.8}100%{opacity:.14}}
</style>
<defs>
<linearGradient id="g-beam" x1="0" y1="1" x2="0" y2="0">
<stop offset="0" stop-color="#8CCEFF" stop-opacity="0.7"/>
<stop offset="1" stop-color="#8CCEFF" stop-opacity="0"/>
</linearGradient>
<radialGradient id="g-wait" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="#FFB02E" stop-opacity="0.45"/>
<stop offset="1" stop-color="#FFB02E" stop-opacity="0"/>
</radialGradient>
<radialGradient id="g-purge" cx="0.26" cy="0.34" r="0.8">
<stop offset="0.3" stop-color="#000" stop-opacity="0"/>
<stop offset="1" stop-color="#000" stop-opacity="0.6"/>
</radialGradient>
<linearGradient id="g-sky" x1="0" y1="0" x2="0.6" y2="1">
<stop offset="0" stop-color="${mode === 'godspeed' ? '#05070D' : '#060C20'}"/>
<stop offset="0.5" stop-color="${mode === 'godspeed' ? '#0A0F1A' : '#0F1C42'}"/>
<stop offset="1" stop-color="${mode === 'divine' ? '#18285A' : '#0B1634'}"/>
</linearGradient>
<radialGradient id="g-aura" cx="0.26" cy="0.34" r="0.6">
<stop offset="0" stop-color="#5C86FF" stop-opacity="0.65"/>
<stop offset="0.5" stop-color="#426BFF" stop-opacity="0.2"/>
<stop offset="1" stop-color="#426BFF" stop-opacity="0"/>
</radialGradient>
<radialGradient id="g-moon" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="#EAF5FF" stop-opacity="0.95"/>
<stop offset="0.55" stop-color="#8CCEFF" stop-opacity="0.35"/>
<stop offset="1" stop-color="#8CCEFF" stop-opacity="0"/>
</radialGradient>
<linearGradient id="g-ray" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#8CCEFF" stop-opacity="0.38"/>
<stop offset="1" stop-color="#8CCEFF" stop-opacity="0"/>
</linearGradient>
<radialGradient id="g-edge" cx="0.97" cy="0.4" r="0.5">
<stop offset="0" stop-color="#00A8FF" stop-opacity="0.5"/>
<stop offset="1" stop-color="#00A8FF" stop-opacity="0"/>
</radialGradient>
<radialGradient id="g-edge-l" cx="0.03" cy="0.55" r="0.4">
<stop offset="0" stop-color="#00A8FF" stop-opacity="0.4"/>
<stop offset="1" stop-color="#00A8FF" stop-opacity="0"/>
</radialGradient>
<radialGradient id="g-flash" cx="0.5" cy="0.5" r="0.75">
<stop offset="0" stop-color="#E6FEFF" stop-opacity="0.7"/>
<stop offset="1" stop-color="#426BFF" stop-opacity="0"/>
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
<g opacity="${yVis.toFixed(2)}">
<rect class="aura" width="1600" height="900" fill="url(#g-aura)"/>
<polygon class="ray" points="380,0 470,0 700,900 120,900"/>
<polygon class="ray ray2" points="420,0 450,0 980,900 560,900"/>
<circle class="moon" cx="420" cy="300" r="120" fill="url(#g-moon)"/>
<circle class="ring-b" cx="420" cy="300" r="190"/>
<circle class="ring" cx="420" cy="300" r="232"/>
<circle class="ring-c" cx="420" cy="300" r="270"/>
<g transform="translate(0,20)">
<path class="gate-glow" d="M190 640 L190 330 M650 640 L650 330 M130 300 Q420 250 710 300 M170 372 L670 372 M150 300 L150 322 M690 300 L690 322"/>
<path class="gate" d="M190 640 L190 330 M650 640 L650 330 M130 300 Q420 250 710 300 M170 372 L670 372 M420 338 L420 372"/>
<path class="gate-edge" d="M190 640 L190 330 M650 640 L650 330 M130 300 Q420 250 710 300 M170 372 L670 372"/>
</g>
${mo.out}
</g>
<g opacity="${bVis.toFixed(2)}">
<rect width="1600" height="900" fill="url(#g-edge)" opacity="${(0.35 + 0.65 * clamp(bolt0, 0, 1)).toFixed(2)}"/>
${godspeedLeft ? `<rect width="1600" height="900" fill="url(#g-edge-l)" opacity="${(0.25 + 0.6 * clamp(bolt0, 0, 1)).toFixed(2)}"/>` : ''}
${sp.out}
<g class="afterimage"><path class="mid" d="${R_MAIN}"/></g>
${bolt(R_MAIN, 'bolt')}
${bolt(R_B1, 'bolt-b')}${bolt(R_B2, 'bolt-b')}${bolt(R_B3, 'bolt-b')}
${godspeedLeft ? `${bolt(L_MAIN, 'bolt-b')}${bolt(L_B1, 'bolt')}${bolt(L_B2, 'bolt')}` : ''}
${w.speed > 0.5 ? bolt(T_MAIN, 'bolt-t') : ''}
</g>
<g class="crest" transform="translate(1480,740)">
<circle cx="0" cy="0" r="46" fill="none" stroke="#8CCEFF" stroke-width="1.6" opacity=".7"/>
<circle cx="0" cy="0" r="38" fill="none" stroke="#00F0FF" stroke-width="1" opacity=".5"/>
<path d="M-22 -12 Q0 -22 22 -12 M-18 -2 L18 -2 M-14 -12 L-14 20 M14 -12 L14 20" fill="none" stroke="#EAF5FF" stroke-width="3" stroke-linecap="round" opacity=".8"/>
<path d="M6 -34 L-8 2 L2 2 L-6 34 L12 -6 L2 -6 Z" fill="#00F0FF" opacity=".85"/>
</g>
${fx}${orbs}
${hotV}${errV}${flash}
</svg>`
}
