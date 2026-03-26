---
type: repo-health
date: 2026-03-25
goal: general-health-check
---

# Codebase Health Audit: react-movies

## Configuration

- **Goal:** General health check, scan all 4 vectors equally
- **Deployment Target:** Serverless (Lambda, Cloud Functions)
- **Scope:** Full repo, no constraints
- **Existing Tooling:** Full setup (linters, CI pipeline, pre-commit hooks, type checking)
- **Constraints:** None

## Summary

- Overall health: **FAIR**
- Biggest structural risk: Entire `app/(tabs)/` directory, `app/modal.tsx`, `app/+not-found.tsx`, and `components/` directory are dead scaffold code with broken imports, creating confusion about the app's actual routing structure
- Biggest operational risk: The `sleep` function in `src/utils/retry.ts:85-98` leaks an event listener on every abort, and the retry mechanism uses real `setTimeout` delays (up to 10s) that could exhaust serverless execution budgets
- Total findings: 2 critical, 6 high, 8 medium, 6 low

## Tech Debt Ledger

### CRITICAL

1. **[Architectural Debt]** `app/(tabs)/_layout.tsx:1-61`, `app/(tabs)/index.tsx:1-32`, `app/(tabs)/two.tsx:1-32`, `app/modal.tsx:1-36`, `app/+not-found.tsx:1-41`, `components/EditScreenInfo.tsx`, `components/Themed.tsx`, `components/ExternalLink.tsx`, `components/useClientOnlyValue.ts`, `components/useClientOnlyValue.web.ts`, `components/useColorScheme.web.ts`, `constants/Colors.ts`
   - **The Debt:** Entire `app/(tabs)/` directory and `components/` directory are leftover Expo template scaffold code. These files import non-existent modules (`@/components/Themed`, `@/components/EditScreenInfo`, `@/constants/Colors`) via 12 unresolved imports (confirmed by knip). The actual app routes are `app/index.tsx` and `app/details/[id].tsx`. The `app/_layout.tsx` root layout registers `(tabs)` routes that collide with the actual app structure.
   - **The Risk:** The `app/(tabs)/` routes are resolvable by expo-router, meaning users could navigate to broken tab screens. Any expo-router upgrade or build analysis will flag unresolved imports. New contributors will be confused about which routing structure is canonical.

2. **[Operational Debt]** `src/utils/retry.ts:85-98` (sleep function) -- **RESOLVED in Phase 2**
   - **The Debt:** The `sleep` function added an `abort` event listener but never removed it on normal resolution. Fixed: the listener is now cleaned up in the resolve path.
   - **The Risk:** (Mitigated) Listener leak no longer occurs.

### HIGH

1. **[Architectural Debt]** `src/api/tmdb.ts:69`, `src/api/tmdb.ts:112-122`, `src/api/tmdb.ts:137-147`, `src/api/tmdb.ts:162-168`, `src/api/tmdb.ts:185-191`
   - **The Debt:** The generic `get<T>` method on line 69 casts `response.json()` result with `as T`. Then each public method fetches as `unknown`, runs `schema.parse(data)` (which validates and returns a typed result), but discards the parse return value and casts the original `data as TMDbDiscoverResponse` instead. The Zod parse on line 121 throws on invalid data but its typed return value is thrown away.
   - **The Risk:** If Zod strips/transforms any fields (e.g., defaults, coercion), the app uses the unvalidated original object. The validation serves as a runtime check only, not as a data sanitizer. This defeats half the purpose of Zod validation.

2. **[Architectural Debt]** `src/api/youtube.ts:63`
   - **The Debt:** The YouTube API response on line 63 is cast with `as YouTubeVideoResponse` after `response.json()` without any Zod validation, despite `YouTubeVideoResponseSchema` existing in `src/validation/schemas.ts:200`. The TMDb service validates responses; the YouTube service does not.
   - **The Risk:** Malformed YouTube API responses will cause runtime errors (e.g., `data.items[0].snippet.thumbnails` on line 67) instead of graceful validation failures.

3. **[Code Hygiene Debt]** `package.json:20-39`
   - **The Debt:** knip reports 9 unused production dependencies (`@react-navigation/native`, `expo-constants`, `expo-linking`, `expo-web-browser`, `react-dom`, `react-native-safe-area-context`, `react-native-screens`, `react-native-web`, `react-native-worklets`) and 9 unused dev dependencies. 44 exported functions/types are never consumed.
   - **The Risk:** Bloated bundle size. For serverless/web deployment, unused deps increase cold start time and download size. Maintaining phantom dependencies creates false security surface area (npm audit flagged 10 vulnerabilities, some may be in unused deps).

4. **[Structural Debt]** `src/store/movieStore.ts:317-391` and `src/store/movieStore.ts:397-480`
   - **The Debt:** `syncMoviesWithAPI` (lines 317-391) and `refreshMovies` (lines 397-480) are near-identical. Both check offline/syncing state, set the same loading flags, call the same two API endpoints in parallel, map results, batch insert, then reload from filters. The only difference is `refreshMovies` preserves favorites.
   - **The Risk:** Bug fixes or API changes must be applied in two places. The store file is already 496 lines, the largest non-test source file.

