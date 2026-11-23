// @ts-nocheck - the test kit's loose engine mocks are not worth full typings
import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'yato-killua-godspeed',
  surface: 'desktop' as const,
  component: 'AbovePrompt' as const,
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 4, bodyColumns: 100, scroll: { offset: 0, bodyRows: 20 }, view: {} },
}

const usage = { pct: 10 }

async function words($: any) {
  const ui = await $.ui.mount(BAND)
  const out = (await ui.findAll({ type: 'Text' })).map((t: { text: string }) => t.text).join('|')
  await ui.unmount()

  return out
}

function engine(on: any) {
  on('ui.toast', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: { command: 'godspeed' } }))
  on('clock.after', () => ({ value: { cancel: () => undefined } }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 1000, tokens: usage.pct * 10, percent: usage.pct }, rateLimits: [] } }))
  on('tool.call', () => ({ result: {} }))
  for (const name of ['SubagentStart', 'SubagentStop', 'PermissionRequest', 'PermissionDenied', 'PostToolUse', 'PostToolUseFailure', 'PreCompact', 'PostCompact']) {
    on(`classic.${name}`, () => ({}))
  }
}

test('subagents show as spirits and are counted', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.classic.SubagentStart({ agent_id: 'a1', agent_type: 'Explore' })
  await $.classic.SubagentStart({ agent_id: 'a2', agent_type: 'Plan' })
  expect(await words($)).toContain('spirits 2')
  await $.classic.SubagentStop({ agent_id: 'a1', agent_type: 'Explore', stop_hook_active: false, agent_transcript_path: '/x' })
  expect(await words($)).toContain('spirits 1')
  const out = await $.command.run({ command: 'godspeed', args: 'status' })
  expect(JSON.stringify(out)).toContain('subagents started 2 (1 running)')
})

test('a permission prompt shows waiting until the tool finishes', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: { command: 'ls' } })
  expect(await words($)).toContain('awaiting your word')
  await $.classic.PostToolUse({ tool_name: 'Bash', tool_input: {}, tool_response: {}, tool_use_id: 'u1' })
  expect(await words($)).not.toContain('awaiting your word')
})

test('compaction shows cleansing, then the new real percentage', async ($, on) => {
  engine(on)
  usage.pct = 90
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.classic.PreCompact({ trigger: 'manual', custom_instructions: null })
  expect(await words($)).toContain('cleansing')
  usage.pct = 30
  await $.classic.PostCompact({ trigger: 'manual', compact_summary: 's' })
  const w = await words($)
  expect(w).toContain('30%')
  expect(w).not.toContain('cleansing')
})

test('each tool kind gets its own effect label from the real tool name', async ($, on) => {
  engine(on)
  usage.pct = 10
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const [tool, label, extra] of [
    ['Edit', 'slash', { file_path: '/x', old_string: 'a', new_string: 'b' }],
    ['Read', 'scout', { file_path: '/x' }],
    ['WebFetch', 'gate', { url: 'https://example.com', prompt: 'p' }],
    ['Bash', 'dash', { command: 'ls' }],
  ] as const) {
    await $.tool.call({ tool, ...extra })
    expect(await words($)).toContain(label)
  }
})

test('/godspeed off hides the band, /godspeed on brings it back', async ($, on) => {
  engine(on)
  // Nothing sits beneath the mod in a test: this stands for the engine's own drawing.
  on('ui.render', ($2, e) => {
    const { Text } = $2.ui.resolve(e)

    return <Text>engine</Text>
  })
  usage.pct = 10
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(await words($)).toContain('calm')
  const off = await $.command.run({ command: 'godspeed', args: 'off' })
  expect(JSON.stringify(off)).toContain('Theme off')
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /calm/ })).toBeUndefined()
  await ui.unmount()
  const back = await $.command.run({ command: 'godspeed', args: 'on' })
  expect(JSON.stringify(back)).toContain('Theme on')
  expect(await words($)).toContain('calm')
})

test('the band stays quiet while the other mod owns the theme', async ($, on) => {
  engine(on)
  on('ui.render', ($2, e) => {
    const { Text } = $2.ui.resolve(e)

    return <Text>engine</Text>
  })
  usage.pct = 10
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(await words($)).toContain('calm')
  const base = { plugin: 'yato-killua-godspeed', surface: 'desktop' as const, component: 'Backdrop' as const }
  let ui = await $.ui.mount({ ...base, props: { scene: 'shadow-monarch', plugin: 'solo-leveling-shadow-monarch', glass: false } })
  await ui.unmount()
  ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /calm/ })).toBeUndefined()
  await ui.unmount()
  ui = await $.ui.mount({ ...base, props: { scene: 'godspeed-dual', plugin: 'yato-killua-godspeed', glass: false } })
  await ui.unmount()
  expect(await words($)).toContain('calm')
})
