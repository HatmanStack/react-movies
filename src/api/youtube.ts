/**
 * YouTube Data API v3 Service
 * Provides methods to fetch video thumbnails and construct YouTube URLs
 */

import { YouTubeVideoResponse } from './types';

/**
 * YouTube API configuration constants
 */
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';
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
   * @returns Promise<string> - Thumbnail URL
   */
  static async getVideoThumbnail(videoKey: string): Promise<string> {
    try {
      if (!YOUTUBE_API_KEY) {
        console.warn('YouTube API key not configured, using default thumbnail');
        return this.getDefaultThumbnail(videoKey);
      }

      const url = new URL(`${YOUTUBE_BASE_URL}/videos`);
      url.searchParams.append('id', videoKey);
      url.searchParams.append('key', YOUTUBE_API_KEY);
      url.searchParams.append('part', 'snippet');

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.warn(`YouTube API request failed: ${response.statusText}`);
        return this.getDefaultThumbnail(videoKey);
      }

      const data = (await response.json()) as YouTubeVideoResponse;

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
    } catch (error) {
      console.warn('YouTube API error, using default thumbnail:', error);
      return this.getDefaultThumbnail(videoKey);
    }
  }

  /**
   * Get default YouTube thumbnail URL (no API call required)
   * Uses YouTube's direct image URL format
   *
   * @param videoKey - YouTube video ID/key
   * @returns Default thumbnail URL
   */
  static getDefaultThumbnail(videoKey: string): string {
    return `https://img.youtube.com/vi/${videoKey}/hqdefault.jpg`;
  }

  /**
   * Construct YouTube watch URL for a video
   * @param videoKey - YouTube video ID/key
   * @returns Full YouTube watch URL
   */
  static getWatchUrl(videoKey: string): string {
    return `https://www.youtube.com/watch?v=${videoKey}`;
  }

  /**
   * Construct YouTube embed URL for WebView playback
   * @param videoKey - YouTube video ID/key
   * @returns YouTube embed URL for iframe/WebView
   */
  static getEmbedUrl(videoKey: string): string {
    return `https://www.youtube.com/embed/${videoKey}`;
  }
}
