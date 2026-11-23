// Colors move toward a character's own color without losing the world's identity.
export type Hex = `#${string}`

function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '')

  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function two(n: number) {
  return Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
}

// A share t of `toward` mixed into `base`, as a six-digit hex.
export function mix(base: string, toward: string, t: number): Hex {
  const a = parse(base)
  const b = parse(toward)

  return `#${two(a[0] + (b[0] - a[0]) * t)}${two(a[1] + (b[1] - a[1]) * t)}${two(a[2] + (b[2] - a[2]) * t)}`
}

// A CSS color that is one value in light mode and another in dark mode; the scene's own
// color-scheme follows the app's.
export function ld(light: string, dark: string) {
  return `light-dark(${light}, ${dark})`
}
