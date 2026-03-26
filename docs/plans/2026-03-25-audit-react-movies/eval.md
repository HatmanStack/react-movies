---
type: repo-eval
target: 9
role_level: senior
date: 2026-03-25
pillar_overrides: {}
---

# Repo Evaluation: react-movies

## Configuration

- **Role Level:** Senior Developer
- **Focus Areas:** Balanced evaluation across all pillars
- **Exclusions:** Standard (vendor, generated, node_modules, **pycache**)

## Combined Scorecard

| #   | Lens   | Pillar               | Score | Target | Status     |
| --- | ------ | -------------------- | ----- | ------ | ---------- |
| 1   | Hire   | Problem-Solution Fit | 7/10  | 9      | NEEDS WORK |
| 2   | Hire   | Architecture         | 8/10  | 9      | NEEDS WORK |
| 3   | Hire   | Code Quality         | 8/10  | 9      | NEEDS WORK |
| 4   | Hire   | Creativity           | 7/10  | 9      | NEEDS WORK |
| 5   | Stress | Pragmatism           | 8/10  | 9      | NEEDS WORK |
| 6   | Stress | Defensiveness        | 7/10  | 9      | NEEDS WORK |
| 7   | Stress | Performance          | 7/10  | 9      | NEEDS WORK |
| 8   | Stress | Type Rigor           | 8/10  | 9      | NEEDS WORK |
| 9   | Day 2  | Test Value           | 7/10  | 9      | NEEDS WORK |
| 10  | Day 2  | Reproducibility      | 7/10  | 9      | NEEDS WORK |
| 11  | Day 2  | Git Hygiene          | 4/10  | 9      | NEEDS WORK |
| 12  | Day 2  | Onboarding           | 6/10  | 9      | NEEDS WORK |

**Pillars at target:** 0/12
**Pillars needing work:** 12/12

---

## Hire Evaluation -- The Pragmatist

### VERDICT

- **Decision:** HIRE
- **Overall Grade:** B+
- **One-Line:** Well-structured cross-platform movie browser with thoughtful defensive coding, slightly over-documented for its scope.

### SCORECARD

| Pillar               | Score | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Problem-Solution Fit | 7/10  | `package.json:16-41` -- Expo + SQLite + AsyncStorage + Zustand + Zod + Reanimated for a movie browser is justifiable but leans heavy. The dual-storage pattern (`src/database/queries.ts:37` platform branching, `src/database/webStorage.ts` full AsyncStorage reimplementation) adds ~400 lines for web compat. Zod validation on all API responses (`src/api/tmdb.ts:121-122`) is production-grade but the validate-then-cast pattern (parse, discard result, cast `as`) wastes the validation.                                                                                         |
| Architecture         | 8/10  | `src/store/movieStore.ts:34-60` -- Clean Zustand interface, proper separation between API (`src/api/`), database (`src/database/`), store (`src/store/`), and presentation (`app/`, `src/components/`). Mapper layer (`src/utils/mappers.ts`) cleanly decouples API shapes from domain models. Constants centralized (`src/constants/index.ts`). Could survive 10x features. Concern: `app/details/[id].tsx:85-202` has a 120-line `loadMovieDetails` callback mixing cache reads, API calls, DB writes, and state updates -- this should be in the store or a service, not the component. |
| Code Quality         | 8/10  | `src/utils/retry.ts:65-80` -- Exponential backoff with jitter, abort support, configurable retry predicate. `src/utils/errorHandler.ts:202-252` -- Error formatting by type with severity/retryable classification. Zero `any` types in src/. Zero TODO/FIXME. Console usage gated behind `__DEV__` (`errorHandler.ts:109`). One concern: `MovieCard.tsx:42` hardcodes `https://image.tmdb.org/t/p/w342` instead of using `TMDbService.getPosterUrl()`.                                                                                                                                    |
| Creativity           | 7/10  | `src/database/webStorage.ts:1-27` -- Indexed storage architecture with per-entity keys and category index sets is a smart solution for AsyncStorage's limitations. `app/index.tsx:57-78` -- AbortController cleanup on mount/unmount prevents stale requests. `src/store/movieStore.ts:429-431` -- Preserving favorites during API refresh is a thoughtful UX detail. The `sleep` function in `retry.ts:85-99` properly cleans up timers on abort. No clever-bad code found.                                                                                                               |

