import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import type { Counts, Mode, Phase, ToolKind } from '../types'
import { kindOf } from './kinds.js'
import { GLASS, colorsFor, styleFor } from './palette.js'
import { buildScene } from './scene.js'

const NAME = 'yato-killua-godspeed' as const
const MODES: Mode[] = ['divine', 'godspeed', 'dual']
const DEFAULT_MODE: Mode = 'dual'

const phase = atom({ plugin: 'yato-killua-godspeed', key: 'phase' } as const, 'idle')
const mode = atom({ plugin: 'yato-killua-godspeed', key: 'mode' } as const, DEFAULT_MODE)
const pct = atom({ plugin: 'yato-killua-godspeed', key: 'pct' } as const, 0)
const ZERO: Counts = { turns: 0, tools: 0, failures: 0, steps: 0, agents: 0, permissions: 0, denials: 0, compactions: 0 }
// Change the tag when Counts changes: it declines what an earlier version stored.
const counts = atom({ plugin: 'yato-killua-godspeed', key: 'counts' } as const, ZERO, { shape: 'counts-2' })
const tool = atom({ plugin: 'yato-killua-godspeed', key: 'tool' } as const, 'shell')
const off = atom({ plugin: 'yato-killua-godspeed', key: 'off' } as const, false)
const running = atom({ plugin: 'yato-killua-godspeed', key: 'running' } as const, 0)

const LABEL: Record<Phase, string> = {
  idle: 'calm',
  thinking: 'thinking',
  generating: 'writing',
  tools: 'godspeed',
  done: 'done',
  error: 'error',
  waiting: 'awaiting your word',
  compacting: 'cleansing',
}

const TOOL_LABEL: Record<ToolKind, string> = {
  shell: 'dash',
  edit: 'slash',
  read: 'scout',
  web: 'gate',
  agent: 'summon',
  mcp: 'lightning',
}

function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && (MODES as string[]).includes(value)
}

import type { EngineInterface } from 'claude-code'

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
    calmTimer = $.clock.after(next === 'done' ? 4500 : 6000, () => {
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

  // Real figure, said once per band as it climbs.
  const band = value >= 90 ? 90 : value >= 80 ? 80 : 0

  if (band > warned) {
    await say($, `Context ${value}% full - consider /compact`)
  }
  warned = band

  return value
}

async function bump($: EngineInterface, key: keyof Counts) {
  await update($, counts, c => ({ ...ZERO, ...c, [key]: (c[key] ?? 0) + 1 }))
}

async function setTool($: EngineInterface, name: string) {
  await update($, tool, () => kindOf(name))
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
    backdrop: { scene: `godspeed-${which}`, glass: GLASS[which] },
  }

  try {
    await $.theme.set({ ...look, style: styleFor(which) })
  } catch (error) {
    $.ui.log(`${NAME}: style refused, set without it: ${String(error)}`)
    await $.theme.set(look)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const saved = await $.store.get('mode')
    const which = isMode(saved) ? saved : DEFAULT_MODE
    await update($, mode, () => which)
    await $.command.register({
      name: 'godspeed',
      description: 'Switch look: /godspeed divine | godspeed | dual | status | off | on (default dual)',
    })
    const isOff = (await $.store.get('off')) === true
    await update($, off, () => isOff)
    await (isOff ? Promise.resolve() : applyLook($, which))
    await refreshContext($).catch(() => undefined)

    return next(e)
  })

  on('command.run', { command: 'godspeed' }, async ($, e) => {
    const want = e.args.trim().toLowerCase()

    if (want === '') {
      const now = await read($, mode)

      return { text: `Mode: ${now}. Use /godspeed divine, godspeed, dual, status, off or on.` }
    }

    if (want === 'off') {
      await $.store.set('off', true)
      await update($, off, () => true)
      let note = ''
      try {
        await $.theme.clear()
      } catch {
        note = ' (this build could not clear the theme)'
      }

      return { text: `Theme off: the app's own look is back${note}. Use /godspeed on to bring it back.` }
    }

    if (want === 'on') {
      await $.store.set('off', false)
      await update($, off, () => false)
      let note = ''
      await applyLook($, await read($, mode)).catch(() => {
        note = ' (this build draws no themes)'
      })

      return { text: `Theme on.${note}` }
    }

    if (want === 'status') {
      const c = { ...ZERO, ...(await read($, counts)) }
      const r = await read($, running)

      return {
        text: `Real events seen this session: turns ${c.turns}, model steps ${c.steps}, tool calls ${c.tools}, tool failures ${c.failures}, subagents started ${c.agents} (${r} running), permission prompts ${c.permissions}, denials ${c.denials}, compactions ${c.compactions}. State: ${await read($, phase)}. Context: ${await read($, pct)}%. Mode: ${await read($, mode)}.`,
      }
    }

    if (!isMode(want)) {
      return { text: `Unknown mode "${want}". Use divine, godspeed or dual.` }
    }
    await $.store.set('mode', want)
    await $.store.set('off', false)
    await update($, off, () => false)
    await update($, mode, () => want)
    await applyLook($, want)

    return { text: `Mode set to ${want}.` }
  })

  // Backdrop redraws whenever phase, mode or context percent changes.
  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    owner = e.props.plugin

    if (e.props.plugin !== $.plugin.name || (await read($, off))) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const svg = buildScene({
      mode: await read($, mode),
      phase: await read($, phase),
      pct: await read($, pct),
      tool: await read($, tool),
      agents: await read($, running),
    })

    return <Svg source={svg} alt="A midnight shrine gate under drifting blue light, with lightning at the edge" isInteractive />
  })

  // A slim band: shrine gate, a divider, lightning, then real figures only.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, off)) || !isActive($)) {
      return next(e)
    }
    const { Box, Text } = $.ui.resolve(e)
    const p = await read($, phase)
    const percent = await read($, pct)
    const m = await read($, mode)
    const warn = percent >= 80
    const r = await read($, running)
    const k = await read($, tool)
    const state = p === 'tools' ? `${LABEL[p]} · ${TOOL_LABEL[k]}` : LABEL[p]

    return (
      <Box>
        <Text color="#8CCEFF">⛩ </Text>
        <Text color="#426BFF">━━</Text>
        <Text color="#00F0FF"> ⚡ </Text>
        <Text color={p === 'waiting' ? '#FFB02E' : '#C8D9EA'}>{m} · {state}{r > 0 ? ` · spirits ${r}` : ''}</Text>
        {percent > 0 && <Text color={warn ? '#FFB02E' : '#8CCEFF'}> · context {percent}%</Text>}
      </Box>
    )
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      await setPhase($, 'thinking')
    }

    return next(e)
  })

  // Reads the stream as it passes: thinking, text and tool starts are real events.
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
      if (isActive($)) {
        $.ui.status(`⚡ ${e.tool} failed`)
      }
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
    await say($, `A spirit answers the call: ${e.agent_type}`)

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
    await bump($, 'turns')
    await refreshContext($).catch(() => undefined)
    await setPhase($, e.reason === 'error' ? 'error' : e.isAborted ? 'idle' : 'done')
    $.ui.status(undefined)

    return next(e)
  })
}
