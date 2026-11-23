export type Phase = 'idle' | 'thinking' | 'generating' | 'tools' | 'done' | 'error'
export type Mode = 'divine' | 'godspeed' | 'dual'

declare module 'claude-code' {
  interface PluginState {
    'yato-killua-godspeed': { phase: Phase; mode: Mode; pct: number }
  }
}