5. **[Operational Debt]** `src/database/webStorage.ts:64-113` (webInsertMovie)
   - **The Debt:** A single movie insert triggers 4 index reads (lines 75-80), mutates the sets, then writes the movie plus 4 indexes back (lines 107-112). That is 5 reads + 5 writes = 10 AsyncStorage operations per single movie insert. The batch `webInsertMovies` on lines 118-157 issues N individual `setItem` calls in parallel instead of using `AsyncStorage.multiSet`.
   - **The Risk:** On web platform, inserting 40 movies (typical page of popular + top-rated) triggers 44+ parallel `setItem` calls. This creates heavy I/O contention and risks data corruption if the page is closed mid-write, since the index and movie writes are not atomic.

6. **[Operational Debt]** `app/index.tsx:56-100`
   - **The Debt:** Three separate effects trigger `loadMoviesFromFilters`: initial mount (line 56), filter change (line 81), and screen focus (line 91). On initial render, all three fire simultaneously, causing 3 concurrent database reads. The mount effect also conditionally calls `syncMoviesWithAPI`, which internally calls `loadMoviesFromFilters` again (line 378).
   - **The Risk:** On first load, the database is queried 3-4 times concurrently for the same data. In a serverless/SSR context, this unnecessary concurrency wastes compute time and can cause race conditions with store state.

### MEDIUM

1. **[Structural Debt]** `src/database/queries.ts:185-211` and `src/database/queries.ts:218-251`
   - **The Debt:** The SQL INSERT statement for movies is duplicated verbatim between `insertMovie` (line 193-209) and the loop inside `insertMovies` (lines 230-248). The same pattern repeats for videos (lines 375-389 vs 410-424) and reviews (lines 482-487 vs 508-512).
   - **The Risk:** Schema changes require updating 2 copies of each INSERT statement.

2. **[Operational Debt]** `src/store/movieStore.ts:492-496`
   - **The Debt:** `NetInfo.addEventListener` is called at module scope, creating a global subscription that persists for the app lifetime with no unsubscribe mechanism.
   - **The Risk:** In a testing or SSR environment, this side effect runs on import, potentially causing errors or resource leaks.

3. **[Architectural Debt]** `src/components/MovieCard.tsx:42`
   - **The Debt:** Poster URL is constructed inline as a hardcoded string template `https://image.tmdb.org/t/p/w342${poster_path}` instead of using `TMDbService.getPosterUrl()` which is the dedicated method for this purpose (used correctly in `app/details/[id].tsx:290`).
   - **The Risk:** If the image CDN URL or size logic changes, this component will not pick up the update. Inconsistency with the details screen.

4. **[Architectural Debt]** `app/_layout.tsx:23-27`
   - **The Debt:** Theme colors are hardcoded (`primary: '#1976D2'`, `secondary: '#FF5722'`, `tertiary: '#FFC107'`) while `src/constants/index.ts:134-143` defines a `COLORS` constant with overlapping but different values (e.g., `SECONDARY` is `'#FFC107'` in constants but `'#FF5722'` in theme). Two sources of truth for the color palette.
   - **The Risk:** Visual inconsistencies between Material Design components (using theme) and custom components (using COLORS constant).

5. **[Structural Debt]** `src/database/schema.ts:24`
   - **The Debt:** `vote_average` column is declared as `INTEGER` but the domain model (`MovieDetails.vote_average`) and API response use it as a floating-point number (e.g., 7.8). SQLite will truncate decimal values on insert.
   - **The Risk:** Movie ratings stored in the database lose precision. A movie with 7.8 rating gets stored as 7 and displayed as "7.0" after cache retrieval.

6. **[Code Hygiene Debt]** `src/database/init.ts:42-147`
   - **The Debt:** Uses raw `console.log`/`console.error` calls (6 occurrences) instead of the centralized `logInfo`/`logError` functions from `src/utils/errorHandler.ts`.
   - **The Risk:** Database initialization logs bypass the structured logging pipeline and error tracking service. In production, these messages go nowhere useful.

7. **[Operational Debt]** `src/api/tmdb.ts:24`, `src/api/youtube.ts:15`
   - **The Debt:** API keys are read from `process.env` at module scope. If environment variables are not set, the value is `undefined` and the check happens at request time (tmdb.ts:52). No startup validation.
   - **The Risk:** The app loads and renders normally, only failing when the user triggers an API call. For serverless, this means cold starts succeed but every request fails, making it hard to detect misconfiguration in deployment.

