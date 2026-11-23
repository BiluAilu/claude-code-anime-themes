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
  // Yato's midnight navy, divine blue and ice.
  shrine: {
    label: 'Noragami - Shrine Night',
    surfaces: ['#080F24', '#0C1630', '#101D3D', '#131F40'],
    text: ['#EAF5FF', '#B9D4EE', '#93ABCF'],
    roles: { accent: '#5F86FF', danger: '#E5566B', success: '#4CC9B0', warning: '#E2B65A', pro: '#8176D9' },
    git: { added: '#4CC9B0', removed: '#E5566B', modified: '#8CCEFF', merged: '#8176D9' },
    codeTheme: 'night-owl',
  },
  // The underworld river: murky teal and lantern red.
  farshore: {
    label: 'Noragami - Far Shore',
    surfaces: ['#05080C', '#0A1118', '#101B25', '#14222E'],
    text: ['#E8F4F6', '#B7D4D9', '#8CAAB1'],
    roles: { accent: '#3FB7C4', danger: '#FF5A5F', success: '#4CC9A0', warning: '#E8A94F', pro: '#9A8CE0' },
    git: { added: '#4CC9A0', removed: '#FF5A5F', modified: '#7FDCE6', merged: '#9A8CE0' },
    codeTheme: 'tokyo-night',
  },
  // Takamagahara: deep indigo and heavenly gold.
  heaven: {
    label: 'Noragami - Takamagahara',
    surfaces: ['#0A0D26', '#10143A', '#171B4A', '#1C215A'],
    text: ['#F6F3FF', '#CFCBEE', '#A5A1CF'],
    roles: { accent: '#8E96FF', danger: '#F0627A', success: '#5AD6B0', warning: '#FFD27A', pro: '#C9A8FF' },
    git: { added: '#5AD6B0', removed: '#F0627A', modified: '#FFD27A', merged: '#C9A8FF' },
    codeTheme: 'night-owl',
  },
}

export const GLASS: Record<Mode, { tint: string; blur: number; opacity: number }> = {
  shrine: { tint: '#0C1630', blur: 10, opacity: 0.66 },
  farshore: { tint: '#0A1118', blur: 10, opacity: 0.6 },
  heaven: { tint: '#10143A', blur: 10, opacity: 0.72 },
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
  shrine: { line: '#426BFF', user: '#101D3D', reply: '#070D20', tool: '#0A1228', head: '#8CCEFF' },
  farshore: { line: '#2A8F9C', user: '#101B25', reply: '#04080B', tool: '#09111A', head: '#FF8A8E' },
  heaven: { line: '#7B83E8', user: '#171B4A', reply: '#090C22', tool: '#0E1236', head: '#FFD27A' },
}

// Near-solid message boxes keep words readable over the moving backdrop.
export function styleFor(mode: Mode, accent: string): ThemeStyle {
  const base = EDGE[mode]
  const e = { ...base, line: mix(base.line, accent, 0.6), head: mix(base.head, accent, 0.5) }
  const radius = mode === 'shrine' ? 10 : mode === 'farshore' ? 4 : 14

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
