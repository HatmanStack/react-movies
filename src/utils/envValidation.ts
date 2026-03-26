import { logError, logWarn } from "./errorHandler";

interface EnvConfig {
  TMDB_API_KEY: string;
  YOUTUBE_API_KEY?: string;
}

export function validateEnvironment(): EnvConfig {
  const tmdbKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  const youtubeKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;

  if (!tmdbKey) {
    const msg = "EXPO_PUBLIC_TMDB_API_KEY is not set. API calls will fail.";
    logError(new Error(msg), "EnvValidation");
    throw new Error(msg);
  }

  if (!youtubeKey) {
    logWarn(
      "EXPO_PUBLIC_YOUTUBE_API_KEY is not set. Trailer thumbnails will use defaults.",
      "EnvValidation",
    );
  }

  return {
    TMDB_API_KEY: tmdbKey,
    YOUTUBE_API_KEY: youtubeKey,
  };
}
