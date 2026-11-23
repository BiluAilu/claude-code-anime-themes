import { expect, test } from 'claude-code/testing'

for (const surface of ['desktop', 'mobile'] as const) {
  test(`the backdrop draws one Svg on ${surface}`, async ($, on) => {
    const ui = await $.ui.mount({
      plugin: 'yato-killua-godspeed',
      surface,
      component: 'Backdrop',
      props: { scene: 'godspeed-dual', plugin: 'yato-killua-godspeed', glass: false },
    })
    const svg = await ui.find({ type: 'Svg' })
    expect(svg).toBeDefined()
    await ui.unmount()
  })
}
