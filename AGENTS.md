# AGENTS.md

Guidance for AI agents working in this repository.

## What this project is

A client-only React SPA that generates printable **foldable initiative cards** and
**tabletop pawns** for RPG game masters. Users upload portraits, tune per-card options,
and export an A4 PDF that hangs on a GM screen (cards) or stands on the table (pawns).

- No backend, no database, no API keys. Everything runs in the browser.
- Deployed to GitHub Pages from `main` — see `.github/workflows/deploy.yml`.
- **The UI is in Russian**; code identifiers and comments are in English.

## Commands

```bash
npm run dev        # Vite dev server
npm test           # vitest run (all tests)
npx vitest run src/utils/pawnLayout.test.ts   # single test file
npm run lint       # eslint .
npm run build      # tsc -b && vite build  (typecheck is part of build)
npm run preview    # serve the production build
```

Before finishing a task, run all three: `npm run lint`, `npm test`, `npm run build`.

## TypeScript / build constraints

`tsconfig.app.json` is strict and enables `noUnusedLocals`, `noUnusedParameters`,
`verbatimModuleSyntax`, and `erasableSyntaxOnly`. In practice this means:

- Type-only imports **must** use `import type { X }` — mixed value/type imports fail the build.
- No `enum`, `namespace`, or constructor parameter properties (not erasable).
  Use string union types + `as const` objects instead (see `src/types.ts`).
- Unused variables/params fail `npm run build`, not just lint.
- `*.test.ts` files are excluded from `tsconfig.app.json`; tests are typechecked by Vitest only.

## Tests run in a Node environment

`vite.config.ts` sets `test.environment = 'node'` — there is **no jsdom and no React
Testing Library**. Consequences:

- Only pure logic is unit-tested (layout math, packing, plural forms, image ingest).
  Tests colocate as `src/**/*.test.ts`.
- Never assume `window`, `document`, or canvas exists in code paths reachable from tests.
  Guard DOM access (`typeof document === 'undefined'`) or keep DOM usage in modules the
  tests stub. `src/utils/imageIngest.test.ts` stubs `URL.createObjectURL/revokeObjectURL`
  via `vi.stubGlobal` — follow that pattern.
- When adding DOM-dependent logic, extract the decision-making into a pure function in
  `src/utils/` and test that.

## Core architecture: one geometry, two renderers

The same sheet is rendered twice: once as an on-screen preview (React + CSS) and once as a
PDF (jsPDF + `<canvas>`). Both must agree pixel-for-millimeter, or what the user sees is
not what they print.

- **`src/constants.ts` is the single source of truth for all sheet geometry**, in
  millimeters. Card/face/base sizes are computed through helpers (`getCardWidth`,
  `getFaceHeight`, `getHalfWidth`, `getBaseHeight`, `getHangingPortraitAspect`, ...),
  never hardcoded. Screen components and `src/utils/pdfGenerator.ts` both call these.
  Change geometry here and both renderers follow; hardcoding a size anywhere is a bug.
- **Two layouts**, switched by `CardsPerPageOption` (`4 | 20`) and `isPawnLayout()`:
  - `4` — initiative cards: two faces side by side, rotated ±90° in the PDF
    (`rotatePortraitToHalf`) so the folded card hangs.
  - `20` — pawn sheet: `8 × 2` grid, sides stacked A / fold / B with a cut-out base tab
    (`PAWN_BASE_FRACTION_OF_PAWN`). Variable-size packing lives in `src/utils/pawnLayout.ts`.
- Screen side: `src/components/CardFace.tsx`, `CardSideFrame.tsx`, `FilledCharacterImage.tsx`,
  `FittedName.tsx`. PDF side: `src/utils/pdfGenerator.ts` with helpers
  (`nameLabelRender.ts`, `dndStatsRender.ts`, `imageFillLayout.ts`, `presetOverlays.ts`).
  **A feature that changes card appearance must be implemented on both sides.**

## Conventions

- Per-card options are split across `src/components/cardOptions/*` (sections of the modal),
  with option lists in `cardOptions/optionLists.ts` — add new choices there, not inline.
- CSS is colocated next to its component (`Card.tsx` + `Card.css`); shared visual rules
  live in `src/styles/cardVisuals.css`.
- **All user-visible strings are Russian.** New labels, buttons, errors, and toast text must
  be Russian. Use `src/utils/pluralRu.ts` for Russian plural forms ("2 карточки", "5 карточек").
- `src/types.ts` holds shared types plus defaults (`defaultNameSettings`,
  `DEFAULT_IMAGE_FOCUS`, `DEFAULT_PAWN_SIZE`). Add new option values as union members here
  and keep `default*` constants in sync.
- Commit messages are written in Russian (see `git log`).

## Gotchas that will bite you

- **Base path.** Vite is configured with `base: '/CharacterCardGenerator/'`. Never reference
  public assets with a leading `/` — build URLs from `import.meta.env.BASE_URL`
  (see `src/utils/presetOverlays.ts`), otherwise they 404 on GitHub Pages.
- **Blob URL lifecycle.** Card images and the PDF are object URLs. Every
  `URL.createObjectURL` needs a matching `revokeObjectURL` on replace, duplicate, delete,
  and unmount — leaked URLs have caused bugs before (`src/utils/imageIngest.ts`, `App.tsx`).
- **Font loading before PDF text.** `ensureNameFontsLoaded()` (Web API `document.fonts`)
  must resolve before measuring/drawing names, or the PDF falls back to substitute fonts
  and misfits long names.
- **Canvas contexts can be null.** Use `get2dContext()` from `src/utils/canvas2d.ts`
  instead of `canvas.getContext('2d')!`.
- HEIC support is best-effort and browser-dependent; decode failures surface through
  `ingestError` in `App.tsx` rather than throwing.
- `dist/` is committed-adjacent but gitignored; GitHub Pages builds it in CI — do not edit it.
