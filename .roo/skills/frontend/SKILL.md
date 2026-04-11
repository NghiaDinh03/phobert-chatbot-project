---
name: frontend
description: Guide Next.js frontend development patterns, component architecture, and styling for the CyberAI platform.
---

Use this skill for page creation, component design, styling, API integration, theming, accessibility, and frontend build configuration.

Primary intent:
- Maintain consistent, accessible, and performant frontend architecture using Next.js App Router patterns.
- Standardize component structure, styling approach, and API client usage.

Reference direction:
- App Router pages: `frontend-next/src/app/`
- Shared components: `frontend-next/src/components/`
- Static data: `frontend-next/src/data/`
- API client: `frontend-next/src/lib/api.js`
- i18n translations: `frontend-next/src/i18n/`
- Next config: `frontend-next/next.config.js`
- Package manifest: `frontend-next/package.json`

## Framework

- Next.js 15.1 with App Router (not Pages Router).
- React 19.
- Standalone output mode for Docker deployment.
- API proxy: `next.config.js` rewrites `/api/:path*` → `http://backend:8000/api/:path*`.

## Project structure

- `frontend-next/src/app/` — App Router pages.
- `frontend-next/src/components/` — shared components.
- `frontend-next/src/data/` — static data (standards, controls, templates).
- `frontend-next/src/lib/` — utilities (API client).
- `frontend-next/src/i18n/` — translation files (en.json, vi.json).

## Pages

- `/` (Dashboard) — system stats, module cards.
- `/chatbot` — multi-model AI chat with SSE streaming.
- `/form-iso` — 4-step assessment wizard.
- `/standards` — standards library with upload.
- `/analytics` — dashboard with charts.
- `/templates` — template library.
- `/landing` — landing page.
- `/settings` — language, docs library, user guides.

## Component patterns

- Use CSS Modules (`.module.css`) — NOT Tailwind, NOT styled-components.
- File naming: `ComponentName.js` + `ComponentName.module.css`.
- Client components: use `'use client'` directive when using hooks/state/effects.
- Server components: default for static content (layout, page shells).
- State management: React `useState`/`useReducer`, no external state library.
- Theming: ThemeProvider context for dark/light mode.
- Icons: lucide-react library.
- Markdown: react-markdown + remark-gfm + rehype-raw + react-syntax-highlighter.
- Reusable markdown renderer: `src/components/MarkdownRenderer.js`.

## API client patterns (`src/lib/api.js`)

- All API calls go through the proxy `/api/...` (not direct to `backend:8000`).
- SSE streaming: use `fetch` with `ReadableStream` for chat streaming.
- Error handling: check `response.ok`, parse JSON error body.
- Polling: use `setInterval` for background assessment status checks (8s interval).

## Accessibility

- Semantic HTML elements (`nav`, `main`, `section`, `article`).
- ARIA labels on interactive elements.
- Keyboard navigation support.
- Color contrast compliance (both themes).

## i18n rules

- All UI-visible text must use `t('key')` — never hardcode strings in components.
- Vietnamese (vi.json): pure Vietnamese. No parenthesized English like "Settings (Cài đặt)".
- English (en.json): pure English. No Vietnamese annotations.
- Exception: genuine technical terms with no Vietnamese equivalent (RAG, SIEM, Annex A, ChromaDB, Pipeline, etc.) stay in English in both languages.

## Rules

- Never import from `backend/` — frontend and backend are separate containers.
- Always use CSS Modules for styling (no inline styles except dynamic values).
- Always use `'use client'` for components with hooks.
- Keep components under 300 lines — extract sub-components.
- Use `localStorage` for session persistence (chat sessions, theme preference).
- No direct backend URL references — always use `/api/` proxy path.

## Comment policy

Allowed:
- CSS section dividers: `/* ── Section Name ── */`
- JSX section markers: `{/* Section Name */}`
- One-line JSDoc on exported components.
- Bug-fix references: `BUG N FIX: reason`
- Non-obvious logic or browser workaround notes.

Forbidden:
- Tutorial-style explanations ("This function does X because Y").
- Banner decorations or ASCII art.
- Obvious comments ("// set state", "// return value", "// import React").
- Inline translations in comments.
- Commented-out dead code (delete it).
