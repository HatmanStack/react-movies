# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install                # Install dependencies
npx expo start             # Start dev server (a=Android, i=iOS, w=Web)
npx expo start --web       # Web only
npm test                   # Run all tests
npm run test:coverage      # Tests with coverage report
npx jest path/to/test      # Run a single test file
npx jest --testPathPattern="MovieCard"  # Run tests matching pattern
npm run lint               # ESLint
npm run type-check         # TypeScript strict checking
npm run format             # Prettier formatting
```

## Architecture

**Expo Router (file-based routing)** in `/app/`:

- `/app/index.tsx` — Home screen (movie grid with infinite scroll)
- `/app/details/[id].tsx` — Movie details (trailers, reviews)
- `/app/_layout.tsx` — Root layout with React Native Paper theme and ErrorBoundary
- `/app/+html.tsx` — Custom HTML wrapper for web builds

**State management**: Zustand stores in `/src/store/`:

- `movieStore.ts` — Movie data, pagination, offline mode, favorites (optimistic updates, AbortController cancellation, consolidated sync method)
- `filterStore.ts` — Filter toggles (Popular, Top Rated, Favorites)

**API layer** in `/src/api/`:

- `tmdb.ts` — TMDb API with retry logic (3 attempts, exponential backoff) and Zod validation
- `youtube.ts` — YouTube trailer thumbnails with fallback

**Database layer** in `/src/database/`:

- Platform-aware: expo-sqlite on native, AsyncStorage on web
- `schema.ts` defines tables (`movie_details`, `video_details`, `review_details`)
- `queries.ts` has type-safe query functions with batch operations and transactions (native)

**Validation**: Zod schemas in `/src/validation/` validate all API responses.

**Utilities** in `/src/utils/`:

- `envValidation.ts` — Validates required environment variables at startup
- `errorHandler.ts` — Structured logging (`logInfo`, `logError`, `logWarn`)
- `seo.ts` — Dynamic meta tags and JSON-LD structured data (web only)

## Key Patterns

- **Path alias**: `@/*` maps to project root (configured in tsconfig.json)
- **Platform branching**: `Platform.OS === 'web'` checks throughout database layer
- **Offline support**: NetInfo listener in movieStore triggers offline mode with cached SQLite/AsyncStorage data
- **Components use React Native Paper** (Material Design 3) — wrap test renders in `<PaperProvider>`
- **expo-image** with blurhash placeholders and memory-disk caching policy
- **SEO** (web only): Dynamic meta tags, JSON-LD structured data

## Testing

- Jest with `jest-expo` preset, 80% coverage threshold enforced
- Tests in `/__tests__/` mirror src structure: `api/`, `components/`, `database/`, `store/`, `integration/`, `unit/`
- `jest.setup.js` mocks expo-sqlite, NetInfo, AsyncStorage, reanimated, expo-router
- Component tests use React Native Testing Library with PaperProvider wrapper

## Environment

Requires `.env` with:

```
EXPO_PUBLIC_TMDB_API_KEY=<tmdb_api_key>
EXPO_PUBLIC_YOUTUBE_API_KEY=<youtube_api_key>  # optional, falls back to default thumbnails
```

## CI

GitHub Actions (`.github/workflows/ci.yml`): lint → type-check → test → codecov upload on all branches.
