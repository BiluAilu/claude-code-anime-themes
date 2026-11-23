export type Phase = 'idle' | 'thinking' | 'generating' | 'tools' | 'done' | 'error' | 'waiting' | 'compacting'
export type Mode = 'godspeed' | 'arena' | 'estate'
export type Who = 'killua' | 'gon' | 'kurapika' | 'leorio'
export type ToolKind = 'shell' | 'edit' | 'read' | 'web' | 'agent' | 'mcp'
export type Counts = {
  turns: number
  tools: number
  failures: number
  steps: number
  agents: number
  permissions: number
  denials: number
  compactions: number
}

declare module 'claude-code' {
  interface PluginState {
    'hunter-x-hunter': {
      phase: Phase
      mode: Mode
      who: Who
      pct: number
      counts: Shaped<Counts>
      tool: ToolKind
      running: number
      off: boolean
    }
  }
}
