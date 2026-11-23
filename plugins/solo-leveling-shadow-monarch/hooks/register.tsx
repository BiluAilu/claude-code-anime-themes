import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { Counts, Mode, Phase, ToolKind } from '../types'
import { kindOf } from './kinds.js'
import { GLASS, colorsFor, styleFor } from './palette.js'
import { buildScene } from './scene.js'
import { TONE } from './worlds.js'

// Everything here is driven by real events: turn.start, turn.step chunks, tool.call
// and tool.run (with the real tool name), turn.complete (with its real duration),
// the classic SubagentStart/Stop, PermissionRequest/Denied and PreCompact/PostCompact
// events, and $.session.usage() for the context percentage. Nothing is invented.
// The only timer returns the scene to calm a few seconds after a finish or an error.

const MODES: Mode[] = ['system', 'monarch', 'dungeon']
const DEFAULT_MODE: Mode = 'monarch'
const ZERO: Counts = { turns: 0, tools: 0, failures: 0, steps: 0, agents: 0, permissions: 0, denials: 0, compactions: 0 }

const phase = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'phase' } as const, 'idle')
const mode = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'mode' } as const, DEFAULT_MODE)
const pct = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'pct' } as const, 0)
// Change the tag when Counts changes: it declines what an earlier version stored.
const counts = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'counts' } as const, ZERO, { shape: 'counts-2' })
const tool = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'tool' } as const, 'shell')
const off = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'off' } as const, false)
const running = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'running' } as const, 0)

const LABEL: Record<Phase, string> = {
  idle: 'at ease',
  thinking: 'surveying',
  generating: 'forging',
  tools: 'arise: executing',
  done: 'quest cleared',
  error: 'penalty',
  waiting: 'awaiting your word',
  compacting: 'purging the shadows',
}

const TOOL_LABEL: Record<ToolKind, string> = {
  shell: 'dash',
  edit: 'slash',
  read: 'scout',
  web: 'gate',
  agent: 'summon',
  mcp: 'lightning',
}

const TITLE: Record<Mode, string> = {
  system: 'THE SYSTEM',
  monarch: 'SHADOW MONARCH',
  dungeon: 'DOUBLE DUNGEON',
}

function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && (MODES as string[]).includes(value)
}

// The module's own variables restart on reload; the atoms above do not.
let current: Phase = 'idle'
let warned = 0
// The plugin whose backdrop was last drawn: the theme actually on screen. The render hook
// below notes it; no state is written while drawing.
let owner: string | undefined
let before = 0
let calmTimer: { cancel: () => void } | undefined

function isActive($: EngineInterface) {
  return owner === undefined || owner === $.plugin.name
}

async function say($: EngineInterface, text: string) {
  if (isActive($) && !(await read($, off))) {
    $.ui.toast(text)
  }
}

async function setPhase($: EngineInterface, next: Phase) {
  if (next === current) {
    return
  }
  current = next
  calmTimer?.cancel()
  await update($, phase, () => next)

  if (next === 'done' || next === 'error') {
    calmTimer = $.clock.after(next === 'done' ? 5000 : 6500, () => {
      if (current === next) {
        current = 'idle'
        void update($, phase, () => 'idle')
      }
    })
  }
}

async function refreshContext($: EngineInterface) {
  const { context } = await $.session.usage()

  if (context.percent === undefined) {
    return 0
  }
  const value = Math.round(context.percent)
  await update($, pct, () => value)
  const band = value >= 90 ? 90 : value >= 80 ? 80 : 0

  if (band > warned) {
    await say($, `Warning: context ${value}% full. Consider /compact.`)
  }
  warned = band

  return value
}

async function applyLook($: EngineInterface, which: Mode) {
  const { theme, problems } = colorsFor(which)
  const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

  if (unpainted !== undefined) {
    await say($, unpainted)
  }
  const look: ThemeSetArgs = {
    colors: theme,
    overrideColorScheme: 'dark',
    backdrop: { scene: `shadow-${which}`, glass: GLASS[which] },
  }

  try {
    await $.theme.set({ ...look, style: styleFor(which) })
  } catch (error) {
    $.ui.log(`solo-leveling-shadow-monarch: style refused, set without it: ${String(error)}`)
    await $.theme.set(look)
  }
}

