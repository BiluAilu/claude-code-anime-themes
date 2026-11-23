# Art build tool

`hooks/art.ts` (scenery) and `hooks/chars.ts` (characters) are generated: original silhouette images were traced into compact SVG paths with `potrace` (`npm i potrace`). `trace.mjs` and `jobs.json` trace the scenery; each character pose is traced at one fixed scale, and its head and leading-hand points are measured from the image. The source images are not shipped.