8. **[Code Hygiene Debt]** `src/validation/schemas.ts:220-314`
   - **The Debt:** 14 validation utility functions (`validateSafe`, `validate`, `validateWithFallback`, `validateArray`, `validateTMDbDiscoverResponse`, `validateTMDbVideosResponse`, `validateTMDbReviewsResponse`, `validateMovieDetails`, `validateMovieDetailsArray`, `validateVideoDetailsArray`, `validateReviewDetailsArray`) are exported but never imported anywhere in the codebase (confirmed by knip). The TMDb service calls `schema.parse()` directly.
   - **The Risk:** Dead code that inflates the module. Suggests an incomplete migration where validation was centralized but never wired up.

### LOW

1. **[Code Hygiene Debt]** `app/details/[id].tsx:319`
   - **The Debt:** `{...({ sharedTransitionTag: `movie-poster-${movieId}` } as object)}` is a type escape hatch using `as object` to silence TypeScript. Same pattern in `src/components/MovieCard.tsx:66`.
   - **The Risk:** If the Reanimated API changes the shared transition interface, TypeScript will not catch the breakage.

2. **[Code Hygiene Debt]** `src/database/webStorage.ts:256`, `src/database/webStorage.ts:286`, `src/database/webStorage.ts:331`, `src/database/webStorage.ts:361`
   - **The Debt:** Identity generation uses `Date.now() + Math.random()` which produces non-integer floating-point values, while the `identity` field in the domain model and SQLite schema is `INTEGER`.
   - **The Risk:** Type mismatch between web and native storage. Could cause subtle comparison bugs if identity values are compared with `===`.

3. **[Operational Debt]** `npm audit`
   - **The Debt:** 10 known vulnerabilities: 5 low, 3 moderate, 2 high. Includes `picomatch` ReDoS across 16 nested copies and `yaml` stack overflow via deeply nested collections.
   - **The Risk:** The vulnerabilities are in transitive dependencies (jest, expo tooling), not in runtime code. Low exploitability but flags in security scans.

4. **[Code Hygiene Debt]** `package.json:2`
   - **The Debt:** Package name is `"expo-project"`, the default Expo template name.
   - **The Risk:** Generic name causes confusion in logs, package registries, and error tracking.

5. **[Structural Debt]** `src/utils/errorHandler.ts:289-314` and `src/utils/retry.ts:194-198`
   - **The Debt:** `isRateLimitError` and `isNetworkError` are duplicated across both files with slightly different implementations.
   - **The Risk:** Behavioral inconsistency. Callers may import the wrong version.

6. **[Code Hygiene Debt]** `.gitignore:10`
   - **The Debt:** `.gitignore` lists `dist/` but also lists `expo-env.d.ts` (line 5). The `expo-env.d.ts` file is actually tracked in git. Meanwhile, the `dist/` directory exists on disk with build artifacts (HTML, JS bundles) but is not tracked, which is correct.
   - **The Risk:** Minor; the `.gitignore` entry for `expo-env.d.ts` was auto-generated by expo-cli but the file was committed before the ignore rule was added.

## Quick Wins

1. `app/(tabs)/` directory, `app/modal.tsx`, `app/+not-found.tsx`, `components/EditScreenInfo.tsx`, `components/Themed.tsx`, `components/ExternalLink.tsx`, `components/useClientOnlyValue.ts`, `components/useClientOnlyValue.web.ts`, `components/useColorScheme.web.ts`, `constants/Colors.ts` -- Delete 12 dead scaffold files (estimated effort: < 30 minutes)
2. `src/api/tmdb.ts:121-122` (and lines 146-147, 167-168, 190-191) -- Use the Zod `.parse()` return value instead of casting original data (estimated effort: < 30 minutes)
3. `src/components/MovieCard.tsx:42` -- Replace hardcoded poster URL with `TMDbService.getPosterUrl()` (estimated effort: < 15 minutes)
4. `src/database/schema.ts:24` -- Change `vote_average INTEGER` to `vote_average REAL` (estimated effort: < 15 minutes, requires DB version bump)
5. `src/database/init.ts:42-147` -- Replace `console.log`/`console.error` with `logInfo`/`logError` (estimated effort: < 15 minutes)
6. `package.json:2` -- Rename from `"expo-project"` to the actual app name (estimated effort: < 5 minutes)

## Automated Scan Results

**Dead code (knip):**

- 8 unused files (scaffold code + `ErrorBoundary.tsx` + `metro.config.js`)
- 9 unused production dependencies, 9 unused dev dependencies
- 12 unresolved imports (all in dead scaffold files)
- 44 unused exported functions/values, 22 unused exported types
- 2 unlisted dependencies (`expo-updates`, `expo-system-ui` referenced in `app.json`)
- 5 unlisted binaries

**Vulnerability scan (npm audit):**

- 10 vulnerabilities (5 low, 3 moderate, 2 high)
- All in transitive dev/tooling dependencies (picomatch, yaml, glob)
- No runtime production vulnerabilities detected

**Secrets scan:**

- `.env` file exists and is gitignored (correct)
- API keys read via `process.env.EXPO_PUBLIC_*` pattern (Expo convention, exposed client-side by design)
- No hardcoded secrets found in source
