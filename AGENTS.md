<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Icons — Colombia Icons

This project uses `@mteherandev/colombia-icons-react` for interface icons.
Prefer it over Unicode symbols, inline SVGs, or other icon packs. Components use
Spanish PascalCase names, inherit `currentColor`, and should be decorative with
`aria-hidden="true"` when adjacent text already supplies the accessible label.
Browse available names at <https://colombia-icons.com>; do not invent exports.
