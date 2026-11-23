import type { ThemeStyle } from 'claude-code'

import type { Mode } from '../types'
import { makeColors } from './make-colors.js'

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
  system: {
    label: 'Solo Leveling - The System',
    surfaces: ['#030812', '#071427', '#0B2038', '#0E2442'],
    text: ['#EAF6FF', '#BFD8EE', '#8FABC8'],
    roles: { accent: '#2E9BFF', danger: '#FF5470', success: '#35D6A3', warning: '#F0B429', pro: '#7C8CFF' },
    git: { added: '#35D6A3', removed: '#FF5470', modified: '#7FD0FF', merged: '#7C8CFF' },
    codeTheme: 'tokyo-night',
  },
  monarch: {
    label: 'Solo Leveling - Shadow Monarch',
    surfaces: ['#07040F', '#0D0720', '#150C30', '#1A1038'],
    text: ['#F3ECFF', '#CDBDEA', '#A793CB'],
    roles: { accent: '#9B4DFF', danger: '#F0546E', success: '#46D6A8', warning: '#E8B04F', pro: '#C58BFF' },
    git: { added: '#46D6A8', removed: '#F0546E', modified: '#C58BFF', merged: '#9B4DFF' },
    codeTheme: 'night-owl',
  },
  dungeon: {
    label: 'Solo Leveling - Double Dungeon',
    surfaces: ['#0A0305', '#14070C', '#1E0A12', '#240E17'],
    text: ['#FFEDEE', '#E3BFC4', '#BB959C'],
    roles: { accent: '#FF6A3D', danger: '#FF4D63', success: '#46D69A', warning: '#F0B429', pro: '#C58BFF' },
    git: { added: '#46D69A', removed: '#FF4D63', modified: '#FF8A3D', merged: '#C58BFF' },
    codeTheme: 'night-owl',
  },
}

export const GLASS: Record<Mode, { tint: string; blur: number; opacity: number }> = {
  system: { tint: '#071427', blur: 10, opacity: 0.6 },
  monarch: { tint: '#0D0720', blur: 10, opacity: 0.6 },
  dungeon: { tint: '#14070C', blur: 10, opacity: 0.6 },
}

export function colorsFor(mode: Mode) {
  const s = SEEDS[mode]

  return makeColors({
    label: s.label,
    only: 'dark',
    roles: s.roles,
    dark: {
      git: s.git,
      gray: {
        anchors: {
          'surface-0': s.surfaces[0],
          'surface-1': s.surfaces[1],
          'surface-2': s.surfaces[2],
          'surface-3': s.surfaces[3],
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

const EDGE: Record<Mode, { line: Hex; user: Hex; reply: Hex; tool: Hex }> = {
  system: { line: '#2E9BFF', user: '#0B2038', reply: '#050F1F', tool: '#06142A' },
  monarch: { line: '#7B2CFF', user: '#1A1038', reply: '#0A0518', tool: '#0D0720' },
  dungeon: { line: '#C21E40', user: '#240E17', reply: '#0E0407', tool: '#14070C' },
}

// Near-solid message boxes keep words readable over the moving backdrop.
export function styleFor(mode: Mode): ThemeStyle {
  const e = EDGE[mode]
  const radius = mode === 'system' ? 3 : mode === 'monarch' ? 12 : 6

  return {
    Heading: { color: mode === 'dungeon' ? '#FF9A6B' : mode === 'system' ? '#7FD0FF' : '#C58BFF', fontWeight: 'semibold', letterSpacing: 0.3 },
    UserMessage: {
      backgroundColor: e.user,
      color: '#F3ECFF',
      radius,
      borderColor: e.line,
      borderWidth: 1,
      paddingX: 14,
      paddingY: 10,
      shadow: { x: 0, y: 0, blur: 14, color: `${e.line}44` },
    },
    AssistantMessage: {
      backgroundColor: `${e.reply}F2`,
      color: '#F3ECFF',
      radius,
      borderColor: `${e.line}55`,
      borderWidth: 1,
      paddingX: 14,
      paddingY: 8,
    },
    ToolUse: {
      backgroundColor: e.tool,
      color: '#CDBDEA',
      radius: Math.max(3, radius - 3),
      paddingX: 10,
      borderColor: `${e.line}66`,
      borderWidth: 1,
    },
  }
}
