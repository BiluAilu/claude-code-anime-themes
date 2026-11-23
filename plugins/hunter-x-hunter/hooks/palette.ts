import type { ThemeStyle } from 'claude-code'

import type { Mode } from '../types'
import { makeColors } from './make-colors.js'
import { mix } from './tint.js'

// Every look is a night look, so each is made for dark alone.
type Seed = {
  label: string
  surfaces: [string, string, string, string]
  text: [string, string, string]
  roles: { accent: string; danger: string; success: string; warning: string; pro: string }
  git: { added: string; removed: string; modified: string; merged: string }
  codeTheme: string
}

const SEEDS: Record<Mode, Seed> = {
  // Killua's deep black, graphite, electric blue and neon cyan.
  godspeed: {
    label: 'Hunter x Hunter - Godspeed',
    surfaces: ['#080A10', '#0E131C', '#171D29', '#1B2231'],
    text: ['#E9F2FA', '#C8D9EA', '#93A6BC'],
    roles: { accent: '#00A8FF', danger: '#FF4D63', success: '#2DD4A0', warning: '#F0B429', pro: '#347DFF' },
    git: { added: '#2DD4A0', removed: '#FF4D63', modified: '#00F0FF', merged: '#347DFF' },
    codeTheme: 'tokyo-night',
  },
  // Heavens Arena at dusk: violet sky and ember orange.
  arena: {
    label: 'Hunter x Hunter - Heavens Arena',
    surfaces: ['#0D0714', '#160C22', '#20122F', '#26163A'],
    text: ['#FFF1EA', '#EBCFC4', '#C2A396'],
    roles: { accent: '#FF7A45', danger: '#FF4D63', success: '#46D69A', warning: '#FFC857', pro: '#FF5E8A' },
    git: { added: '#46D69A', removed: '#FF4D63', modified: '#FFB35C', merged: '#FF5E8A' },
    codeTheme: 'night-owl',
  },
  // The Zoldyck estate at night: cold slate and silver.
  estate: {
    label: 'Hunter x Hunter - Zoldyck Estate',
    surfaces: ['#05070C', '#0B101A', '#131A28', '#182034'],
    text: ['#EEF3FF', '#C5D0E8', '#98A6C6'],
    roles: { accent: '#9FB4FF', danger: '#FF5A66', success: '#4CC9A8', warning: '#E6B65A', pro: '#B59CFF' },
    git: { added: '#4CC9A8', removed: '#FF5A66', modified: '#E6EDFF', merged: '#B59CFF' },
    codeTheme: 'tokyo-night',
  },
}

export const GLASS: Record<Mode, { tint: string; blur: number; opacity: number }> = {
  godspeed: { tint: '#0E131C', blur: 10, opacity: 0.6 },
  arena: { tint: '#160C22', blur: 10, opacity: 0.72 },
  estate: { tint: '#0B101A', blur: 10, opacity: 0.7 },
}

// The frosted glass over the backdrop is tinted by the character too.
export function glassFor(mode: Mode, accent: string) {
  return { ...GLASS[mode], tint: mix(GLASS[mode].tint, accent, 0.1) }
}

// The character sets the interface accent and tints the surfaces a little.
export function colorsFor(mode: Mode, accent: string) {
  const s = SEEDS[mode]
  const surf = s.surfaces.map(c => mix(c, accent, 0.07))

  return makeColors({
    label: s.label,
    only: 'dark',
    roles: { ...s.roles, accent: mix(s.roles.accent, accent, 0.75), pro: mix(s.roles.pro, accent, 0.35) },
    dark: {
      git: s.git,
      gray: {
        anchors: {
          'surface-0': surf[0] ?? s.surfaces[0],
          'surface-1': surf[1] ?? s.surfaces[1],
          'surface-2': surf[2] ?? s.surfaces[2],
          'surface-3': surf[3] ?? s.surfaces[3],
          'text-primary': s.text[0],
          'text-secondary': s.text[1],
          'text-muted': s.text[2],
        },
      },
    },
    codeTheme: { dark: s.codeTheme },
  })
}

type Hex = `#${string}`

const EDGE: Record<Mode, { line: Hex; user: Hex; reply: Hex; tool: Hex; head: Hex }> = {
  godspeed: { line: '#00A8FF', user: '#171D29', reply: '#070A12', tool: '#0B1019', head: '#00F0FF' },
  arena: { line: '#FF7A45', user: '#20122F', reply: '#0B0612', tool: '#140A1E', head: '#FFB35C' },
  estate: { line: '#7B8CD9', user: '#131A28', reply: '#04060B', tool: '#0A0F18', head: '#E6EDFF' },
}

// Near-solid message boxes keep words readable over the moving backdrop.
export function styleFor(mode: Mode, accent: string): ThemeStyle {
  const base = EDGE[mode]
  const e = { ...base, line: mix(base.line, accent, 0.6), head: mix(base.head, accent, 0.5) }
  const radius = mode === 'godspeed' ? 3 : mode === 'arena' ? 12 : 6

  return {
    Heading: { color: e.head, fontWeight: 'semibold', letterSpacing: 0.3 },
    UserMessage: {
      backgroundColor: e.user,
      color: '#F4F8FF',
      radius,
      borderColor: e.line,
      borderWidth: 1,
      paddingX: 14,
      paddingY: 10,
      shadow: { x: 0, y: 0, blur: 14, color: `${e.line}44` },
    },
    AssistantMessage: {
      backgroundColor: `${e.reply}F2`,
      color: '#F4F8FF',
      radius,
      borderColor: `${e.line}55`,
      borderWidth: 1,
      paddingX: 14,
      paddingY: 8,
    },
    ToolUse: {
      backgroundColor: e.tool,
      color: '#C5D6EA',
      radius: Math.max(3, radius - 3),
      paddingX: 10,
      borderColor: `${e.line}66`,
      borderWidth: 1,
    },
  }
}
