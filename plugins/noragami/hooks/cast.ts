import type { Who } from '../types'
import { CHARS } from './chars.js'
import type { Pose } from './chars.js'

// The main characters. Each has four traced poses (idle, action, dash, sit), a glow
// color, a size, and the signature effect used for edits (edit) and fast tools (dash).

export type EditFx = 'claws' | 'sword' | 'blade' | 'wave' | 'burst' | 'chains' | 'slam' | 'ribbon'
export type DashFx = 'slash' | 'burst' | 'chains' | 'ribbon'

export type Member = {
  id: Who
  name: string
  accent: string
  scale: number
  poses: { idle: Pose; action: Pose; dash: Pose; sit: Pose }
  edit: EditFx
  dash: DashFx
}

export const CAST: Record<Who, Member> = {
  yato: {
    id: 'yato',
    name: 'Yato',
    accent: '#8CCEFF',
    scale: 0.96,
    poses: { idle: CHARS.yatoIdle, action: CHARS.yatoSword, dash: CHARS.yatoDash, sit: CHARS.yatoSit },
    edit: 'sword',
    dash: 'slash',
  },
  hiyori: {
    id: 'hiyori',
    name: 'Hiyori',
    accent: '#FFB3D1',
    scale: 0.9,
    poses: { idle: CHARS.hiyoriIdle, action: CHARS.hiyoriReach, dash: CHARS.hiyoriDash, sit: CHARS.hiyoriSit },
    edit: 'ribbon',
    dash: 'ribbon',
  },
  yukine: {
    id: 'yukine',
    name: 'Yukine',
    accent: '#C9F7FF',
    scale: 0.86,
    poses: { idle: CHARS.yukineIdle, action: CHARS.yukineBlade, dash: CHARS.yukineDash, sit: CHARS.yukineSit },
    edit: 'blade',
    dash: 'slash',
  },
  bishamon: {
    id: 'bishamon',
    name: 'Bishamon',
    accent: '#FFD27A',
    scale: 1.06,
    poses: { idle: CHARS.bishamonIdle, action: CHARS.bishamonSword, dash: CHARS.bishamonDash, sit: CHARS.bishamonKneel },
    edit: 'wave',
    dash: 'slash',
  },
}

export const ROSTER: Who[] = ['yato', 'hiyori', 'yukine', 'bishamon']

// The other main characters, in roster order: who arrives as each subagent starts.
export function partyOf(who: Who): Who[] {
  return ROSTER.filter(w => w !== who)
}
