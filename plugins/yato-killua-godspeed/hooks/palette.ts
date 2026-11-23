import type { ThemeStyle } from 'claude-code'

import type { Mode } from '../types'
import { makeColors } from './make-colors.js'

// Yato: midnight navy, divine blue, ice, soft white, a little violet.
// Killua: deep black, graphite, electric blue, neon cyan, silver.
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
  divine: {
    label: 'Yato - Divine',
    surfaces: ['#080F24', '#0C1630', '#101D3D', '#131F40'],
    text: ['#EAF5FF', '#B9D4EE', '#93ABCF'],
    roles: { accent: '#5F86FF', danger: '#E5566B', success: '#4CC9B0', warning: '#E2B65A', pro: '#8176D9' },
    git: { added: '#4CC9B0', removed: '#E5566B', modified: '#8CCEFF', merged: '#8176D9' },
    codeTheme: 'night-owl',
  },
  godspeed: {
    label: 'Killua - Godspeed',
    surfaces: ['#080A10', '#0E121B', '#171D29', '#1A2130'],
    text: ['#E9F2FA', '#C8D9EA', '#93A6BC'],
    roles: { accent: '#00A8FF', danger: '#FF4D63', success: '#2DD4A0', warning: '#F0B429', pro: '#7C9DFF' },
    git: { added: '#2DD4A0', removed: '#FF4D63', modified: '#00F0FF', merged: '#347DFF' },
    codeTheme: 'tokyo-night',
  },
  dual: {
    label: 'Yato x Killua - Dual',
    surfaces: ['#090E1F', '#0E1529', '#141C35', '#171F3A'],
    text: ['#EAF5FF', '#C0D6EE', '#97ADCF'],
    roles: { accent: '#2FB4FF', danger: '#EB5368', success: '#37D0AA', warning: '#E8B74F', pro: '#8176D9' },
    git: { added: '#37D0AA', removed: '#EB5368', modified: '#8CCEFF', merged: '#8176D9' },
    codeTheme: 'tokyo-night',
  },
}

export const GLASS: Record<Mode, { tint: string; blur: number; opacity: number }> = {
  divine: { tint: '#0C1630', blur: 8, opacity: 0.3 },
  godspeed: { tint: '#0E121B', blur: 6, opacity: 0.32 },
  dual: { tint: '#0E1529', blur: 8, opacity: 0.3 },
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

// Opaque message boxes so words stay readable over the moving backdrop.
export function styleFor(mode: Mode): ThemeStyle {
  const edge = mode === 'divine' ? '#426BFF' : mode === 'godspeed' ? '#00A8FF' : '#2F7DFF'
  const user = mode === 'godspeed' ? '#121A2B' : '#122049'

  return {
    Heading: { color: mode === 'godspeed' ? '#00F0FF' : '#8CCEFF', fontWeight: 'semibold', letterSpacing: 0.3 },
    UserMessage: {
      backgroundColor: user,
      color: '#EAF5FF',
      radius: 12,
      borderColor: edge,
      borderWidth: 1,
      paddingX: 14,
      paddingY: 10,
      shadow: { x: 0, y: 0, blur: 14, color: '#00A8FF33' },
    },
    AssistantMessage: {
      backgroundColor: '#0A1228F0',
      color: '#EAF5FF',
      radius: 12,
      borderColor: '#2F4FA855',
      borderWidth: 1,
      paddingX: 14,
      paddingY: 8,
    },
    ToolUse: {
      backgroundColor: '#0B1224',
      color: '#C8D9EA',
      radius: 8,
      paddingX: 10,
      borderColor: '#00F0FF55',
      borderWidth: 1,
    },
  }
}
