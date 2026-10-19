import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('dist-electron', { recursive: true });
await build({
  entryPoints: ['src/main/index.ts', 'src/preload/index.ts'],
  outdir: 'dist-electron',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  sourcemap: true,
  external: ['electron'],
  target: 'node20'
});
