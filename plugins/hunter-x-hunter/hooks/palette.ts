import type { ThemeColors, ThemeStyle } from 'claude-code'

import type { Mode } from '../types'
import { makeColors } from './make-colors.js'
import { mix } from './tint.js'

// Each world has a night look (dark) and a day look (light); the app's own mode picks
// one, or the person forces it. The character tints both.
type Look = {
  surfaces: [string, string, string, string]
  text: [string, string, string]
  roles: { accent: string; danger: string; success: string; warning: string; pro: string }
  git: { added: string; removed: string; modified: string; merged: string }
  user: string
  reply: string
  messageText: string
}

type Seed = { label: string; dark: Look; light: Look; codeTheme: { dark: string; light: string } }

const SEEDS: Record<Mode, Seed> = {
  // Killua's deep black, graphite, electric blue and neon cyan; by day, a cool overcast storm sky.
  godspeed: {
    label: 'Hunter x Hunter - Godspeed',
    dark: {
      surfaces: ['#080A10', '#0E131C', '#171D29', '#1B2231'],
      text: ['#E9F2FA', '#C8D9EA', '#93A6BC'],
      roles: { accent: '#00A8FF', danger: '#FF4D63', success: '#2DD4A0', warning: '#F0B429', pro: '#347DFF' },
      git: { added: '#2DD4A0', removed: '#FF4D63', modified: '#00F0FF', merged: '#347DFF' },
      user: '#171D29',
      reply: '#070A12',
      messageText: '#F2F8FD',
    },
    light: {
      surfaces: ['#E0E9F3', '#EAF0F8', '#F5F8FC', '#F5F8FC'],
      text: ['#0E1A2B', '#1F3350', '#324767'],
      roles: { accent: '#0C63C4', danger: '#C2334A', success: '#16866A', warning: '#946308', pro: '#2F5FC8' },
      git: { added: '#16866A', removed: '#C2334A', modified: '#0A7FB5', merged: '#2F5FC8' },
      user: '#D2E0F1',
      reply: '#F7FAFD',
      messageText: '#0E1A2B',
    },
    codeTheme: { dark: 'tokyo-night', light: 'github-light' },
  },
  // Heavens Arena at dusk: violet sky and ember orange; by day, a golden afternoon.
  arena: {
    label: 'Hunter x Hunter - Heavens Arena',
    dark: {
      surfaces: ['#0D0714', '#160C22', '#20122F', '#26163A'],
      text: ['#FFF1EA', '#EBCFC4', '#C2A396'],
      roles: { accent: '#FF7A45', danger: '#FF4D63', success: '#46D69A', warning: '#FFC857', pro: '#FF5E8A' },
      git: { added: '#46D69A', removed: '#FF4D63', modified: '#FFB35C', merged: '#FF5E8A' },
      user: '#20122F',
      reply: '#0B0612',
      messageText: '#FFF6F0',
    },
    light: {
      surfaces: ['#F1E5E0', '#F7EEEA', '#FCF8F5', '#FCF8F5'],
      text: ['#2A1420', '#3D2230', '#4E2F3A'],
      roles: { accent: '#B8470F', danger: '#C2334A', success: '#1B8466', warning: '#8C5A00', pro: '#B8305E' },
      git: { added: '#1B8466', removed: '#C2334A', modified: '#A8590C', merged: '#B8305E' },
      user: '#EDD9CF',
      reply: '#FDF9F6',
      messageText: '#2A1420',
    },
    codeTheme: { dark: 'night-owl', light: 'github-light' },
  },
  // The Zoldyck estate at night: cold slate and silver; by day, a pale silver morning mist.
  estate: {
    label: 'Hunter x Hunter - Zoldyck Estate',
    dark: {
      surfaces: ['#05070C', '#0B101A', '#131A28', '#182034'],
      text: ['#EEF3FF', '#C5D0E8', '#98A6C6'],
      roles: { accent: '#9FB4FF', danger: '#FF5A66', success: '#4CC9A8', warning: '#E6B65A', pro: '#B59CFF' },
      git: { added: '#4CC9A8', removed: '#FF5A66', modified: '#E6EDFF', merged: '#B59CFF' },
      user: '#131A28',
      reply: '#04060B',
      messageText: '#F4F7FF',
    },
    light: {
      surfaces: ['#E2E6F1', '#EBEEF6', '#F6F8FC', '#F6F8FC'],
      text: ['#141A33', '#283159', '#384370'],
      roles: { accent: '#3A4FB4', danger: '#C23A4A', success: '#1B8470', warning: '#8F6400', pro: '#6A52C0' },
      git: { added: '#1B8470', removed: '#C23A4A', modified: '#4054B8', merged: '#6A52C0' },
      user: '#D6DCEE',
      reply: '#F8F9FD',
      messageText: '#141A33',
    },
    codeTheme: { dark: 'tokyo-night', light: 'github-light' },
  },
}

