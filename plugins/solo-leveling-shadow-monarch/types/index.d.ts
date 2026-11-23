export type Phase = 'idle' | 'thinking' | 'generating' | 'tools' | 'done' | 'error' | 'waiting' | 'compacting'
export type Mode = 'system' | 'monarch' | 'dungeon'
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
    'solo-leveling-shadow-monarch': {
      phase: Phase
      mode: Mode
      pct: number
      counts: Shaped<Counts>
      tool: ToolKind
      running: number
      off: boolean
    }
  }
}