### HIGHLIGHTS

- **Brilliance:**
  - `src/utils/retry.ts:65-99` -- The retry utility with exponential backoff, jitter (preventing thundering herd), and abort-aware sleep is textbook production quality. The `createRetryable` higher-order function at line 184 is a clean API.
  - `src/database/webStorage.ts:57-157` -- The indexed storage pattern turns O(n) full-scan reads into O(1) lookups by maintaining parallel index sets. Batch writes at lines 118-157 collect all entries and flush together.
  - `src/utils/errorHandler.ts:50-78` -- Error tracker interface is Sentry-compatible and pluggable. Production logging defers to the tracker while dev uses console. Clean separation.
  - `app/index.tsx:37-47` -- Individual Zustand selectors instead of destructuring the whole store. This prevents unnecessary re-renders.

- **Concerns:**
  - `.env:1` -- API key committed to working tree. Even though `.gitignore` lists `.env`, if this was ever committed to git history, the key is exposed.
  - `src/api/tmdb.ts:121-122` -- Zod `parse()` is called but its return value is discarded; the original `data` is cast with `as`. This means validation runs but the cleaned/coerced output is thrown away.
  - `app/details/[id].tsx:85-202` -- The `loadMovieDetails` callback is a 120-line function inside a component. It handles caching strategy, API fetching, DB writes, and error handling. This logic belongs in the store or a service layer.
  - `src/components/MovieCard.tsx:42` -- Hardcoded TMDb image URL bypasses `TMDbService.getPosterUrl()`.

### REMEDIATION TARGETS

- **Problem-Solution Fit (current: 7/10, target: 9/10)**
  - Fix the Zod validate-then-cast anti-pattern in `src/api/tmdb.ts` lines 121-122, 146-147, 167-168, 190-191. Use the parsed result directly.
  - Evaluate whether the `components/` directory at project root is dead code from the Expo template. If unused, remove it.
  - Estimated complexity: LOW

- **Architecture (current: 8/10, target: 9/10)**
  - Extract `loadMovieDetails` from `app/details/[id].tsx` into the movie store or a dedicated service.
  - Clean up `app/(tabs)/` directory containing unused Expo template files.
  - Estimated complexity: MEDIUM

- **Code Quality (current: 8/10, target: 9/10)**
  - Replace the hardcoded TMDb URL in `MovieCard.tsx:42` with `TMDbService.getPosterUrl()`.
  - Remove or rotate the committed API key in `.env`.
  - Replace raw `console.log/error` calls in `src/database/init.ts` with centralized logging.
  - Estimated complexity: LOW

- **Creativity (current: 7/10, target: 9/10)**
  - The `webStorage.ts` indexed pattern lacks cache invalidation or TTL.
  - The `ErrorBoundary` component exists but is not wired into the app's `_layout.tsx`.
  - Estimated complexity: MEDIUM

---

## Stress Evaluation -- The Oncall Engineer

### VERDICT

- **Decision:** SENIOR HIRE
- **Seniority Alignment:** Yes. The technical depth, architecture choices, and defensive patterns are consistent with a senior developer who has operated production systems.
- **One-Line:** Solid production instincts across the board; a handful of resource leaks and missing atomicity guards would give me a restless night, but overall this developer writes code that survives contact with reality.

### SCORECARD

