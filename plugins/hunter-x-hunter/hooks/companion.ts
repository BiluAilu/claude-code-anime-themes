import type { Phase, ToolKind } from '../types'
import type { Member } from './cast.js'
import type { Pose } from './chars.js'

// The companion is a traced silhouette (original art) in a different pose for each
// state, glowing in its own color, with afterimages and a signature effect added in
// vector. A class on its group (c-idle, c-think, c-work, c-exec, c-done, c-err, c-wait,
// plus c-left when the dash faces left) drives the motion.

export type CompanionTone = { glow: string; eye: string; rim: string }

function pick(m: Member, phase: Phase, tool: ToolKind): Pose {
  if (phase === 'generating' || (phase === 'tools' && tool === 'edit')) {
    return m.poses.action
  }

  if (phase === 'tools' && (tool === 'shell' || tool === 'mcp')) {
    return m.poses.dash
  }

  return phase === 'done' || phase === 'waiting' ? m.poses.sit : m.poses.idle
}

export function companionCss(tone: CompanionTone, accent: string) {
  return `
.k-body{fill:url(#g-knight);fill-rule:evenodd;stroke:${tone.rim};stroke-width:1.6;stroke-linejoin:round}
.k-ghost{fill:${accent};fill-rule:evenodd;opacity:0}
.k-rune{fill:none;stroke:${accent};stroke-width:2;stroke-dasharray:4 9;opacity:0}
.k-slash{fill:none;stroke:${accent};stroke-width:6;stroke-linecap:round;stroke-dasharray:520;stroke-dashoffset:520;opacity:0}
.k-chain{fill:none;stroke:${accent};stroke-width:5;stroke-linecap:round;stroke-dasharray:14 9;opacity:0}
.k-rib{fill:none;stroke:${accent};stroke-width:9;stroke-linecap:round;stroke-dasharray:520;stroke-dashoffset:520;opacity:0}
.k-burst{fill:none;stroke:${accent};stroke-width:5;opacity:0;transform-box:fill-box;transform-origin:50% 50%}
.kb2{animation-delay:.6s}
.k-aura{fill:url(#g-aura);opacity:.55}
.k-under{fill:${accent};opacity:.35}
.k-ring{fill:none;stroke:${accent};stroke-width:3;opacity:0}
.k-rig{transform-box:fill-box;transform-origin:50% 100%}
.k-spin{transform-box:fill-box;transform-origin:50% 50%}
@keyframes k-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes k-spin{to{transform:rotate(360deg)}}
@keyframes k-aura{0%,100%{opacity:.35}50%{opacity:.85}}
@keyframes k-dash{0%,55%,100%{transform:translateX(0)}12%{transform:translateX(200px)}30%{transform:translateX(200px)}}
@keyframes k-dashl{0%,55%,100%{transform:translateX(0)}12%{transform:translateX(-200px)}30%{transform:translateX(-200px)}}
@keyframes k-ghost{0%,55%,100%{opacity:0}10%{opacity:.34}30%{opacity:.22}}
@keyframes k-slash{0%,10%{stroke-dashoffset:520;opacity:0}16%{opacity:1}34%{stroke-dashoffset:0;opacity:.9}60%,100%{stroke-dashoffset:-520;opacity:0}}
@keyframes k-chain{0%{stroke-dashoffset:0;opacity:.9}100%{stroke-dashoffset:-92;opacity:.9}}
@keyframes k-burst{0%{transform:scale(.3);opacity:.9}100%{transform:scale(3.4);opacity:0}}
@keyframes k-ring{0%{transform:scale(.3);opacity:.9}100%{transform:scale(3.4);opacity:0}}
.c-idle .k-rig{animation:k-breathe 5s ease-in-out infinite}
.c-think .k-rig{animation:k-breathe 3s ease-in-out infinite}
.c-think .k-rune{opacity:.9;animation:k-spin 12s linear infinite}
.c-think .k-aura{animation:k-aura 3s ease-in-out infinite}
.c-work .k-rig{animation:k-breathe 2.4s ease-in-out infinite}
.c-work .k-aura{animation:k-aura 1.6s ease-in-out infinite}
.c-exec .k-rig{animation:k-dash 3.4s cubic-bezier(.2,.8,.2,1) infinite}
.c-exec.c-left .k-rig{animation-name:k-dashl}
.c-exec .k-ghost{animation:k-ghost 3.4s ease-out infinite}
.c-exec .k-slash{animation:k-slash 3.4s ease-out infinite}
.c-exec .k-rib{animation:k-slash 3.4s ease-out infinite}
.c-exec .k-chain{animation:k-chain .7s linear infinite}
.c-exec .k-burst{animation:k-burst 1.2s ease-out infinite}
.c-exec .k-aura{opacity:.8}
.c-done .k-ring{animation:k-ring 2.4s ease-out 1 forwards}
.c-done .k-aura{opacity:.9}
.c-wait .k-rig{animation:k-breathe 4s ease-in-out infinite}
.c-wait .k-aura{opacity:.9;animation:k-aura 2.6s ease-in-out infinite}
.c-err .k-rig{animation:k-breathe 1.4s ease-in-out infinite}
`
}

