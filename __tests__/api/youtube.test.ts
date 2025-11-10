/**
 * Tests for YouTube API Service
 */

import { YouTubeService } from '../../src/api/youtube';
import { YouTubeVideoResponse } from '../../src/api/types';

describe('YouTubeService', () => {
  const originalFetch = global.fetch;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    console.warn = jest.fn(); // Suppress console warnings in tests
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.warn = originalConsoleWarn;
    jest.clearAllMocks();
  });

  describe('getVideoThumbnail', () => {
    it('should fetch high-quality thumbnail successfully', async () => {
      const mockResponse: YouTubeVideoResponse = {
        kind: 'youtube#videoListResponse',
        etag: 'test-etag',
        pageInfo: {
          totalResults: 1,
          resultsPerPage: 1,
        },
        items: [
          {
            kind: 'youtube#video',
            etag: 'test-etag',
            id: 'dQw4w9WgXcQ',
            snippet: {
              publishedAt: '2009-10-25T06:57:33Z',
              channelId: 'UCuAXFkgsw1L7xaCfnd5JJOw',
              title: 'Rick Astley - Never Gonna Give You Up',
              description: 'Official video',
              thumbnails: {
                default: {
                  url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
                  width: 120,
                  height: 90,
                },
                medium: {
                  url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                  width: 320,
                  height: 180,
                },
                high: {
                  url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
                  width: 480,
                  height: 360,
                },
                maxres: {
                  url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                  width: 1280,
                  height: 720,
                },
              },
              channelTitle: 'Rick Astley',
              categoryId: '10',
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const thumbnail = await YouTubeService.getVideoThumbnail('dQw4w9WgXcQ');

      expect(thumbnail).toBe(
        'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('youtube/v3/videos')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('id=dQw4w9WgXcQ')
      );
    });

    it('should fallback to high quality when maxres not available', async () => {
      const mockResponse: YouTubeVideoResponse = {
        kind: 'youtube#videoListResponse',
        etag: 'test-etag',
        pageInfo: { totalResults: 1, resultsPerPage: 1 },
        items: [
          {
            kind: 'youtube#video',
            etag: 'test-etag',
            id: 'test123',
            snippet: {
              publishedAt: '2020-01-01T00:00:00Z',
              channelId: 'test-channel',
              title: 'Test Video',
              description: 'Test',
              thumbnails: {
                default: {
                  url: 'https://i.ytimg.com/vi/test123/default.jpg',
                  width: 120,
                  height: 90,
                },
                medium: {
                  url: 'https://i.ytimg.com/vi/test123/mqdefault.jpg',
                  width: 320,
                  height: 180,
                },
                high: {
                  url: 'https://i.ytimg.com/vi/test123/hqdefault.jpg',
                  width: 480,
                  height: 360,
                },
              },
              channelTitle: 'Test Channel',
              categoryId: '10',
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const thumbnail = await YouTubeService.getVideoThumbnail('test123');

      expect(thumbnail).toBe('https://i.ytimg.com/vi/test123/hqdefault.jpg');
    });

    it('should fallback to default thumbnail on API failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response);

      const thumbnail = await YouTubeService.getVideoThumbnail('dQw4w9WgXcQ');

      expect(thumbnail).toBe(
        'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
      );
      expect(console.warn).toHaveBeenCalled();
    });

    it('should fallback to default thumbnail on network error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const thumbnail = await YouTubeService.getVideoThumbnail('dQw4w9WgXcQ');

      expect(thumbnail).toBe(
        'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
      );
    });

    it('should fallback to default thumbnail when no items returned', async () => {
      const mockResponse: YouTubeVideoResponse = {
        kind: 'youtube#videoListResponse',
        etag: 'test-etag',
        pageInfo: { totalResults: 0, resultsPerPage: 0 },
        items: [],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const thumbnail = await YouTubeService.getVideoThumbnail('invalid123');

      expect(thumbnail).toBe(
        'https://img.youtube.com/vi/invalid123/hqdefault.jpg'
      );
    });
  });

  describe('getDefaultThumbnail', () => {
    it('should construct correct default thumbnail URL', () => {
      const url = YouTubeService.getDefaultThumbnail('dQw4w9WgXcQ');
      expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });
  });

  describe('getWatchUrl', () => {
    it('should construct correct YouTube watch URL', () => {
      const url = YouTubeService.getWatchUrl('dQw4w9WgXcQ');
      expect(url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });
  });

  describe('getEmbedUrl', () => {
    it('should construct correct YouTube embed URL', () => {
      const url = YouTubeService.getEmbedUrl('dQw4w9WgXcQ');
      expect(url).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });
});
