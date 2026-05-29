<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Tailwind / PostCSS (production)

Do **not** change `app/globals.css` or `postcss.config.mjs` to fix local Turbopack path warnings. Use `turbopack.root` in `next.config.ts` only. See `.cursor/rules/tailwind-postcss-vercel.mdc` for forbidden patterns (`base: projectRoot`, `../node_modules/tailwindcss/...` import).
