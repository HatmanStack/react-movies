# Roadmap

Remaining items from the 2026-03-25 audit that were not addressed during pipeline remediation. Organized by effort and impact.

## High Impact

### Extract `loadMovieDetails` from details component

`app/details/[id].tsx:85-202` contains a 120-line callback that mixes cache reads, API fetching, DB writes, and state updates. This logic belongs in `movieStore` or a dedicated service, keeping the component focused on rendering.

### Platform-specific database modules

`src/database/queries.ts` has 30+ `if (isWeb)` branches threading through the file. Extract into `queries.native.ts` and `queries.web.ts` using Metro's platform extension resolution. Each path becomes independently testable and readable.

### Raise test coverage to 80%

Coverage sits at ~51% against an 80% threshold configured in jest. Priority areas:

- `app/details/[id].tsx` (zero test coverage, most complex screen)
- `src/database/webStorage.ts` (batch operations, index management)
- `src/store/movieStore.ts` (sync flow, offline mode transitions)
- `src/api/tmdb.ts` (retry paths, error classification)

### Cache invalidation for web storage

`src/database/webStorage.ts` uses an indexed AsyncStorage pattern with no TTL or staleness checks. Cached movies persist indefinitely. Add a lightweight freshness mechanism so cached data refreshes periodically.

## Medium Impact

### Deduplicate SQL INSERT statements

`src/database/queries.ts` has the same INSERT statement duplicated between single-insert and batch-insert functions for movies (lines ~193 vs ~230), videos, and reviews. Extract the SQL string or builder into a shared constant so schema changes only need one update.

### Database migration framework

`src/database/init.ts` has a version check and one hardcoded migration (v1 to v2 for `vote_average REAL`). Future schema changes need a proper migration runner that iterates through version steps rather than adding more `if` branches.

### Typed SEO return value

`src/utils/seo.ts:60` (`generateMovieJsonLd`) returns `object`. Define a `MovieJsonLd` interface matching the JSON-LD schema to get compile-time safety on the structured data output.

### Verify unused dependency classification

The hygienist kept 8 production dependencies flagged by knip as "peer dependencies": `@react-navigation/native`, `expo-constants`, `expo-linking`, `react-dom`, `react-native-safe-area-context`, `react-native-screens`, `react-native-web`, `react-native-worklets`. Run the app with each removed individually to confirm they are actually required at runtime vs just listed as peers by other packages.

### Document supporting modules in CLAUDE.md

These files are not mentioned in CLAUDE.md's Architecture section: `src/api/errors.ts`, `src/api/types.ts`, `src/models/types.ts`, `src/utils/mappers.ts`, `src/utils/retry.ts`, `src/database/init.ts`, `src/database/webStorage.ts`.

## Low Impact

### Fix `Date.now() + Math.random()` identity generation

`src/database/webStorage.ts` uses this pattern for auto-increment IDs on web, producing non-integer floats where the SQLite schema expects INTEGER. Replace with `Math.floor(Date.now() * 1000 + Math.random() * 1000)` or a counter-based approach.

### Resolve npm audit vulnerabilities

10 vulnerabilities (5 low, 3 moderate, 2 high) in transitive dev dependencies (picomatch, yaml, glob). All in tooling, none in runtime code. Monitor for upstream fixes in jest and expo.

### Clean up `.gitignore` inconsistency

`expo-env.d.ts` is listed in `.gitignore` but already tracked in git. Either remove the gitignore entry or untrack the file.

### Reanimated `as object` escape hatch

`app/details/[id].tsx:319` and `src/components/MovieCard.tsx:66` use `as object` to work around Reanimated's shared transition typing. Revisit when `react-native-reanimated` ships updated type definitions.

## Out of Scope (Process)

### Git history

The early commit history (single `Init` commit with 60+ files, `final touches`, `icon`) cannot be retroactively improved. Commitlint is now enforced going forward. Git Hygiene was scored 4/10; the score reflects historical commits that are permanent.
