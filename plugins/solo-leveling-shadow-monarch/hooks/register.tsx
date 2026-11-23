import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { Counts, Mode, Phase } from '../types'
import { GLASS, colorsFor, styleFor } from './palette.js'
import { buildScene } from './scene.js'
import { TONE } from './worlds.js'

// Everything here is driven by real events: turn.start, turn.step chunks,
// tool.call (and whether its result failed), turn.complete (with its real
// duration) and $.session.usage() for the context percentage. Nothing is
// timed or invented; the only timer returns the scene to calm after a finish.

const MODES: Mode[] = ['system', 'monarch', 'dungeon']
const DEFAULT_MODE: Mode = 'monarch'
const ZERO: Counts = { turns: 0, tools: 0, failures: 0, steps: 0 }

const phase = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'phase' } as const, 'idle')
const mode = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'mode' } as const, DEFAULT_MODE)
const pct = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'pct' } as const, 0)
const counts = atom({ plugin: 'solo-leveling-shadow-monarch', key: 'counts' } as const, ZERO)

const LABEL: Record<Phase, string> = {
  idle: 'at ease',
  thinking: 'surveying',
  generating: 'forging',
  tools: 'arise: executing',
  done: 'quest cleared',
  error: 'penalty',
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
let calmTimer: { cancel: () => void } | undefined

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
    return
  }
  const value = Math.round(context.percent)
  await update($, pct, () => value)
  const band = value >= 90 ? 90 : value >= 80 ? 80 : 0

  if (band > warned) {
    $.ui.toast(`Warning: context ${value}% full. Consider /compact.`)
  }
  warned = band
}

async function applyLook($: EngineInterface, which: Mode) {
  const { theme, problems } = colorsFor(which)
  const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

  if (unpainted !== undefined) {
    $.ui.toast(unpainted)
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
  await update($, counts, c => ({ ...c, [key]: c[key] + 1 }))
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
      description: 'Shadow Monarch: /shadow system | monarch | dungeon | status',
    })
    // A build with no theme support must not stop the band and the counters.
    await applyLook($, which).catch(error => $.ui.log(`solo-leveling-shadow-monarch: no theme: ${String(error)}`))
    await refreshContext($).catch(() => undefined)

    return next(e)
  })

  on('command.run', { command: 'shadow' }, async ($, e) => {
    const want = e.args.trim().toLowerCase()
    const now = await read($, mode)

    if (want === '') {
      return { text: `World: ${now}. Use /shadow system, monarch, dungeon or status.` }
    }

    if (want === 'status') {
      const c = await read($, counts)
      const p = await read($, phase)
      const percent = await read($, pct)

      return {
        text: `Real events seen this session: turns ${c.turns}, model steps ${c.steps}, tool calls ${c.tools}, tool failures ${c.failures}. State: ${p}. Context: ${percent}%. World: ${now}.`,
      }
    }

    if (!isMode(want)) {
      return { text: `Unknown world "${want}". Use system, monarch or dungeon.` }
    }
    await $.store.set('sl-mode', want)
    await update($, mode, () => want)
    let note = ''
    await applyLook($, want).catch(() => {
      note = ' (this build draws no themes, so only the band changed)'
    })

    return { text: `World set to ${want}.${note}` }
  })

  // The backdrop redraws whenever phase, world, context or tool count changes.
  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }

    if (e.props.plugin !== $.plugin.name) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const c = await read($, counts)
    const svg = buildScene({
      mode: await read($, mode),
      phase: await read($, phase),
      pct: await read($, pct),
      army: c.tools,
    })

    return <Svg source={svg} alt="A shadow knight beside a throne, with an army that grows as tools run" isInteractive />
  })

  // The status band: title, state, real counts and the real context meter.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }
    const { Box, Text } = $.ui.resolve(e)
    const m = await read($, mode)
    const p = await read($, phase)
    const percent = await read($, pct)
    const c = await read($, counts)
    const tone = TONE[m]
    const warn = percent >= 80
    const stateColor = p === 'error' ? '#FF4D63' : p === 'done' ? tone.eye : tone.glow2

    return (
      <Box>
        <Text color={tone.glow}>◆ </Text>
        <Text color={tone.glow2} bold>{TITLE[m]}</Text>
        <Text color={tone.glow}> ◆ </Text>
        <Text color={stateColor}>{LABEL[p]}</Text>
        <Text color="#8FA0B8"> │ turns {c.turns} · tools {c.tools}{c.failures > 0 ? ` · fails ${c.failures}` : ''}</Text>
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
          await setPhase($, 'tools')
        }
      }
      yield chunk
    }
  })

  on('tool.call', async ($, e, next) => {
    await setPhase($, 'tools')
    await bump($, 'tools')
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError === true) {
      await bump($, 'failures')
      await setPhase($, 'error')
      $.ui.toast(`Penalty: ${e.tool} failed`)
    }
    await refreshContext($).catch(() => undefined)

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await bump($, 'turns')
      await refreshContext($).catch(() => undefined)
      await setPhase($, e.reason === 'error' ? 'error' : e.isAborted ? 'idle' : 'done')

      if (e.reason !== 'error' && !e.isAborted && e.durationMs >= 15000) {
        $.ui.toast(`Quest cleared in ${Math.round(e.durationMs / 1000)}s`)
      }
    }

    return next(e)
  })
}
