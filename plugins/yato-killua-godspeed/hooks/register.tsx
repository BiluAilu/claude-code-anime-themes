import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import type { Mode, Phase } from '../types'
import { GLASS, colorsFor, styleFor } from './palette.js'
import { buildScene } from './scene.js'

const NAME = 'yato-killua-godspeed' as const
const MODES: Mode[] = ['divine', 'godspeed', 'dual']
const DEFAULT_MODE: Mode = 'dual'

const phase = atom({ plugin: 'yato-killua-godspeed', key: 'phase' } as const, 'idle')
const mode = atom({ plugin: 'yato-killua-godspeed', key: 'mode' } as const, DEFAULT_MODE)
const pct = atom({ plugin: 'yato-killua-godspeed', key: 'pct' } as const, 0)

const LABEL: Record<Phase, string> = {
  idle: 'calm',
  thinking: 'thinking',
  generating: 'writing',
  tools: 'godspeed',
  done: 'done',
  error: 'error',
}

function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && (MODES as string[]).includes(value)
}

import type { EngineInterface } from 'claude-code'

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
    return
  }
  const value = Math.round(context.percent)
  await update($, pct, () => value)

  // Real figure, said once per band as it climbs.
  const band = value >= 90 ? 90 : value >= 80 ? 80 : 0

  if (band > warned) {
    $.ui.toast(`Context ${value}% full - consider /compact`)
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
      description: 'Switch look: /godspeed divine | godspeed | dual (default dual)',
    })
    await applyLook($, which)
    await refreshContext($).catch(() => undefined)

    return next(e)
  })

  on('command.run', { command: 'godspeed' }, async ($, e) => {
    const want = e.args.trim().toLowerCase()

    if (want === '') {
      const now = await read($, mode)

      return { text: `Mode: ${now}. Use /godspeed divine, godspeed or dual.` }
    }

    if (!isMode(want)) {
      return { text: `Unknown mode "${want}". Use divine, godspeed or dual.` }
    }
    await $.store.set('mode', want)
    await update($, mode, () => want)
    await applyLook($, want)

    return { text: `Mode set to ${want}.` }
  })

  // Backdrop redraws whenever phase, mode or context percent changes.
  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.plugin !== $.plugin.name) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const svg = buildScene({ mode: await read($, mode), phase: await read($, phase), pct: await read($, pct) })

    return <Svg source={svg} alt="A midnight shrine gate under drifting blue light, with lightning at the edge" isInteractive />
  })

  // A slim band: shrine gate, a divider, lightning, then real figures only.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }
    const { Box, Text } = $.ui.resolve(e)
    const p = await read($, phase)
    const percent = await read($, pct)
    const m = await read($, mode)
    const warn = percent >= 80

    return (
      <Box>
        <Text color="#8CCEFF">⛩ </Text>
        <Text color="#426BFF">━━</Text>
        <Text color="#00F0FF"> ⚡ </Text>
        <Text color="#C8D9EA">{m} · {LABEL[p]}</Text>
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
    const ran = await next(e)

    if (ran.deny === undefined && ran.isError === true) {
      await setPhase($, 'error')
      $.ui.status(`⚡ ${e.tool} failed`)
    }
    await refreshContext($).catch(() => undefined)

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    await refreshContext($).catch(() => undefined)
    await setPhase($, e.reason === 'error' ? 'error' : e.isAborted ? 'idle' : 'done')
    $.ui.status(undefined)

    return next(e)
  })
}
