---
type: doc-health
date: 2026-03-25
prevention_scope: markdownlint + lychee
ci_platform: github-actions
language_stack: js-ts-python
---

# Documentation Audit: react-movies

## Configuration
- **Prevention Scope:** Markdown linting (markdownlint) + link checking (lychee)
- **CI Platform:** GitHub Actions
- **Language Stack:** JS/TS and Python
- **Constraints:** None

## Summary
- Docs scanned: 4 files (README.md, CLAUDE.md, CHANGELOG.md, assets/ASSETS_README.md)
- Code modules scanned: 25+
- Findings: 5 drift, 3 gaps, 2 stale, 0 broken links, 1 stale code example, 1 config drift, 2 structure issues

## Findings

### DRIFT (doc exists, doesn't match code)

1. **`README.md:42-44`** - Clone URL and path are wrong.
   - Doc says: `git clone https://github.com/HatmanStack/android-movies.git` then `cd android-movies/Migration/expo-project`
   - Reality: Repo is `https://github.com/HatmanStack/react-movies`, cloned to `react-movies/` root. There is no `Migration/expo-project` subdirectory.

2. **`README.md:42`** - Prerequisite claims `npm install -g expo-cli` is needed.
   - Doc says: Install `expo-cli` globally.
   - Reality: Modern Expo uses `npx expo` (no global install). The project's own `package.json` scripts use `expo start` via npx. `expo-cli` is a deprecated package.

3. **`README.md:21`** - Feature claim mismatch.
   - Doc says: "Browse popular movies and top-rated TV shows"
   - Reality: The app fetches popular movies via `/discover/movie` and top-rated content via `/discover/tv`. The filter store calls these "Popular" and "Top Rated" generically. The README conflates "top-rated" with "TV shows" specifically, but the app treats popular and top-rated as separate filter categories, each pulling from different endpoints (movies vs TV). This is partially accurate but misleading.

4. **`CLAUDE.md:23`** - Route claim incomplete.
   - Doc says: `/app/index.tsx` is the Home screen (movie grid with infinite scroll).
   - Reality: `/app/index.tsx` is indeed the active home screen, but `app/(tabs)/index.tsx`, `app/(tabs)/two.tsx`, `app/(tabs)/_layout.tsx`, `app/modal.tsx`, and `app/+not-found.tsx` also exist as dead scaffold code. CLAUDE.md doesn't mention these residual files.

5. **`app.json:13`** - `githubUrl` references old repo.
   - Doc says: `"githubUrl": "https://github.com/HatmanStack/android-movies"`
   - Reality: The actual repo is `https://github.com/HatmanStack/react-movies`.

### GAPS (code exists, no doc)

1. **`app/(tabs)/index.tsx`, `app/(tabs)/two.tsx`, `app/(tabs)/_layout.tsx`, `app/modal.tsx`, `app/+not-found.tsx`** - Undocumented residual Expo template routes. These are dead code (not registered in the root `_layout.tsx`), but no doc acknowledges their existence or flags them for removal.

2. **`src/api/errors.ts`, `src/api/types.ts`, `src/utils/errorHandler.ts`, `src/utils/mappers.ts`, `src/utils/retry.ts`, `src/database/init.ts`, `src/database/webStorage.ts`, `src/models/types.ts`, `src/constants/index.ts`** - CLAUDE.md describes the high-level modules but doesn't mention these supporting files. For a developer reference doc, the error handling layer, retry utility, and mapper utilities are notable omissions.

3. **`components/` (root-level)** - A root `components/` directory exists with `EditScreenInfo.tsx`, `Themed.tsx`, `useColorScheme.ts`, `useClientOnlyValue.ts`. None of the docs mention this directory. It contains Expo template boilerplate used only by the dead `(tabs)` routes.

### STALE (doc exists, code doesn't)

1. **`README.md:45-46`** - References `.env` file location as "in the `expo-project` root directory." There is no `expo-project` directory; the `.env` belongs at the repository root.

2. **`app.json:5`** - `"owner": "your-expo-username"` is a placeholder that was never replaced with an actual value.

### BROKEN LINKS

None found. The `LICENSE` file exists. The `public/og-image.jpg` referenced by README exists. All asset images referenced in `app.json` exist in `assets/images/`.

### STALE CODE EXAMPLES

1. **`README.md:43-44`** - Build instructions reference a nonexistent path.
   - Doc says: `cd android-movies/Migration/expo-project`
   - Reality: After cloning, the correct command is `cd react-movies`. There is no `Migration/expo-project` path.

### CONFIG DRIFT

1. **`README.md:42`** - States Node.js 18+ is the prerequisite.
   - CI (`.github/workflows/ci.yml`) uses Node.js 24.
   - The global `~/CLAUDE.md` references Node v24 LTS.
   - `package.json` does not specify an `engines` field, so there is no authoritative minimum version.

### STRUCTURE ISSUES

1. **Dead template code**: Files at `app/(tabs)/`, `app/modal.tsx`, `components/EditScreenInfo.tsx`, `components/Themed.tsx`, `components/useColorScheme.ts`, `components/useClientOnlyValue.ts`, and `constants/Colors.ts` are remnants of the default Expo template. They import from each other but are not used by the actual app. No documentation flags this as technical debt.

2. **Dual component directories**: Active components live in `src/components/` while dead template components live in root `components/`. This creates confusion. CLAUDE.md describes only `src/` structure, leaving the root `components/` and `constants/` directories unexplained.
