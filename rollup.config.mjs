import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

const isDev = process.env.ROLLUP_WATCH === 'true';

export default {
  input: 'src/everyday-light-card.ts',
  output: {
    file: 'dist/everyday-light-card.js',
    format: 'es',
    // Inline dynamic imports so the editor (loaded lazily via getConfigElement)
    // ends up in the same single .js HACS ships. One URL, one resource entry.
    inlineDynamicImports: true,
    // Always emit a sourcemap; rollup's typescript plugin produces one and
    // refuses if rollup wouldn't consume it. Cost is tiny vs. debug value.
    sourcemap: true,
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    json(),
    typescript({ tsconfig: './tsconfig.json' }),
    !isDev && terser({ format: { comments: false } }),
  ].filter(Boolean),
  watch: {
    include: 'src/**/*',
  },
};
