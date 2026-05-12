# Standalone test pages

These HTML files load the production bundle (`dist/superpro-light-card.js`) as an ES module and render the components against in-page mock data, without needing Home Assistant.

## How to open

`file://` does NOT work — browsers reject ES module imports across the file scheme via CORS. Serve over HTTP instead. From the workspace root (`cairo-v1/`):

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit:

- Mindmap geometries (Phase 4): http://localhost:8765/assets/test/mindmap-test.html

Stop the server with `Ctrl+C` (or kill the background process).

## Why a server

Rollup ships the bundle as ESM (`format: 'es'`). `<script type="module">` requires same-origin loading, which the `file://` scheme can't provide. Serving the workspace via plain HTTP lets the browser resolve `../../dist/superpro-light-card.js` from the test HTML normally.

## When tests need to evolve

Add a new HTML next to `mindmap-test.html`. Mock state should be plain JS objects matching the typed prop shapes in `src/components/<component>.ts`. Avoid pulling in any HA mocks — the components are designed to take pre-derived state so the tests stay simple.