// The frosted glass keeps the surface's own panel color, so it follows light and dark.
export function glassFor(_mode: Mode, _accent: string) {
  return { blur: 10, opacity: 0.76 }
}

// The character sets the interface accent and tints the surfaces a little, in both modes.
export function colorsFor(mode: Mode, accent: string) {
  const s = SEEDS[mode]
  const dark = s.dark
  const light = s.light
  // On a light surface the character's color is deepened so it stays readable.
  const accentLight = mix(accent, '#1A2452', 0.5)
  const surfD = dark.surfaces.map(c => mix(c, accent, 0.07))
  const surfL = light.surfaces.map(c => mix(c, accentLight, 0.05))

  const made = makeColors({
    label: s.label,
    roles: dark.roles,
    light: {
      roles: { ...light.roles, accent: mix(light.roles.accent, accentLight, 0.7), pro: mix(light.roles.pro, accentLight, 0.3) },
      git: light.git,
      gray: {
        anchors: {
          'surface-0': surfL[0] ?? light.surfaces[0],
          'surface-1': surfL[1] ?? light.surfaces[1],
          'surface-2': surfL[2] ?? light.surfaces[2],
          'surface-3': surfL[3] ?? light.surfaces[3],
          'text-primary': light.text[0],
          'text-secondary': light.text[1],
          'text-muted': light.text[2],
        },
      },
    },
    dark: {
      roles: { ...dark.roles, accent: mix(dark.roles.accent, accent, 0.75), pro: mix(dark.roles.pro, accent, 0.35) },
      git: dark.git,
      gray: {
        anchors: {
          'surface-0': surfD[0] ?? dark.surfaces[0],
          'surface-1': surfD[1] ?? dark.surfaces[1],
          'surface-2': surfD[2] ?? dark.surfaces[2],
          'surface-3': surfD[3] ?? dark.surfaces[3],
          'text-primary': dark.text[0],
          'text-secondary': dark.text[1],
          'text-muted': dark.text[2],
        },
      },
    },
    codeTheme: s.codeTheme,
  })

  // Message boxes differ by mode, so they come through the four message colors.
  const theme: ThemeColors = {
    ...made.theme,
    inputs: {
      ...made.theme.inputs,
      light: {
        ...made.theme.inputs?.light,
        'bg-user-message': mix(light.user, accentLight, 0.06),
        'text-user-message': light.messageText as `#${string}`,
        'bg-assistant-message': light.reply as `#${string}`,
        'text-assistant-message': light.messageText as `#${string}`,
      },
      dark: {
        ...made.theme.inputs?.dark,
        'bg-user-message': mix(dark.user, accent, 0.07),
        'text-user-message': dark.messageText as `#${string}`,
        'bg-assistant-message': dark.reply as `#${string}`,
        'text-assistant-message': dark.messageText as `#${string}`,
      },
    },
  }

  return { theme, problems: made.problems }
}

const EDGE: Record<Mode, { line: `#${string}` }> = {
  godspeed: { line: '#00A8FF' },
  arena: { line: '#FF7A45' },
  estate: { line: '#7B8CD9' },
}

// Message boxes use the mode-aware message colors, and borders in the character's color.
export function styleFor(mode: Mode, accent: string): ThemeStyle {
  const line = mix(EDGE[mode].line, accent, 0.6)
  const radius = mode === 'godspeed' ? 3 : mode === 'arena' ? 12 : 6

  return {
    Heading: { color: 'text-accent', fontWeight: 'semibold', letterSpacing: 0.3 },
    UserMessage: {
      backgroundColor: 'bg-user-message',
      color: 'text-user-message',
      radius,
      borderColor: line,
      borderWidth: 1,
      paddingX: 14,
      paddingY: 10,
      shadow: { x: 0, y: 0, blur: 14, color: `${line}44` },
    },
    AssistantMessage: {
      backgroundColor: 'bg-assistant-message',
      color: 'text-assistant-message',
      radius,
      borderColor: `${line}66`,
      borderWidth: 1,
      paddingX: 14,
      paddingY: 8,
    },
    ToolUse: {
      backgroundColor: 'surface-1',
      color: 'text-secondary',
      radius: Math.max(3, radius - 3),
      paddingX: 10,
      borderColor: `${line}66`,
      borderWidth: 1,
    },
  }
}
