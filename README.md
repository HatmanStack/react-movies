<div align="center">

![Movies App Banner](public/og-image.jpg)

[![](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/index.html)
[![](https://img.shields.io/badge/Zustand-454545?style=for-the-badge&logo=zustand&logoColor=white)](https://github.com/pmndrs/zustand)

A cross-platform mobile app for discovering movies, powered by the TMDb API.

[Try It](https://movies.hatstack.fun)

---

</div>

## Features

- Browse popular movies and top-rated TV shows
- Filter by popular, top-rated, or favorites
- Mark movies as favorites for quick access
- Watch YouTube trailers and read user reviews
- Offline mode with cached movie data

## Technologies Used

- React Native
- Expo
- TypeScript
- Zustand (State Management)
- Expo SQLite (Local Database)
- React Native Paper (Material Design 3)
- Expo Router (Navigation)
- TMDb API
- YouTube API
- Jest & React Native Testing Library

## Building

1.  **Prerequisites:** Node.js (20+) and npm.
2.  **Clone:** `git clone https://github.com/HatmanStack/react-movies.git`
3.  **Navigate:** `cd react-movies`
4.  **Install:** `npm install`
5.  **API Keys:** Copy `.env.example` to `.env` and fill in your API keys:
    ```env
    EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
    EXPO_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
    ```
6.  **Run:** `npx expo start` and scan the QR code with the Expo Go app, or press `w` for web.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.
