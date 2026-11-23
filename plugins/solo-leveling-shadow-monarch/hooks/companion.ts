import type { Phase, ToolKind } from '../types'
import { ART } from './art.js'
import type { Art } from './art.js'

// The companion is a traced silhouette (original art) in a different pose for each
// state, with an aura, afterimages and effects added in vector.
// A class on its group (c-idle, c-think, c-work, c-exec, c-done, c-err) drives motion.

export type CompanionTone = { glow: string; eye: string; rim: string }
export type Kind = 'knight' | 'hunter'

type Pose = { art: Art; head: [number, number]; slash?: string }

const KNIGHT: Record<'idle' | 'raised' | 'dash' | 'kneel', Pose> = {
  idle: { art: ART.knightIdle, head: [143, 30] },
  raised: { art: ART.knightRaised, head: [142, 96] },
  dash: { art: ART.knightDash, head: [262, 20], slash: 'M300 150 Q470 30 468 -40' },
  kneel: { art: ART.knightKneel, head: [112, 40] },
}

const HUNTER: Record<'idle' | 'dash', Pose> = {
  idle: { art: ART.hunterIdle, head: [117, 18] },
  dash: { art: ART.hunterDash, head: [270, 6], slash: 'M300 80 Q430 20 420 -30' },
}

function pick(kind: Kind, phase: Phase, tool: ToolKind): Pose {
  if (kind === 'hunter') {
    const isFast = phase === 'generating' || (phase === 'tools' && (tool === 'shell' || tool === 'mcp' || tool === 'edit'))

    return isFast ? HUNTER.dash : HUNTER.idle
  }

  if (phase === 'generating' || (phase === 'tools' && tool === 'edit')) {
    return KNIGHT.raised
  }

  if (phase === 'tools' && (tool === 'shell' || tool === 'mcp')) {
    return KNIGHT.dash
  }

  return phase === 'done' || phase === 'waiting' ? KNIGHT.kneel : KNIGHT.idle
}

export function companionCss(tone: CompanionTone) {
  return `
.k-body{fill:url(#g-knight);fill-rule:evenodd;stroke:${tone.rim};stroke-width:1.6;stroke-linejoin:round}
.k-ghost{fill:${tone.glow};fill-rule:evenodd;opacity:0}
.k-rune{fill:none;stroke:${tone.glow};stroke-width:2;stroke-dasharray:4 9;opacity:0}
.k-slash{fill:none;stroke:${tone.eye};stroke-width:6;stroke-linecap:round;stroke-dasharray:420;stroke-dashoffset:420;opacity:0}
.k-aura{fill:url(#g-aura);opacity:.55}
.k-under{fill:${tone.glow};opacity:.35}
.k-ring{fill:none;stroke:${tone.glow};stroke-width:3;opacity:0}
.k-rig{transform-box:fill-box;transform-origin:50% 100%}
.k-spin{transform-box:fill-box;transform-origin:50% 50%}
@keyframes k-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes k-spin{to{transform:rotate(360deg)}}
@keyframes k-aura{0%,100%{opacity:.35}50%{opacity:.85}}
@keyframes k-dash{0%,55%,100%{transform:translateX(0)}12%{transform:translateX(200px)}30%{transform:translateX(200px)}}
@keyframes k-ghost{0%,55%,100%{opacity:0}10%{opacity:.34}30%{opacity:.22}}
@keyframes k-slash{0%,10%{stroke-dashoffset:420;opacity:0}16%{opacity:1}34%{stroke-dashoffset:0;opacity:.9}60%,100%{stroke-dashoffset:-420;opacity:0}}
@keyframes k-ring{0%{transform:scale(.3);opacity:.9}100%{transform:scale(3.4);opacity:0}}
.c-idle .k-rig{animation:k-breathe 5s ease-in-out infinite}
.c-think .k-rig{animation:k-breathe 3s ease-in-out infinite}
.c-think .k-rune{opacity:.9;animation:k-spin 12s linear infinite}
.c-think .k-aura{animation:k-aura 3s ease-in-out infinite}
.c-work .k-rig{animation:k-breathe 2.4s ease-in-out infinite}
.c-work .k-aura{animation:k-aura 1.6s ease-in-out infinite}
.c-exec .k-rig{animation:k-dash 3.4s cubic-bezier(.2,.8,.2,1) infinite}
.c-exec .k-ghost{animation:k-ghost 3.4s ease-out infinite}
.c-exec .k-slash{animation:k-slash 3.4s ease-out infinite}
.c-exec .k-aura{opacity:.8}
.c-wait .k-rig{animation:k-breathe 4s ease-in-out infinite}
.c-wait .k-aura{opacity:.9;animation:k-aura 2.6s ease-in-out infinite}
.c-done .k-ring{animation:k-ring 2.4s ease-out 1 forwards}
.c-done .k-aura{opacity:.9}
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

export function companion(phase: Phase, kind: Kind, tool: ToolKind, at: { x: number; y: number; scale: number }) {
  const pose = pick(kind, phase, tool)
  const a = pose.art
  const ghosts =
    phase === 'tools' && (tool === 'shell' || tool === 'mcp')
      ? `<g class="k-ghost" transform="translate(-110,0)"><path d="${a.d}"/></g>`
      : ''
  const slash = phase === 'tools' && (tool === 'shell' || tool === 'mcp') && pose.slash ? `<path class="k-slash" d="${pose.slash}"/>` : ''
  const runes =
    phase === 'thinking' || phase === 'compacting'
      ? `<g class="k-spin"><circle class="k-rune" cx="${pose.head[0]}" cy="${pose.head[1]}" r="46"/></g><g class="k-spin"><circle class="k-rune" cx="${pose.head[0]}" cy="${pose.head[1]}" r="62"/></g>`
      : ''
  const ring =
    phase === 'done'
      ? `<circle class="k-ring" cx="${a.w / 2}" cy="${a.h * 0.55}" r="60"/>`
      : ''

  return `<g transform="translate(${at.x},${at.y}) scale(${at.scale})"><g class="${STATE[phase]}">
<ellipse class="k-under" cx="0" cy="2" rx="${Math.round(a.w * 0.55)}" ry="12"/>
<g transform="translate(${-a.w / 2},${-a.h})">
<ellipse class="k-aura" cx="${a.w / 2}" cy="${a.h * 0.5}" rx="${a.w * 0.9}" ry="${a.h * 0.75}"/>
${ring}${ghosts}
<g class="k-rig"><path class="k-body" d="${a.d}"/></g>
${runes}${slash}
</g>
</g></g>`
}