| Pillar        | Score | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pragmatism    | 8/10  | `src/constants/index.ts:1-144` -- all magic values extracted into typed constants with `as const`. `src/utils/retry.ts:117-166` -- retry with jitter is exactly the right level of infrastructure for this use case. `src/database/webStorage.ts:1-426` -- the indexed storage layer is well-motivated but the dual-platform branching throughout `queries.ts` adds real maintenance cost.                                                                                                                                        |
| Defensiveness | 7/10  | `src/api/tmdb.ts:44-97` -- pre-flight abort checks, typed error classification, structured retry callbacks. `src/store/movieStore.ts:127-136` -- every catch block logs with context and formats for users. `src/utils/retry.ts:85-99` -- sleep abort listener is **never cleaned up** on resolve, leaking event listeners on long-running retry chains. `src/database/webStorage.ts:36` -- swallowed `catch {}` in `safeJsonParse` silently eats corrupt data with no logging.                                                   |
| Performance   | 7/10  | `app/index.tsx:206-209` -- FlatList tuned with `removeClippedSubviews`, `maxToRenderPerBatch`, `windowSize`. `src/database/queries.ts:228-250` -- batch inserts use transactions. `src/database/webStorage.ts:148-156` -- batch web writes fire N+4 parallel `AsyncStorage.setItem` calls instead of using `multiSet`, which is O(N) round-trips on some platforms. `src/utils/mappers.ts:114-118` -- thumbnail fetching for videos uses unbounded `Promise.all`, no concurrency limit.                                           |
| Type Rigor    | 8/10  | `tsconfig.json` -- `strict: true`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters` all enabled. `src/validation/schemas.ts:15-28` -- Zod schemas enforce domain constraints (positive int IDs, vote_average 0-10). `src/api/tmdb.ts:69` -- raw `as T` cast after fetch, though mitigated by subsequent Zod parse at line 121. `app/details/[id].tsx:319` and `src/components/MovieCard.tsx:66` -- `as object` escape hatch for Reanimated shared transitions, unavoidable given the library's typing. |

### CRITICAL FAILURE POINTS

1. **Event listener leak in retry sleep** -- `src/utils/retry.ts:94-97`. The abort event listener added inside `sleep()` is never removed when the timeout resolves normally. Over many retries or long-lived AbortControllers, this accumulates listeners.

2. **Non-atomic index updates in web storage** -- `src/database/webStorage.ts:107-112`. Four index writes happen via `Promise.all` on individual `setItem` calls. If the app crashes or tab closes between writes, indexes can become inconsistent.

3. **Unbounded parallel thumbnail fetches** -- `src/utils/mappers.ts:115-118`. `Promise.all(thumbnailPromises)` with no concurrency limit means a movie with 20 videos fires 20 simultaneous YouTube API requests.

4. **Toggle favorite is not truly optimistic** -- `src/store/movieStore.ts:257-284`. The "optimistic update" writes to the database first (line 268), then updates the UI (line 278). A true optimistic pattern would update UI first, then persist, then rollback on error.

### HIGHLIGHTS

- **Brilliance:**
  - `src/utils/errorHandler.ts:107-143` -- Dual-mode logging (dev console + production error tracker) with breadcrumb support is production-ready.
  - `src/api/youtube.ts:30-102` -- Graceful degradation at every level: invalid key, missing key, API failure all fall back to default thumbnail. This function will never crash.
  - `src/utils/retry.ts:65-80` -- Exponential backoff with jitter to prevent thundering herd.
  - `app/index.tsx:56-78` and `app/details/[id].tsx:214-226` -- Consistent AbortController usage with cleanup.
  - `src/validation/schemas.ts` -- Zod schemas validate all external API boundaries.

- **Concerns:**
  - `src/database/webStorage.ts:256` -- `Date.now() + Math.random()` for ID generation is not guaranteed unique.
  - `src/store/movieStore.ts:492-496` -- NetInfo subscription at module scope runs on import and never unsubscribes.
  - `src/database/init.ts:60-63` -- Database version is tracked but there is no migration logic.
  - `src/api/tmdb.ts:24` -- API key read from `process.env` at module load time with no startup validation.

### REMEDIATION TARGETS

- **Pragmatism (current: 8/10, target: 9/10)**
  - Extract platform-branching in `src/database/queries.ts` into platform-specific modules loaded via Metro's platform extensions (`.web.ts` / `.native.ts`).
  - Estimated complexity: MEDIUM

- **Defensiveness (current: 7/10, target: 9/10)**
  - Fix abort listener leak in `src/utils/retry.ts:85-99`.
  - Add logging to `src/database/webStorage.ts:36` (`safeJsonParse`).
  - Build database migration logic in `src/database/init.ts`.
  - Make `toggleFavorite` in `movieStore.ts` truly optimistic.
  - Estimated complexity: LOW-MEDIUM

- **Performance (current: 7/10, target: 9/10)**
  - Replace individual `AsyncStorage.setItem` calls with `multiSet` in `src/database/webStorage.ts`.
  - Add concurrency limiter to `src/utils/mappers.ts:115` for thumbnail fetching.
  - Estimated complexity: LOW

- **Type Rigor (current: 8/10, target: 9/10)**
  - Eliminate `as T` cast in `src/api/tmdb.ts:69` by using Zod parse return values directly.
  - Define a `MovieJsonLd` interface for `src/utils/seo.ts:60` return type instead of `object`.
  - Estimated complexity: LOW

---

## Day 2 Evaluation -- The Team Lead

### VERDICT

- **Decision:** COLLABORATOR
- **Collaboration Score:** Med-High
- **One-Line:** Solid test foundation and CI, but the git history reveals a code-gen origin with thin onboarding paths.

### SCORECARD

| Pillar          | Score | Evidence                                                                                                                                                                                                                                                                                                                |
| --------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test Value      | 7/10  | `__tests__/store/movieStore.test.ts` tests real behavior (optimistic updates, rollback on DB error, dedup logic); `__tests__/database/queries.test.ts` includes SQL injection prevention. Two placeholder tests drag it down: `MovieCard.test.tsx:139` and `VideoCard.test.tsx:113` both use `expect(true).toBe(true)`. |
| Reproducibility | 7/10  | `package-lock.json` committed, CI in `.github/workflows/ci.yml` runs lint->type-check->test in correct order with `npm ci`. No `.env.example`, no Dockerfile, no devcontainer, no pre-commit hooks.                                                                                                                     |
| Git Hygiene     | 4/10  | Early history is opaque: `Init` commit adds 60+ files including all tests, followed by `final touches`, `icon`, `link`, `Deployed`. One mega-commit `0f19539` touches the entire architecture. Recent commits use conventional prefixes (`fix:`) which is an improvement.                                               |
| Onboarding      | 6/10  | `CLAUDE.md` is excellent for AI-assisted development with all commands documented. `README.md` has outdated clone path (`android-movies/Migration/expo-project` vs actual repo structure). No `.env.example` file, no CONTRIBUTING guide.                                                                               |

### RED FLAGS

- **Placeholder tests.** `__tests__/components/MovieCard.test.tsx:127-141` "memoization prevents unnecessary re-renders" test asserts `expect(true).toBe(true)`. Same pattern in `VideoCard.test.tsx:113`. These are checkbox tests that document nothing and give false coverage confidence.
- **No `.env.example`.** The `.env` file is gitignored (correctly), but there is no `.env.example` or `.env.template`.
- **Monolithic initial commit.** Commit `6537922` ("Init") adds every source file, test, and config in a single commit.
- **Integration tests test state, not rendering.** `__tests__/integration/movieFlow.test.tsx:126-144` has two "integration" tests that never render a component. They just call `useMovieStore.setState()` and read it back.

### HIGHLIGHTS

- **Process Win:** The database test suite (`__tests__/database/queries.test.ts`) is genuinely valuable with in-memory SQLite, CRUD operations, edge cases, and SQL injection prevention.
- **Process Win:** `jest.setup.js` provides a thorough in-memory mock of expo-sqlite that simulates real table behavior.
- **Process Win:** CI pipeline is clean and correct: checkout -> install -> lint -> type-check -> test -> coverage upload. Dependabot configured.
- **Maintenance Drag:** The `jest.setup.js` mock database (150 lines) will need updating every time the schema changes with no comment indicating this coupling.

### REMEDIATION TARGETS

- **Test Value (current: 7/10, target: 9/10)**
  - Replace `expect(true).toBe(true)` in `MovieCard.test.tsx:139` and `VideoCard.test.tsx:113` with actual assertions.
  - Recategorize or rewrite `__tests__/integration/movieFlow.test.tsx` tests.
  - Add screen-level integration tests that render full screens.
  - Estimated complexity: LOW

- **Reproducibility (current: 7/10, target: 9/10)**
  - ~~Add `.env.example` with placeholder values.~~ (Done: Phase 5)
  - ~~Add pre-commit hook via husky or lint-staged.~~ (Done: Phase 4, husky + lint-staged in package.json)
  - Consider `.devcontainer/devcontainer.json`.
  - Estimated complexity: LOW

- **Git Hygiene (current: 4/10, target: 9/10)**
  - Largely historical and hard to remediate retroactively. Going forward, enforce conventional commits consistently.
  - Avoid mega-commits. Use feature branches and squash merges.
  - Estimated complexity: MEDIUM (process discipline, not code changes)

- **Onboarding (current: 6/10, target: 9/10)**
  - Fix the README clone path referencing `android-movies/Migration/expo-project`.
  - Add `.env.example` file.
  - Add a "Development" section to README with prerequisites, test/lint/build instructions.
  - Estimated complexity: LOW

---

## Consolidated Remediation Targets

Merged and deduplicated across all 3 evaluators, prioritized by lowest score first:

### Priority 1: Git Hygiene (4/10)

- Enforce conventional commits going forward
- Use feature branches and squash merges
- **Complexity:** MEDIUM (process change)

### Priority 2: Onboarding (6/10)

- Fix README clone path and outdated references
- Add `.env.example`
- Add Development section to README with human-oriented setup instructions
- **Complexity:** LOW

### Priority 3: Defensiveness + Performance + Test Value + Creativity (7/10 each)

- Fix abort listener leak in `src/utils/retry.ts:85-99`
- Add logging to `safeJsonParse` in `src/database/webStorage.ts:36`
- Build database migration logic in `src/database/init.ts`
- Make `toggleFavorite` truly optimistic in `movieStore.ts`
- Replace `AsyncStorage.setItem` with `multiSet` in `webStorage.ts`
- Add concurrency limiter to thumbnail fetching in `mappers.ts:115`
- Replace placeholder tests (`expect(true).toBe(true)`) with real assertions
- Recategorize integration tests that don't render components
- Add cache invalidation/TTL to `webStorage.ts`
- Wire `ErrorBoundary` component into the app layout
- **Complexity:** LOW-MEDIUM

### Priority 4: Problem-Solution Fit + Architecture + Code Quality + Pragmatism + Type Rigor + Reproducibility (7-8/10)

- Fix Zod validate-then-cast anti-pattern in `tmdb.ts`
- Delete dead scaffold code (12+ files in `app/(tabs)/`, `components/`, `constants/`)
- Extract `loadMovieDetails` from details component into store/service
- Replace hardcoded poster URL in `MovieCard.tsx:42`
- Replace raw `console.log` in `init.ts` with centralized logging
- Eliminate `as T` cast in `tmdb.ts:69`
- Define proper return types (e.g., `MovieJsonLd` in `seo.ts`)
- Add `.env.example` and pre-commit hooks
- Extract platform-branching into Metro platform extensions
- **Complexity:** LOW-MEDIUM
