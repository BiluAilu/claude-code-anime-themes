// @ts-nocheck - the test kit's loose engine mocks are not worth full typings

import { expect, test } from 'claude-code/testing'

const BAND = (surface: 'terminal' | 'desktop') => ({
  plugin: 'solo-leveling-shadow-monarch',
  surface,
  component: 'AbovePrompt' as const,
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 4, bodyColumns: 100, scroll: { offset: 0, bodyRows: 20 }, view: {} },
})

const BACKDROP = (surface: 'desktop' | 'mobile', scene: string) => ({
  plugin: 'solo-leveling-shadow-monarch',
  surface,
  component: 'Backdrop' as const,
  props: { scene, plugin: 'solo-leveling-shadow-monarch', glass: false as const },
})

for (const surface of ['desktop', 'mobile'] as const) {
  test(`the backdrop draws one Svg on ${surface}`, async ($, on) => {
    on('command.register', () => ({ value: { command: 'shadow' } }))
    const ui = await $.ui.mount(BACKDROP(surface, 'shadow-monarch'))
    const svg = await ui.find({ type: 'Svg' })
    expect(svg).toBeDefined()
    await ui.unmount()
  })
}

test('another mod\'s backdrop is left alone', async ($, on) => {
  on('ui.render', ($2, e) => {
    const { Text } = $2.ui.resolve(e)

    return <Text>other</Text>
  })
  const ui = await $.ui.mount({ ...BACKDROP('desktop', 'x'), props: { scene: 'x', plugin: 'someone-else', glass: false as const } })
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  await ui.unmount()
})

test('real events move the counts and the band', async ($, on) => {
  on('command.register', () => ({ value: { command: 'shadow' } }))
  const toasts: string[] = []
  on('ui.toast', (_, e) => {
    toasts.push(String((e as { text?: string }).text))
    return { value: undefined }
  })
  on('ui.log', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 1000, tokens: 850, percent: 85 }, rateLimits: [] } }))
  on('turn.start', () => ({ turnId: 't1' }))
  on('tool.call', () => ({ result: {} }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('clock.after', () => ({ value: { cancel: () => undefined } }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.turn.start({ text: 'hello', turnId: 't1' })
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Read', file_path: '/x' })
  await $.turn.complete({ answer: 'ok', durationMs: 20000, isAborted: false, turnId: 't1', reason: 'answer' })

  expect(toasts.join('|')).toContain('85%')
  expect(toasts.join('|')).toContain('Quest cleared in 20s')

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount(BAND(surface))
    const words = (await ui.findAll({ type: 'Text' })).map(t => t.text).join('|')
    expect(words).toContain('turns 1')
    expect(words).toContain('tools 2')
    expect(words).toContain('85%')
    expect(words).toContain('quest cleared')
    await ui.unmount()
  }
})

async function bandWords($: any) {
  const ui = await $.ui.mount(BAND('desktop'))
  const words = (await ui.findAll({ type: 'Text' })).map((t: { text: string }) => t.text).join('|')
  await ui.unmount()

  return words
}

const usage = { pct: 10 }

function engine(on: any) {
  on('ui.toast', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: { command: 'shadow' } }))
  on('clock.after', () => ({ value: { cancel: () => undefined } }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 1000, tokens: usage.pct * 10, percent: usage.pct }, rateLimits: [] } }))
  on('turn.start', () => ({ turnId: 't1' }))
}

test('the stream drives thinking, writing and tool states', async ($, on) => {
  engine(on)
  let kind: 'thinking' | 'text' | 'tool' = 'thinking'
  on('turn.step', async function* () {
    // The engine's bottom: yield a real-shaped chunk, return the step's result.
    if (kind === 'thinking') {
      yield { kind: 'thinking', index: 0, text: 'hm', ref: 1 }
    } else if (kind === 'text') {
      yield { kind: 'text', index: 0, text: 'hi', ref: 2 }
    } else {
      yield { kind: 'tool', index: 0, id: 'u1', name: 'Bash', ref: 3 }
    }

    return { turnId: 't1', index: 0, answer: '', toolUses: [], stopReason: 'end_turn', usage: null }
  })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.turn.start({ text: 'go', turnId: 't1' })

  for (const [k, word] of [['thinking', 'surveying'], ['text', 'forging'], ['tool', 'arise']] as const) {
    kind = k
    for await (const _chunk of $.turn.step({ turnId: 't1', index: 0, model: 'm', messageCount: 1 })) {
      void _chunk
    }
    expect(await bandWords($)).toContain(word)
  }
})

