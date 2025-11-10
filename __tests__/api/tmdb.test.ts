/**
 * Tests for TMDb API Service
 */

import { TMDbService } from '../../src/api/tmdb';
import { APIError, NetworkError } from '../../src/api/errors';
import {
  TMDbDiscoverResponse,
  TMDbVideosResponse,
  TMDbReviewsResponse,
} from '../../src/api/types';

describe('TMDbService', () => {
  // Save original fetch
  const originalFetch = global.fetch;

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('getPopularMovies', () => {
    it('should fetch popular movies successfully', async () => {
      const mockResponse: TMDbDiscoverResponse = {
        page: 1,
        results: [
          {
            id: 550,
            title: 'Fight Club',
            overview: 'A ticking-time-bomb insomniac...',
            poster_path: '/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg',
            backdrop_path: '/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
            release_date: '1999-10-15',
            vote_average: 8.4,
            vote_count: 26280,
            popularity: 61.416,
            original_language: 'en',
            genre_ids: [18],
            adult: false,
            video: false,
          },
        ],
        total_results: 10000,
        total_pages: 500,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await TMDbService.getPopularMovies();

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Fight Club');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/discover/movie')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort_by=popularity.desc')
      );
    });

    it('should handle pagination', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ page: 2, results: [], total_results: 0, total_pages: 1 }),
      } as Response);

      await TMDbService.getPopularMovies(2);

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    });

    it('should throw APIError on 401 Unauthorized', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(TMDbService.getPopularMovies()).rejects.toThrow(APIError);
      await expect(TMDbService.getPopularMovies()).rejects.toThrow('Unauthorized');
    });

    it('should throw NetworkError on network failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(TMDbService.getPopularMovies()).rejects.toThrow(NetworkError);
    });
  });

  describe('getTopRatedTV', () => {
    it('should fetch top-rated TV shows successfully', async () => {
      const mockResponse: TMDbDiscoverResponse = {
        page: 1,
        results: [
          {
            id: 94605,
            name: 'Arcane',
            overview: 'Amid the stark discord...',
            poster_path: '/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
            backdrop_path: '/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg',
            first_air_date: '2021-11-06',
            vote_average: 8.746,
            vote_count: 3467,
            popularity: 84.196,
            original_language: 'en',
            genre_ids: [16, 10765, 10759, 18],
            adult: false,
            video: false,
          },
        ],
        total_results: 500,
        total_pages: 25,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await TMDbService.getTopRatedTV();

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Arcane');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/discover/tv')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort_by=vote_average.desc')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('vote_count.gte=100')
      );
    });
  });

  describe('getMovieVideos', () => {
    it('should fetch movie videos successfully', async () => {
      const mockResponse: TMDbVideosResponse = {
        id: 550,
        results: [
          {
            id: '5e382d1b4ca676001453826d',
            iso_639_1: 'en',
            iso_3166_1: 'US',
            key: 'BdJKm16Co6M',
            name: 'Fight Club - Trailer',
            site: 'YouTube',
            size: 1080,
            type: 'Trailer',
            official: true,
            published_at: '2015-02-26T03:19:25.000Z',
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await TMDbService.getMovieVideos(550);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].key).toBe('BdJKm16Co6M');
      expect(result.results[0].site).toBe('YouTube');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/movie/550/videos')
      );
    });

    it('should handle 404 for non-existent movie', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(TMDbService.getMovieVideos(999999)).rejects.toThrow(APIError);
    });
  });

  describe('getMovieReviews', () => {
    it('should fetch movie reviews successfully', async () => {
      const mockResponse: TMDbReviewsResponse = {
        id: 550,
        page: 1,
        results: [
          {
            id: '5a9c1c47925141277f01f5ef',
            author: 'John Doe',
            author_details: {
              name: 'John Doe',
              username: 'johndoe',
              avatar_path: null,
              rating: 10,
            },
            content: 'Amazing movie!',
            created_at: '2018-03-04T20:41:27.399Z',
            updated_at: '2021-06-23T15:58:17.718Z',
            url: 'https://www.themoviedb.org/review/5a9c1c47925141277f01f5ef',
          },
        ],
        total_pages: 1,
        total_results: 1,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await TMDbService.getMovieReviews(550);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].author).toBe('John Doe');
      expect(result.results[0].content).toBe('Amazing movie!');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/movie/550/reviews')
      );
    });
  });

  describe('getPosterUrl', () => {
    it('should construct correct poster URL', () => {
      const url = TMDbService.getPosterUrl('/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg');
      expect(url).toBe(
        'https://image.tmdb.org/t/p/w342/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg'
      );
    });

    it('should return placeholder for null poster_path', () => {
      const url = TMDbService.getPosterUrl(null);
      expect(url).toContain('placeholder');
    });

    it('should support different image sizes', () => {
      const url = TMDbService.getPosterUrl('/abc.jpg', 'w500');
      expect(url).toContain('/w500/abc.jpg');
    });
  });

  describe('getBackdropUrl', () => {
    it('should construct correct backdrop URL', () => {
      const url = TMDbService.getBackdropUrl('/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg');
      expect(url).toBe(
        'https://image.tmdb.org/t/p/w780/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg'
      );
    });

    it('should return placeholder for null backdrop_path', () => {
      const url = TMDbService.getBackdropUrl(null);
      expect(url).toContain('placeholder');
    });
  });
});
