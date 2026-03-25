/**
 * YouTube Data API v3 Service
 * Provides methods to fetch video thumbnails and construct YouTube URLs
 * Includes retry logic and request cancellation support
 */

import { API } from '../constants';
import { withRetry } from '../utils/retry';
import { logWarn, isAbortError } from '../utils/errorHandler';
import { YouTubeVideoResponseSchema } from '../validation/schemas';

/**
 * YouTube API configuration
 */
const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;

/**
 * YouTube API Service class
 * Provides methods for YouTube video thumbnail fetching and URL construction
 */
export class YouTubeService {
  /**
   * Get high-quality thumbnail for a YouTube video
   * Falls back to default YouTube thumbnail if API call fails
   *
   * @param videoKey - YouTube video ID/key
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<string> - Thumbnail URL
   */
  static async getVideoThumbnail(
    videoKey: string,
    signal?: AbortSignal
  ): Promise<string> {
    // Validate video key
    if (!videoKey || !/^[a-zA-Z0-9_-]{11}$/.test(videoKey)) {
      logWarn('Invalid YouTube video key', 'YouTubeService', { videoKey });
      return this.getDefaultThumbnail(videoKey);
    }

    // If no API key, use default thumbnail directly
    if (!YOUTUBE_API_KEY) {
      logWarn('YouTube API key not configured, using default thumbnail', 'YouTubeService');
      return this.getDefaultThumbnail(videoKey);
    }

    const fetchThumbnail = async (): Promise<string> => {
      // Check if aborted
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const url = new URL(`${API.YOUTUBE_BASE_URL}/videos`);
      url.searchParams.append('id', videoKey);
      url.searchParams.append('key', YOUTUBE_API_KEY);
      url.searchParams.append('part', 'snippet');

      const response = await fetch(url.toString(), { signal });

      if (!response.ok) {
        throw new Error(`YouTube API request failed: ${response.statusText}`);
      }

      const rawData = await response.json();
      const result = YouTubeVideoResponseSchema.safeParse(rawData);

      if (!result.success) {
        logWarn('YouTube API response validation failed', 'YouTubeService', {
          videoKey,
          error: result.error.message,
        });
        return this.getDefaultThumbnail(videoKey);
      }

      const data = result.data;

      // Extract high-quality thumbnail
      if (data.items && data.items.length > 0) {
        const thumbnails = data.items[0].snippet.thumbnails;
        // Prefer highest quality available
        return (
          thumbnails.maxres?.url ||
          thumbnails.standard?.url ||
          thumbnails.high?.url ||
          thumbnails.medium?.url ||
          this.getDefaultThumbnail(videoKey)
        );
      }

      return this.getDefaultThumbnail(videoKey);
    };

    try {
      return await withRetry(fetchThumbnail, {
        maxAttempts: 2, // Lower retry count for thumbnails
        baseDelay: 500,
        signal,
        onRetry: (attempt, error) => {
          logWarn(`YouTube API retry attempt ${attempt}`, 'YouTubeService', {
            videoKey,
            error: error instanceof Error ? error.message : String(error),
          });
        },
      });
    } catch (error) {
      // Don't log abort errors as warnings
      if (!isAbortError(error)) {
        logWarn('YouTube API error, using default thumbnail', 'YouTubeService', {
          videoKey,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return this.getDefaultThumbnail(videoKey);
    }
  }

  /**
   * Batch fetch thumbnails for multiple videos
   * More efficient than individual calls
   *
   * @param videoKeys - Array of YouTube video IDs
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<Map<string, string>> - Map of videoKey to thumbnail URL
   */
  static async getVideoThumbnails(
    videoKeys: string[],
    signal?: AbortSignal
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    if (videoKeys.length === 0) {
      return results;
    }

    // Filter valid keys
    const validKeys = videoKeys.filter(key => /^[a-zA-Z0-9_-]{11}$/.test(key));
    const invalidKeys = videoKeys.filter(key => !/^[a-zA-Z0-9_-]{11}$/.test(key));

    // Add default thumbnails for invalid keys
    invalidKeys.forEach(key => {
      results.set(key, this.getDefaultThumbnail(key));
    });

    if (validKeys.length === 0 || !YOUTUBE_API_KEY) {
      // No valid keys or no API key - use defaults
      validKeys.forEach(key => {
        results.set(key, this.getDefaultThumbnail(key));
      });
      return results;
    }

    // Fetch all thumbnails in parallel
    const fetchPromises = validKeys.map(async key => {
      const thumbnail = await this.getVideoThumbnail(key, signal);
      return { key, thumbnail };
    });

    const settled = await Promise.allSettled(fetchPromises);

    settled.forEach((result, index) => {
      const key = validKeys[index];
      if (result.status === 'fulfilled') {
        results.set(key, result.value.thumbnail);
      } else {
        results.set(key, this.getDefaultThumbnail(key));
      }
    });

    return results;
  }

  /**
   * Get default YouTube thumbnail URL (no API call required)
   * Uses YouTube's direct image URL format
   *
   * @param videoKey - YouTube video ID/key
   * @returns Default thumbnail URL
   */
  static getDefaultThumbnail(videoKey: string): string {
    // Sanitize video key to prevent URL injection
    const sanitized = encodeURIComponent(videoKey);
    return `${API.YOUTUBE_THUMBNAIL_BASE}/${sanitized}/hqdefault.jpg`;
  }

  /**
   * Construct YouTube watch URL for a video
   *
   * @param videoKey - YouTube video ID/key
   * @returns Full YouTube watch URL
   */
  static getWatchUrl(videoKey: string): string {
    const sanitized = encodeURIComponent(videoKey);
    return `https://www.youtube.com/watch?v=${sanitized}`;
  }

  /**
   * Construct YouTube embed URL for WebView playback
   *
   * @param videoKey - YouTube video ID/key
   * @returns YouTube embed URL for iframe/WebView
   */
  static getEmbedUrl(videoKey: string): string {
    const sanitized = encodeURIComponent(videoKey);
    return `https://www.youtube.com/embed/${sanitized}`;
  }
}
