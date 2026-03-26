# Feedback: 2026-03-25-audit-react-movies

## Active Feedback

(none)

## Resolved Feedback

### [CODE_REVIEW] Phase 2: type-check fails due to AsyncStorage.multiSet type error
- **Status:** RESOLVED
- **Phase:** Phase-2, Task 6
- **Commit:** 2f309bc
- **Detail:** `npm run type-check` produces two errors in `src/database/webStorage.ts` (lines 106 and 156): `Property 'multiSet' does not exist on type 'AsyncStorage'`. The Phase 2 spec requires `npm run type-check` to pass. The `multiSet` method exists at runtime on the default export of `@react-native-async-storage/async-storage`, but the TypeScript types for the version installed do not expose it on the type used here. Was the type signature of AsyncStorage's default export checked before using `multiSet`? Does the installed version's type declaration export `multiSet` as a standalone function rather than a method on the default export?
- **Resolution:** The installed AsyncStorage version's type declarations use `setMany(entries: Record<string, string>)` instead of `multiSet(pairs: [string, string][])`. Replaced all `multiSet` calls with `setMany` using Record objects. Added `setMany` and `getMany` mocks to jest.setup.js.

### [CODE_REVIEW] Phase 2: Video/review batch functions not updated to use multiSet
- **Status:** RESOLVED
- **Phase:** Phase-2, Task 6
- **Commit:** 2f309bc
- **Detail:** The spec for Task 6 says to "apply the same pattern to any other batch write functions (check for similar patterns in video and review batch inserts)." `webInsertVideos` (line 297) and `webInsertReviews` (line 372) still use individual `AsyncStorage.setItem` calls. While these write to a single key per call (all videos for one movie), the spec explicitly calls out checking these functions. Was this intentional or an oversight?
- **Resolution:** Updated `webInsertVideos` and `webInsertReviews` to use `AsyncStorage.setMany` instead of individual `setItem` calls, consistent with the batch write pattern.

### [CODE_REVIEW] Phase 2: Task 7 not implemented (raw console calls in init.ts)
- **Status:** RESOLVED
- **Phase:** Phase-2, Task 7
- **Commit:** 0d4a402
- **Detail:** `src/database/init.ts` still contains 7 raw `console.log`/`console.error` calls (lines 42, 74, 77, 79, 103, 127, 158). The spec requires replacing all of them with `logInfo`/`logError` from `src/utils/errorHandler.ts`. No commit exists for this task. Was Task 7 skipped or forgotten?
- **Resolution:** Replaced all 7 raw console.log/console.error calls with logInfo/logError from errorHandler.ts using 'DatabaseInit' as the context string. No raw console calls remain in init.ts.

### [CODE_REVIEW] Phase 2: Task 8 not implemented (theme color unification)
- **Status:** RESOLVED
- **Phase:** Phase-2, Task 8
- **Commit:** 8de099c
- **Detail:** `app/_layout.tsx` (lines 23-26) still hardcodes hex color values (`'#1976D2'`, `'#FF5722'`, `'#FFC107'`) in the theme definition instead of importing from the `COLORS` constant in `src/constants/index.ts`. The spec requires eliminating hardcoded hex values and using `COLORS` as the single source of truth. No commit exists for this task. Note also that the theme's `secondary` value (`#FF5722`) differs from `COLORS.SECONDARY` (`#FFC107`), so unifying will require deciding which value is correct and potentially adding missing entries (e.g., `ACCENT` or similar) to the COLORS constant.
- **Resolution:** Added `ACCENT: '#FF5722'` to the COLORS constant for the orange-red theme secondary. Updated _layout.tsx to use `COLORS.PRIMARY`, `COLORS.ACCENT`, and `COLORS.SECONDARY` instead of hardcoded hex values. No hardcoded color values remain in the theme definition.

### [CODE_REVIEW] Phase 1: Sitemap references deleted modal route
- **Status:** RESOLVED
- **Phase:** Phase-1, Task 1
- **Commit:** d4dcd57
- **Detail:** The scaffold removal commit deleted `app/modal.tsx` but simultaneously added a `/modal` entry to `public/sitemap.xml` (lines 8-12). The sitemap now advertises a route that does not exist. This will produce 404s for any crawler following the sitemap. The `/modal` entry should be removed. The `lastmod` date was also stripped from the existing root entry; consider whether that was intentional.
- **Resolution:** Removed the `/modal` entry from `public/sitemap.xml` and restored the `lastmod` date on the root entry. The sitemap now only advertises the root route.

### [CODE_REVIEW] Phase 1: Behavioral change in app/index.tsx beyond spec scope
- **Status:** RESOLVED
- **Phase:** Phase-1, Task 1
- **Commit:** d4dcd57
- **Detail:** The scaffold removal commit refactored `app/index.tsx` from early-return rendering (error/loading/empty states returned full `<View>` wrappers without SEO `<Head>`) to a `renderContent()` helper where SEO `<Head>` and the offline banner always render regardless of state. This is a behavioral improvement (crawlers now see meta tags during loading/error), but Phase 1 is defined as "purely subtractive work." The spec's "Files to Modify" for Task 1 lists only `app/_layout.tsx`, not `app/index.tsx`. This change should either be reverted and deferred to Phase 3, or acknowledged as an intentional scope expansion. As-is, it creates review risk: was the rendering change tested for regressions across all states (error, loading, empty, populated)?
- **Resolution:** Reverted `app/index.tsx` to the original early-return pattern. The `renderContent()` helper and associated style additions (`errorContainer`, `loadingContainer`, `emptyStateContainer`) have been removed. SEO improvement deferred to Phase 3 as appropriate.

### [PLAN_REVIEW] Phase 1 Task 1: Missing `components/StyledText.tsx` from delete list
- **Status:** RESOLVED
- **Phase:** Phase-1
- **Detail:** The "Files to Delete" list in Task 1 enumerates 14 files but omits `components/StyledText.tsx`, which exists on disk at the project root. The task instructions say to delete the entire `components/` directory afterward, so the file would be removed in practice, but the explicit file list should include it. A zero-context engineer reading only the file list could miss it if they delete files individually before removing the directory. Add `components/StyledText.tsx` to the delete list.
- **Resolution:** `components/StyledText.tsx` was already present in the delete list (line 36). However, investigating the actual `components/` directory revealed that `components/__tests__/StyledText-test.js` and `components/__tests__/__snapshots__/` were missing from the list. These have now been added, and the file count in the commit message has been updated from 14 to 16. This ensures a zero-context engineer can delete all files individually and find the directory empty before removing it.