test('a failed tool shows the penalty state and counts the failure', async ($, on) => {
  engine(on)
  on('tool.call', () => ({ result: {}, isError: true }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'false' })
  const words = await bandWords($)
  expect(words).toContain('penalty')
  expect(words).toContain('fails 1')
})

for (const world of ['system', 'monarch', 'dungeon'] as const) {
  test(`the ${world} world draws and the command switches to it`, async ($, on) => {
    engine(on)
    await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
    const out = await $.command.run({ command: 'shadow', args: world })
    expect(JSON.stringify(out)).toContain(world)
    const ui = await $.ui.mount(BACKDROP('desktop', `shadow-${world}`))
    expect(await ui.find({ type: 'Svg' })).toBeDefined()
    await ui.unmount()
  })
}

test('status reports the real event counts', async ($, on) => {
  usage.pct = 10
  engine(on)
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  const out = await $.command.run({ command: 'shadow', args: 'status' })
  expect(JSON.stringify(out)).toContain('tool calls 1')
})

function classicEngine(on: any) {
  engine(on)
  for (const name of ['SubagentStart', 'SubagentStop', 'PermissionRequest', 'PermissionDenied', 'PostToolUse', 'PostToolUseFailure', 'PreCompact', 'PostCompact']) {
    on(`classic.${name}`, () => ({}))
  }
  on('tool.call', () => ({ result: {} }))
}

test('subagents start and stop: soldiers appear and leave', async ($, on) => {
  classicEngine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.classic.SubagentStart({ agent_id: 'a1', agent_type: 'Explore' })
  await $.classic.SubagentStart({ agent_id: 'a2', agent_type: 'Plan' })
  expect(await bandWords($)).toContain('soldiers 2')
  await $.classic.SubagentStop({ agent_id: 'a1', agent_type: 'Explore', stop_hook_active: false, agent_transcript_path: '/x' })
  expect(await bandWords($)).toContain('soldiers 1')
  const out = await $.command.run({ command: 'shadow', args: 'status' })
  expect(JSON.stringify(out)).toContain('subagents started 2 (1 running)')
})

test('a permission prompt shows the waiting state until the tool finishes', async ($, on) => {
  classicEngine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: { command: 'ls' } })
  expect(await bandWords($)).toContain('awaiting your word')
  await $.classic.PostToolUse({ tool_name: 'Bash', tool_input: {}, tool_response: {}, tool_use_id: 'u1' })
  expect(await bandWords($)).not.toContain('awaiting your word')
  const out = await $.command.run({ command: 'shadow', args: 'status' })
  expect(JSON.stringify(out)).toContain('permission prompts 1')
})

test('compaction shows the purge state, then the real before and after', async ($, on) => {
  classicEngine(on)
  usage.pct = 90
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.classic.PreCompact({ trigger: 'manual', custom_instructions: null })
  expect(await bandWords($)).toContain('purging the shadows')
  usage.pct = 30
  await $.classic.PostCompact({ trigger: 'manual', compact_summary: 's' })
  const words = await bandWords($)
  expect(words).toContain('30%')
  expect(words).not.toContain('purging')
})

test('each tool kind gets its own effect label from the real tool name', async ($, on) => {
  classicEngine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const [tool, label, extra] of [
    ['Edit', 'slash', { file_path: '/x', old_string: 'a', new_string: 'b' }],
    ['Read', 'scout', { file_path: '/x' }],
    ['WebFetch', 'gate', { url: 'https://example.com', prompt: 'p' }],
    ['Bash', 'dash', { command: 'ls' }],
  ] as const) {
    await $.tool.call({ tool, ...extra })
    expect(await bandWords($)).toContain(label)
  }
})
