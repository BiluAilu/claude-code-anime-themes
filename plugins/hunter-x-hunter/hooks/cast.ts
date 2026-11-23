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
  killua: {
    id: 'killua',
    name: 'Killua',
    accent: '#00F0FF',
    scale: 0.9,
    poses: { idle: CHARS.killuaIdle, action: CHARS.killuaClaws, dash: CHARS.killuaDash, sit: CHARS.killuaSit },
    edit: 'claws',
    dash: 'slash',
  },
  gon: {
    id: 'gon',
    name: 'Gon',
    accent: '#8DFF5A',
    scale: 0.84,
    poses: { idle: CHARS.gonIdle, action: CHARS.gonFist, dash: CHARS.gonDash, sit: CHARS.gonSit },
    edit: 'burst',
    dash: 'burst',
  },
  kurapika: {
    id: 'kurapika',
    name: 'Kurapika',
    accent: '#FF3355',
    scale: 0.97,
    poses: { idle: CHARS.kurapikaIdle, action: CHARS.kurapikaChains, dash: CHARS.kurapikaDash, sit: CHARS.kurapikaKneel },
    edit: 'chains',
    dash: 'chains',
  },
  leorio: {
    id: 'leorio',
    name: 'Leorio',
    accent: '#FFC857',
    scale: 1.08,
    poses: { idle: CHARS.leorioIdle, action: CHARS.leorioSwing, dash: CHARS.leorioDash, sit: CHARS.leorioSit },
    edit: 'slam',
    dash: 'slash',
  },
}

export const ROSTER: Who[] = ['killua', 'gon', 'kurapika', 'leorio']

// The other main characters, in roster order: who arrives as each subagent starts.
export function partyOf(who: Who): Who[] {
  return ROSTER.filter(w => w !== who)
}
