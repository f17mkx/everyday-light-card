import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the everyday-light-card test suite.
 *
 * Stefan-2026-05-10 P16-bootstrap: pure-helper tests run in node + happy-dom
 * for browser-like APIs (HTMLElement, getBoundingClientRect, etc.). Lit
 * components are NOT yet covered — Lit's lifecycle requires a real DOM
 * runtime which happy-dom's stubbed implementation only partially provides.
 * Component tests deferred to P16 phase-2 once the helper baseline is solid.
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    globals: false,                   // explicit `import { describe, it } from 'vitest'`
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['dist/**', 'assets/**', 'docs/**', 'node_modules/**'],
    },
  },
});
