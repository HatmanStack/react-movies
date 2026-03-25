# Feedback: 2026-03-25-audit-react-movies

## Active Feedback

(No open items.)

## Resolved Feedback

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
