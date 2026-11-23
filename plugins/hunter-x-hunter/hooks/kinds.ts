import type { ToolKind } from '../types'

// Which effect a real tool call gets, from its real tool name.
export function kindOf(tool: string): ToolKind {
  if (tool.startsWith('mcp__')) {
    return 'mcp'
  }

  if (tool === 'Edit' || tool === 'Write' || tool === 'MultiEdit' || tool === 'NotebookEdit') {
    return 'edit'
  }

  if (tool === 'Read' || tool === 'Grep' || tool === 'Glob' || tool === 'LS') {
    return 'read'
  }

  if (tool === 'WebFetch' || tool === 'WebSearch') {
    return 'web'
  }

  if (tool === 'Agent' || tool === 'Task') {
    return 'agent'
  }

  return 'shell'
}
