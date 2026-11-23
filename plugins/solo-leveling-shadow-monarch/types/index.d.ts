export type Phase = 'idle' | 'thinking' | 'generating' | 'tools' | 'done' | 'error'
export type Mode = 'system' | 'monarch' | 'dungeon'
export type Counts = { turns: number; tools: number; failures: number; steps: number }

declare module 'claude-code' {
  interface PluginState {
    'solo-leveling-shadow-monarch': {
      phase: Phase
      mode: Mode
      pct: number
      counts: Counts
    }
  }
}