async function bump($: EngineInterface, key: keyof Counts) {
  await update($, counts, c => ({ ...ZERO, ...c, [key]: (c[key] ?? 0) + 1 }))
}

async function setTool($: EngineInterface, name: string) {
  const kind = kindOf(name)
  await update($, tool, () => kind)
}

function meter(percent: number) {
  const filled = Math.round(clampPct(percent) / 10)

  return '▰'.repeat(filled) + '▱'.repeat(10 - filled)
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const saved = await $.store.get('sl-mode')
    const which = isMode(saved) ? saved : DEFAULT_MODE
    await update($, mode, () => which)
    await $.command.register({
      name: 'shadow',
      description: 'Shadow Monarch: /shadow system | monarch | dungeon | status | off | on',
    })
    const isOff = (await $.store.get('sl-off')) === true
    await update($, off, () => isOff)
    // A build with no theme support must not stop the band and the counters.
    await (isOff ? Promise.resolve() : applyLook($, which)).catch(error => $.ui.log(`solo-leveling-shadow-monarch: no theme: ${String(error)}`))
    await refreshContext($).catch(() => undefined)

    return next(e)
  })

  on('command.run', { command: 'shadow' }, async ($, e) => {
    const want = e.args.trim().toLowerCase()
    const now = await read($, mode)

    if (want === '') {
      return { text: `World: ${now}. Use /shadow system, monarch, dungeon, status, off or on.` }
    }

    if (want === 'off') {
      await $.store.set('sl-off', true)
      await update($, off, () => true)
      let note = ''
      try {
        await $.theme.clear()
      } catch {
        note = ' (this build could not clear the theme)'
      }

      return { text: `Theme off: the app's own look is back${note}. Use /shadow on to bring it back.` }
    }

    if (want === 'on') {
      await $.store.set('sl-off', false)
      await update($, off, () => false)
      let note = ''
      await applyLook($, await read($, mode)).catch(() => {
        note = ' (this build draws no themes)'
      })

      return { text: `Theme on.${note}` }
    }

    if (want === 'status') {
      const c = { ...ZERO, ...(await read($, counts)) }
      const p = await read($, phase)
      const percent = await read($, pct)
      const r = await read($, running)

      return {
        text: `Real events seen this session: turns ${c.turns}, model steps ${c.steps}, tool calls ${c.tools}, tool failures ${c.failures}, subagents started ${c.agents} (${r} running), permission prompts ${c.permissions}, denials ${c.denials}, compactions ${c.compactions}. State: ${p}. Context: ${percent}%. World: ${now}.`,
      }
    }

    if (!isMode(want)) {
      return { text: `Unknown world "${want}". Use system, monarch or dungeon.` }
    }
    await $.store.set('sl-mode', want)
    await $.store.set('sl-off', false)
    await update($, off, () => false)
    await update($, mode, () => want)
    let note = ''
    await applyLook($, want).catch(() => {
      note = ' (this build draws no themes, so only the band changed)'
    })

    return { text: `World set to ${want}.${note}` }
  })

  // The backdrop redraws whenever phase, world, context, tools or subagents change.
  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }

    owner = e.props.plugin

    if (e.props.plugin !== $.plugin.name || (await read($, off))) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const c = await read($, counts)
    const svg = buildScene({
      mode: await read($, mode),
      phase: await read($, phase),
      pct: await read($, pct),
      army: c.tools,
      tool: await read($, tool),
      agents: await read($, running),
    })

    return <Svg source={svg} alt="A shadow knight beside a throne, with an army that grows as tools run" isInteractive />
  })

  // The status band: title, state, real counts and the real context meter.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, off)) || !isActive($)) {
      return next(e)
    }
    const { Box, Text } = $.ui.resolve(e)
    const m = await read($, mode)
    const p = await read($, phase)
    const percent = await read($, pct)
    const c = await read($, counts)
    const r = await read($, running)
    const k = await read($, tool)
    const tone = TONE[m]
    const warn = percent >= 80
    const stateColor = p === 'error' ? '#FF4D63' : p === 'waiting' ? '#FFB02E' : p === 'done' ? tone.eye : tone.glow2
    const state = p === 'tools' ? `${LABEL[p]} · ${TOOL_LABEL[k]}` : LABEL[p]

    return (
      <Box>
        <Text color={tone.glow}>◆ </Text>
        <Text color={tone.glow2} bold>{TITLE[m]}</Text>
        <Text color={tone.glow}> ◆ </Text>
        <Text color={stateColor}>{state}</Text>
        <Text color="#8FA0B8"> │ turns {c.turns} · tools {c.tools}{c.failures > 0 ? ` · fails ${c.failures}` : ''}{r > 0 ? ` · soldiers ${r}` : ''}</Text>
        <Text color="#8FA0B8"> │ </Text>
        <Text color={warn ? '#FFB02E' : tone.glow2}>{meter(percent)} {percent}%</Text>
      </Box>
    )
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      await setPhase($, 'thinking')
    }

    return next(e)
  })

  // Reads the response as it streams: thinking, text and tool starts are real chunks.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) {
      await bump($, 'steps')
    }

    for await (const chunk of next(e)) {
      if (e.agentId === undefined) {
        if (chunk.kind === 'thinking') {
          await setPhase($, 'thinking')
        } else if (chunk.kind === 'text') {
          await setPhase($, 'generating')
        } else if (chunk.kind === 'tool') {
          await setTool($, chunk.name)
          await setPhase($, 'tools')
        }
      }
      yield chunk
    }
  })

  on('tool.call', async ($, e, next) => {
    await setTool($, e.tool)
    await setPhase($, 'tools')
    await bump($, 'tools')
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError === true) {
      await bump($, 'failures')
      await setPhase($, 'error')
      await say($, `Penalty: ${e.tool} failed`)
    }
    await refreshContext($).catch(() => undefined)

    return ran
  })

  // A tool that finished, well or badly, means any permission wait before it is over.
  on('classic.PostToolUse', async ($, e, next) => {
    if (current === 'waiting') {
      await setPhase($, 'thinking')
    }

    return next(e)
  })

  on('classic.PostToolUseFailure', async ($, e, next) => {
    if (current === 'waiting') {
      await setPhase($, 'thinking')
    }

    return next(e)
  })

  on('classic.PermissionRequest', async ($, e, next) => {
    await bump($, 'permissions')
    await setTool($, e.tool_name)
    await setPhase($, 'waiting')
    await say($, `Awaiting your approval: ${e.tool_name}`)

    return next(e)
  })

  on('classic.PermissionDenied', async ($, e, next) => {
    await bump($, 'denials')
    await setPhase($, 'error')

    return next(e)
  })

  on('classic.SubagentStart', async ($, e, next) => {
    await bump($, 'agents')
    await update($, running, n => n + 1)
    await say($, `A shadow arises: ${e.agent_type}`)

    return next(e)
  })

  on('classic.SubagentStop', async ($, e, next) => {
    await update($, running, n => Math.max(0, n - 1))

    return next(e)
  })

  on('classic.PreCompact', async ($, e, next) => {
    before = await read($, pct)
    await setPhase($, 'compacting')

    return next(e)
  })

  on('classic.PostCompact', async ($, e, next) => {
    await bump($, 'compactions')
    const after = await refreshContext($).catch(() => 0)
    warned = after >= 90 ? 90 : after >= 80 ? 80 : 0
    await setPhase($, 'idle')
    await say($, `Context compacted: ${before}% → ${after}%`)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await bump($, 'turns')
      await refreshContext($).catch(() => undefined)
      await setPhase($, e.reason === 'error' ? 'error' : e.isAborted ? 'idle' : 'done')

      if (e.reason !== 'error' && !e.isAborted && e.durationMs >= 15000) {
        await say($, `Quest cleared in ${Math.round(e.durationMs / 1000)}s`)
      }
    }

    return next(e)
  })
}
