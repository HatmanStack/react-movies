# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-03

### Added
- Browse popular movies and top-rated TV shows via TMDb API
- Filter by popular, top-rated, or favorites with header pill controls
- Mark movies as favorites with optimistic UI updates
- YouTube trailer playback and user review display
- Offline mode with cached data (SQLite on native, AsyncStorage on web)
- Cross-platform support: Android, iOS, and Web
- Material Design 3 theming via React Native Paper
- Infinite scroll pagination
- SEO support for web (meta tags, JSON-LD structured data, sitemap)
- Comprehensive test suite with 80% coverage threshold
- CI pipeline with lint, type-check, and test stages
- Zod schema validation for all API responses
- Exponential backoff retry logic for API calls
- Request cancellation via AbortController

### Changed
- Migrated from Android native (Kotlin/Room) to React Native/Expo
- Moved filter controls from FAB to header pills
- Fixed expo-sqlite WASM bundling for web platform

[1.0.0]: https://github.com/HatmanStack/react-movies/releases/tag/v1.0.0
