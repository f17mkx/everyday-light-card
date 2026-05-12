# Contributing

Thanks for considering a PR. This card is a personal project, but I welcome bug reports, config-edge-case scenarios, and well-scoped fixes.

## Bug reports

Open an issue at https://github.com/f17mkx/everyday-light-card/issues with:

1. **HA version** (Settings → About).
2. **Browser** (Chrome 124, Safari 17, etc.).
3. **Card config** (full YAML for the card with the bug).
4. **Expected behavior** vs **actual behavior** — one sentence each.
5. **Reproduction steps** — start from a fresh dashboard load.
6. Console output if there's a JS error (DevTools → Console, copy red text).

Screenshots help when the issue is visual. GIFs or screen recordings beat screenshots when the issue is gesture-related.

## Feature requests

Open an issue with the `enhancement` label. Include:

- The real-life scenario you want to support (concrete: "morning routine for the bedroom" beats "more flexibility").
- Why the existing config flags don't already cover it.
- Sketch of the desired YAML config — what would your ideal `type: custom:everyday-light-card ...` block look like?

I'll respond with: yes/no, and if yes, my best guess at scope.

## Pull requests

### Small fixes (1-line bug, typo, doc edit)

Open the PR directly. I'll review.

### Larger changes (new feature, refactor, new render-mode)

**Open an issue first** so we can align on scope before you write code. I've shipped multiple "almost-mergeable" PRs that I had to ask the author to redo because the scope didn't match what I had in mind. Save us both the time.

### Branch + commit conventions

- Branch from `main`. Branch name: `f17mkx/<topic>` for my own branches, `<your-handle>/<topic>` for external contributors.
- One commit per logical unit. Squash before merging only if the history is messy.
- Gitmoji prefix: `✨ feat:`, `🐛 fix:`, `♻️ refactor:`, `📚 docs:`, `🧪 test:`, `🔥 cleanup:`, `🔒 chore:`, `🎨 polish:`. Use them.
- Inline code comments are required for new logic. Explain *why*, not *what* — well-named identifiers cover the *what*.
- CHANGELOG entry for every user-visible change. Format mirrors the existing entries.

### Local development

```bash
git clone https://github.com/f17mkx/everyday-light-card.git
cd everyday-light-card
npm install
npm run dev   # rollup watch mode
```

Symlink `dist/everyday-light-card.js` into your test HA's `/config/www/`:

```bash
ln -sf "$(pwd)/dist/everyday-light-card.js" /your/ha/config/www/everyday-light-card.js
```

Or `scp -O` the file after each build (see `scripts/sync-to-public.sh` for the production sync).

### Testing

Phase 16 brings a unit-test framework. Until then: manual smoke-test against the demo cards in `assets/demo/cards/`. PRs that change rendering should include a screenshot or GIF showing the diff.

### Pre-commit checklist

`npm run build` MUST succeed locally before you push:

1. `npm run lint:css-comments` (auto-runs as `prebuild`) — catches the recurring TS1442 backtick-in-CSS-comment bug.
2. `npm run build` — TypeScript compile + Rollup bundle.
3. Manual smoke test against at least the demo card type your change touches.

### Style

- TypeScript strict mode. Prefer explicit types over inference at module boundaries.
- Lit reactive components. No React, no Vue, no jQuery, no global state.
- CSS: scoped to component shadow DOM via `static styles = css`...``. No external stylesheets.
- File-naming: `kebab-case.ts`. One Lit element per file (the `@customElement` registration).
- No emojis in code unless the user explicitly asks. CHANGELOG and PR descriptions get gitmoji.

## Code of Conduct

Be kind to everyone, including yourself. If you're frustrated by an issue, take a walk before you reply. We're all building this in our spare time.
