export type Phase = 'idle' | 'thinking' | 'generating' | 'tools' | 'done' | 'error' | 'waiting' | 'compacting'
export type Mode = 'shrine' | 'farshore' | 'heaven'
export type Who = 'yato' | 'hiyori' | 'yukine' | 'bishamon'
export type Scheme = 'auto' | 'light' | 'dark'
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
    'noragami': {
      phase: Phase
      mode: Mode
      who: Who
      scheme: Scheme
      pct: number
      counts: Shaped<Counts>
      tool: ToolKind
      running: number
      off: boolean
    }
  }
}
