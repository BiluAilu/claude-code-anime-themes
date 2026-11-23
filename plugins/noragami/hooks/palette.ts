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
  // Yato's midnight navy, divine blue and ice; by day, a pale blue sky over the shrine.
  shrine: {
    label: 'Noragami - Shrine Night',
    dark: {
      surfaces: ['#080F24', '#0C1630', '#101D3D', '#131F40'],
      text: ['#EAF5FF', '#B9D4EE', '#93ABCF'],
      roles: { accent: '#5F86FF', danger: '#E5566B', success: '#4CC9B0', warning: '#E2B65A', pro: '#8176D9' },
      git: { added: '#4CC9B0', removed: '#E5566B', modified: '#8CCEFF', merged: '#8176D9' },
      user: '#101D3D',
      reply: '#070D20',
      messageText: '#F4F8FF',
    },
    light: {
      surfaces: ['#E4ECF9', '#EDF3FC', '#F6F9FE', '#F6F9FE'],
      text: ['#101A38', '#27335E', '#364370'],
      roles: { accent: '#3050D0', danger: '#C23A52', success: '#1E8A72', warning: '#9A6A0C', pro: '#6552C0' },
      git: { added: '#1E8A72', removed: '#C23A52', modified: '#3A6FC0', merged: '#6552C0' },
      user: '#D6E2F8',
      reply: '#F8FAFE',
      messageText: '#101A38',
    },
    codeTheme: { dark: 'night-owl', light: 'github-light' },
  },
  // The underworld river: murky teal and lantern red; by day, a misty teal dawn.
  farshore: {
    label: 'Noragami - Far Shore',
    dark: {
      surfaces: ['#05080C', '#0A1118', '#101B25', '#14222E'],
      text: ['#E8F4F6', '#B7D4D9', '#8CAAB1'],
      roles: { accent: '#3FB7C4', danger: '#FF5A5F', success: '#4CC9A0', warning: '#E8A94F', pro: '#9A8CE0' },
      git: { added: '#4CC9A0', removed: '#FF5A5F', modified: '#7FDCE6', merged: '#9A8CE0' },
      user: '#101B25',
      reply: '#04080B',
      messageText: '#F2FAFB',
    },
    light: {
      surfaces: ['#DDEBED', '#E8F2F3', '#F3F9F9', '#F3F9F9'],
      text: ['#0E2A30', '#223F46', '#2F4D54'],
      roles: { accent: '#177A89', danger: '#C23A45', success: '#1B8466', warning: '#9A650F', pro: '#6A5CB8' },
      git: { added: '#1B8466', removed: '#C23A45', modified: '#1E8DA0', merged: '#6A5CB8' },
      user: '#CFE3E6',
      reply: '#F6FBFB',
      messageText: '#0E2A30',
    },
    codeTheme: { dark: 'tokyo-night', light: 'github-light' },
  },
  // Takamagahara: deep indigo and heavenly gold; by day, a pale lavender and cream sky.
  heaven: {
    label: 'Noragami - Takamagahara',
    dark: {
      surfaces: ['#0A0D26', '#10143A', '#171B4A', '#1C215A'],
      text: ['#F6F3FF', '#CFCBEE', '#A5A1CF'],
      roles: { accent: '#8E96FF', danger: '#F0627A', success: '#5AD6B0', warning: '#FFD27A', pro: '#C9A8FF' },
      git: { added: '#5AD6B0', removed: '#F0627A', modified: '#FFD27A', merged: '#C9A8FF' },
      user: '#171B4A',
      reply: '#090C22',
      messageText: '#F8F6FF',
    },
    light: {
      surfaces: ['#ECE8F8', '#F3F0FB', '#FAF8FF', '#FAF8FF'],
      text: ['#1B1B45', '#32326A', '#3F3F70'],
      roles: { accent: '#4C54C8', danger: '#C23A5A', success: '#1B8466', warning: '#8F6700', pro: '#7A55C8' },
      git: { added: '#1B8466', removed: '#C23A5A', modified: '#8F6700', merged: '#7A55C8' },
      user: '#E0DBF5',
      reply: '#FBF9FF',
      messageText: '#1B1B45',
    },
    codeTheme: { dark: 'night-owl', light: 'github-light' },
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
  shrine: { line: '#426BFF' },
  farshore: { line: '#2A8F9C' },
  heaven: { line: '#7B83E8' },
}

// Message boxes use the mode-aware message colors, and borders in the character's color.
export function styleFor(mode: Mode, accent: string): ThemeStyle {
  const line = mix(EDGE[mode].line, accent, 0.6)
  const radius = mode === 'shrine' ? 10 : mode === 'farshore' ? 4 : 14

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