const STATE: Record<Phase, string> = {
  idle: 'c-idle',
  thinking: 'c-think',
  generating: 'c-work',
  tools: 'c-exec',
  done: 'c-done',
  error: 'c-err',
  waiting: 'c-wait',
  compacting: 'c-think',
}

// The signature effect of a dash, drawn at the leading hand in the pose's own coordinates.
function dashEffect(m: Member, pose: Pose) {
  const [lx, ly] = pose.lead
  const d = pose.dir === 0 ? 1 : pose.dir

  if (m.dash === 'burst') {
    return `<circle class="k-burst" cx="${lx}" cy="${ly}" r="30"/><circle class="k-burst kb2" cx="${lx}" cy="${ly}" r="30"/>`
  }

  if (m.dash === 'chains') {
    return `<path class="k-chain" d="M${lx} ${ly} C${lx + d * 150} ${ly - 90} ${lx + d * 60} ${ly + 130} ${lx + d * 240} ${ly + 80}"/><path class="k-chain" d="M${lx} ${ly + 20} C${lx + d * 120} ${ly + 70} ${lx + d * 200} ${ly - 60} ${lx + d * 280} ${ly - 20}"/>`
  }

  if (m.dash === 'ribbon') {
    return `<path class="k-rib" d="M${lx} ${ly} C${lx + d * 130} ${ly - 120} ${lx + d * 40} ${ly + 120} ${lx + d * 230} ${ly + 60}"/>`
  }

  return `<path class="k-slash" d="M${lx} ${ly - 40} Q${lx + d * 130} ${ly + 30} ${lx + d * 30} ${ly + 190}"/>`
}

export function companion(phase: Phase, tool: ToolKind, m: Member, at: { x: number; y: number; scale: number }) {
  const pose = pick(m, phase, tool)
  const isDash = phase === 'tools' && (tool === 'shell' || tool === 'mcp')
  const d = pose.dir === 0 ? 1 : pose.dir
  // The afterimage doubles the pose, so the heaviest poses go without it.
  const ghosts = isDash && pose.d.length <= 9000 ? `<g class="k-ghost" transform="translate(${-d * 110},0)"><path d="${pose.d}"/></g>` : ''
  const fxs = isDash ? dashEffect(m, pose) : ''
  const runes =
    phase === 'thinking' || phase === 'compacting'
      ? `<g class="k-spin"><circle class="k-rune" cx="${pose.head[0]}" cy="${pose.head[1]}" r="46"/></g><g class="k-spin"><circle class="k-rune" cx="${pose.head[0]}" cy="${pose.head[1]}" r="62"/></g>`
      : ''
  const ring = phase === 'done' ? `<circle class="k-ring" cx="${pose.w / 2}" cy="${pose.h * 0.55}" r="60"/>` : ''
  const cls = `${STATE[phase]}${isDash && pose.dir < 0 ? ' c-left' : ''}`

  return `<g transform="translate(${at.x},${at.y}) scale(${at.scale * m.scale})"><g class="${cls}">
<ellipse class="k-under" cx="0" cy="2" rx="${Math.round(pose.w * 0.55)}" ry="12"/>
<g transform="translate(${-pose.w / 2},${-pose.h})">
<ellipse class="k-aura" cx="${pose.w / 2}" cy="${pose.h * 0.5}" rx="${pose.w * 0.9}" ry="${pose.h * 0.75}"/>
${ring}${ghosts}
<g class="k-rig"><path class="k-body" d="${pose.d}"/></g>
${runes}${fxs}
</g>
</g></g>`
}
