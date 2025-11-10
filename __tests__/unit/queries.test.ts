/**
 * Unit tests for database queries error handling
 */

import {
  insertMovie,
  getMovieById,
  getFavoriteMovies,
  getPopularMovies,
  getTopRatedMovies,
  getAllMovies,
  deleteMovie,
  insertVideo,
  getTrailersForMovie,
  getVideosForMovie,
  insertReview,
  getReviewsForMovie,
} from '../../src/database/queries';
import { getDatabase } from '../../src/database/init';

// Mock the database
jest.mock('../../src/database/init');

describe('Database Queries - Error Handling', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };

    (getDatabase as jest.Mock).mockReturnValue(mockDb);
  });

  describe('insertMovie', () => {
    it('should throw error when database insert fails', async () => {
      const testMovie = {
        id: 1,
        title: 'Test Movie',
        overview: 'Test',
        poster_path: '/test.jpg',
        release_date: '2024-01-01',
        vote_average: 8.5,
        vote_count: 100,
        popularity: 50,
        original_language: 'en',
        favorite: false,
        toprated: false,
        popular: true,
      };

      mockDb.runAsync.mockRejectedValueOnce(new Error('Database locked'));

      await expect(insertMovie(testMovie)).rejects.toThrow(
        'Failed to insert movie: Database locked'
      );
    });

    it('should handle non-Error exceptions in insertMovie', async () => {
      const testMovie = {
        id: 1,
        title: 'Test Movie',
        overview: 'Test',
        poster_path: '/test.jpg',
        release_date: '2024-01-01',
        vote_average: 8.5,
        vote_count: 100,
        popularity: 50,
        original_language: 'en',
        favorite: false,
        toprated: false,
        popular: true,
      };

      mockDb.runAsync.mockRejectedValueOnce('String error');

      await expect(insertMovie(testMovie)).rejects.toThrow('Failed to insert movie: Unknown error');
    });
  });

  describe('getMovieById', () => {
    it('should throw error when database query fails', async () => {
      mockDb.getFirstAsync.mockRejectedValueOnce(new Error('Query failed'));

      await expect(getMovieById(1)).rejects.toThrow('Failed to get movie by ID: Query failed');
    });

    it('should handle non-Error exceptions in getMovieById', async () => {
      mockDb.getFirstAsync.mockRejectedValueOnce('String error');

      await expect(getMovieById(1)).rejects.toThrow(
        'Failed to get movie by ID: Unknown error'
      );
    });
  });

  describe('getFavoriteMovies', () => {
    it('should throw error when database query fails', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('Connection lost'));

      await expect(getFavoriteMovies()).rejects.toThrow(
        'Failed to get favorite movies: Connection lost'
      );
    });

    it('should handle non-Error exceptions in getFavoriteMovies', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce('String error');

      await expect(getFavoriteMovies()).rejects.toThrow(
        'Failed to get favorite movies: Unknown error'
      );
    });
  });

  describe('getPopularMovies', () => {
    it('should throw error when database query fails', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('Table not found'));

      await expect(getPopularMovies()).rejects.toThrow(
        'Failed to get popular movies: Table not found'
      );
    });

    it('should handle non-Error exceptions in getPopularMovies', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce('String error');

      await expect(getPopularMovies()).rejects.toThrow(
        'Failed to get popular movies: Unknown error'
      );
    });
  });

  describe('getTopRatedMovies', () => {
    it('should throw error when database query fails', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('Disk full'));

      await expect(getTopRatedMovies()).rejects.toThrow('Failed to get top-rated movies: Disk full');
    });

    it('should handle non-Error exceptions in getTopRatedMovies', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce('String error');

      await expect(getTopRatedMovies()).rejects.toThrow(
        'Failed to get top-rated movies: Unknown error'
      );
    });
  });

  describe('getAllMovies', () => {
    it('should throw error when database query fails', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('Timeout'));

      await expect(getAllMovies()).rejects.toThrow('Failed to get all movies: Timeout');
    });

    it('should handle non-Error exceptions in getAllMovies', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce('String error');

      await expect(getAllMovies()).rejects.toThrow('Failed to get all movies: Unknown error');
    });
  });

  describe('deleteMovie', () => {
    it('should throw error when database delete fails', async () => {
      mockDb.runAsync.mockRejectedValueOnce(new Error('Cannot delete'));

      await expect(deleteMovie(1)).rejects.toThrow('Failed to delete movie: Cannot delete');
    });

    it('should handle non-Error exceptions in deleteMovie', async () => {
      mockDb.runAsync.mockRejectedValueOnce('String error');

      await expect(deleteMovie(1)).rejects.toThrow('Failed to delete movie: Unknown error');
    });
  });

  describe('insertVideo', () => {
    it('should throw error when database insert fails', async () => {
      const testVideo = {
        id: 1,
        image_url: 'https://test.com/thumb.jpg',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        key: 'abc123',
        site: 'YouTube',
        size: 1080,
        type: 'Trailer',
      };

      mockDb.runAsync.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(insertVideo(testVideo)).rejects.toThrow('Failed to insert video: Insert failed');
    });

    it('should handle non-Error exceptions in insertVideo', async () => {
      const testVideo = {
        id: 1,
        image_url: 'https://test.com/thumb.jpg',
        iso_639_1: 'en',
        iso_3166_1: 'US',
        key: 'abc123',
        site: 'YouTube',
        size: 1080,
        type: 'Trailer',
      };

      mockDb.runAsync.mockRejectedValueOnce('String error');

      await expect(insertVideo(testVideo)).rejects.toThrow('Failed to insert video: Unknown error');
    });
  });

  describe('getTrailersForMovie', () => {
    it('should throw error when database query fails', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('Query error'));

      await expect(getTrailersForMovie(1)).rejects.toThrow(
        'Failed to get trailers for movie: Query error'
      );
    });

    it('should handle non-Error exceptions in getTrailersForMovie', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce('String error');

      await expect(getTrailersForMovie(1)).rejects.toThrow(
        'Failed to get trailers for movie: Unknown error'
      );
    });
  });

  describe('getVideosForMovie', () => {
    it('should throw error when database query fails', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('Database corrupt'));

      await expect(getVideosForMovie(1)).rejects.toThrow(
        'Failed to get videos for movie: Database corrupt'
      );
    });

    it('should handle non-Error exceptions in getVideosForMovie', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce('String error');

      await expect(getVideosForMovie(1)).rejects.toThrow('Failed to get videos for movie: Unknown error');
    });
  });

  describe('insertReview', () => {
    it('should throw error when database insert fails', async () => {
      const testReview = {
        id: 1,
        author: 'John Doe',
        content: 'Great movie!',
      };

      mockDb.runAsync.mockRejectedValueOnce(new Error('Write failed'));

      await expect(insertReview(testReview)).rejects.toThrow(
        'Failed to insert review: Write failed'
      );
    });

    it('should handle non-Error exceptions in insertReview', async () => {
      const testReview = {
        id: 1,
        author: 'John Doe',
        content: 'Great movie!',
      };

      mockDb.runAsync.mockRejectedValueOnce('String error');

      await expect(insertReview(testReview)).rejects.toThrow(
        'Failed to insert review: Unknown error'
      );
    });
  });

  describe('getReviewsForMovie', () => {
    it('should throw error when database query fails', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(getReviewsForMovie(1)).rejects.toThrow(
        'Failed to get reviews for movie: Connection timeout'
      );
    });

    it('should handle non-Error exceptions in getReviewsForMovie', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce('String error');

      await expect(getReviewsForMovie(1)).rejects.toThrow(
        'Failed to get reviews for movie: Unknown error'
      );
    });
  });
});
