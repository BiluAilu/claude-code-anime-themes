import type { Art } from './art.js'

// Places a traced silhouette with its bottom-centre (or centre) at x,y.
// flipY mirrors it downward, for a reflection in water.
export function place(
  a: Art,
  o: { x: number; y: number; s: number; cls: string; anchor?: 'bottom' | 'center'; flip?: boolean; flipY?: boolean },
) {
  const sx = o.flip ? -o.s : o.s
  const sy = o.flipY ? -o.s : o.s
  const dy = o.anchor === 'center' ? -a.h / 2 : -a.h

  return `<g transform="translate(${o.x},${o.y}) scale(${sx},${sy})"><path class="${o.cls}" d="${a.d}" transform="translate(${-a.w / 2},${dy})"/></g>`
}
