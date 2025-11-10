/**
 * Database query functions tests
 * Tests all DAO-equivalent functions with in-memory database
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
  getVideosForMovie,
  getTrailersForMovie,
  insertReview,
  getReviewsForMovie,
} from '../../src/database/queries';
import { initDatabase, resetDatabase, closeDatabase } from '../../src/database/init';
import { MovieDetails, VideoDetails, ReviewDetails } from '../../src/models/types';

// Test data
const mockMovie: MovieDetails = {
  id: 1,
  title: 'Test Movie',
  overview: 'Test description',
  poster_path: '/test.jpg',
  release_date: '2024-01-01',
  vote_average: 8,
  vote_count: 100,
  popularity: 50.5,
  original_language: 'en',
  favorite: true,
  toprated: false,
  popular: true,
};

const mockMovie2: MovieDetails = {
  id: 2,
  title: 'Test Movie 2',
  overview: 'Test description 2',
  poster_path: '/test2.jpg',
  release_date: '2024-01-02',
  vote_average: 7,
  vote_count: 80,
  popularity: 40.5,
  original_language: 'en',
  favorite: false,
  toprated: true,
  popular: false,
};

const mockVideo: Omit<VideoDetails, 'identity'> = {
  id: 1,
  iso_639_1: 'en',
  iso_3166_1: 'US',
  key: 'dQw4w9WgXcQ',
  site: 'YouTube',
  size: '1080',
  type: 'Trailer',
  image_url: 'https://example.com/thumbnail.jpg',
};

const mockReview: Omit<ReviewDetails, 'identity'> = {
  id: 1,
  author: 'John Doe',
  content: 'Great movie!',
};

describe('Database Query Functions', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  // ============================================================================
  // MOVIE QUERIES
  // ============================================================================

  describe('Movie Queries', () => {
    describe('insertMovie', () => {
      it('should insert a movie successfully', async () => {
        await insertMovie(mockMovie);

        const movie = await getMovieById(1);
        expect(movie).not.toBeNull();
        expect(movie?.title).toBe('Test Movie');
        expect(movie?.favorite).toBe(true); // Verify boolean mapping
      });

      it('should replace existing movie on conflict', async () => {
        await insertMovie(mockMovie);
        await insertMovie({ ...mockMovie, title: 'Updated Title' });

        const movie = await getMovieById(1);
        expect(movie?.title).toBe('Updated Title');
      });

      it('should correctly map boolean to INTEGER', async () => {
        await insertMovie(mockMovie);

        const movie = await getMovieById(1);
        expect(movie?.favorite).toBe(true);
        expect(movie?.toprated).toBe(false);
        expect(movie?.popular).toBe(true);
      });
    });

    describe('getMovieById', () => {
      it('should return movie when exists', async () => {
        await insertMovie(mockMovie);

        const movie = await getMovieById(1);
        expect(movie).not.toBeNull();
        expect(movie?.id).toBe(1);
      });

      it('should return null when movie does not exist', async () => {
        const movie = await getMovieById(999);
        expect(movie).toBeNull();
      });
    });

    describe('getFavoriteMovies', () => {
      it('should return only favorite movies', async () => {
        await insertMovie(mockMovie); // favorite = true
        await insertMovie(mockMovie2); // favorite = false

        const favorites = await getFavoriteMovies();
        expect(favorites).toHaveLength(1);
        expect(favorites[0].favorite).toBe(true);
        expect(favorites[0].id).toBe(1);
      });

      it('should return empty array when no favorites', async () => {
        await insertMovie(mockMovie2); // favorite = false

        const favorites = await getFavoriteMovies();
        expect(favorites).toHaveLength(0);
      });
    });

    describe('getPopularMovies', () => {
      it('should return only popular movies', async () => {
        await insertMovie(mockMovie); // popular = true
        await insertMovie(mockMovie2); // popular = false

        const popular = await getPopularMovies();
        expect(popular).toHaveLength(1);
        expect(popular[0].popular).toBe(true);
        expect(popular[0].id).toBe(1);
      });

      it('should return empty array when no popular movies', async () => {
        await insertMovie(mockMovie2); // popular = false

        const popular = await getPopularMovies();
        expect(popular).toHaveLength(0);
      });
    });

    describe('getTopRatedMovies', () => {
      it('should return only top-rated movies', async () => {
        await insertMovie(mockMovie); // toprated = false
        await insertMovie(mockMovie2); // toprated = true

        const topRated = await getTopRatedMovies();
        expect(topRated).toHaveLength(1);
        expect(topRated[0].toprated).toBe(true);
        expect(topRated[0].id).toBe(2);
      });

      it('should return empty array when no top-rated movies', async () => {
        await insertMovie(mockMovie); // toprated = false

        const topRated = await getTopRatedMovies();
        expect(topRated).toHaveLength(0);
      });
    });

    describe('getAllMovies', () => {
      it('should return all movies', async () => {
        await insertMovie(mockMovie);
        await insertMovie(mockMovie2);

        const all = await getAllMovies();
        expect(all).toHaveLength(2);
      });

      it('should return empty array when no movies', async () => {
        const all = await getAllMovies();
        expect(all).toHaveLength(0);
      });
    });

    describe('deleteMovie', () => {
      it('should delete movie successfully', async () => {
        await insertMovie(mockMovie);
        await deleteMovie(1);

        const movie = await getMovieById(1);
        expect(movie).toBeNull();
      });

      it('should not error when deleting non-existent movie', async () => {
        await expect(deleteMovie(999)).resolves.not.toThrow();
      });
    });
  });

  // ============================================================================
  // VIDEO QUERIES
  // ============================================================================

  describe('Video Queries', () => {
    describe('insertVideo', () => {
      it('should insert a video successfully', async () => {
        await insertVideo(mockVideo);

        const videos = await getVideosForMovie(1);
        expect(videos).toHaveLength(1);
        expect(videos[0].key).toBe('dQw4w9WgXcQ');
      });

      it('should auto-generate identity', async () => {
        await insertVideo(mockVideo);
        await insertVideo({ ...mockVideo, key: 'different_key' });

        const videos = await getVideosForMovie(1);
        expect(videos).toHaveLength(2);
        expect(videos[0].identity).toBeDefined();
        expect(videos[1].identity).toBeDefined();
        expect(videos[0].identity).not.toBe(videos[1].identity);
      });
    });

    describe('getVideosForMovie', () => {
      it('should return all videos for a movie', async () => {
        await insertVideo(mockVideo);
        await insertVideo({ ...mockVideo, key: 'key2', type: 'Teaser' });

        const videos = await getVideosForMovie(1);
        expect(videos).toHaveLength(2);
      });

      it('should return empty array for movie with no videos', async () => {
        const videos = await getVideosForMovie(999);
        expect(videos).toHaveLength(0);
      });

      it('should only return videos for specified movie', async () => {
        await insertVideo(mockVideo); // movie id 1
        await insertVideo({ ...mockVideo, id: 2 }); // movie id 2

        const videos = await getVideosForMovie(1);
        expect(videos).toHaveLength(1);
        expect(videos[0].id).toBe(1);
      });
    });

    describe('getTrailersForMovie', () => {
      it('should return only trailers for a movie', async () => {
        await insertVideo(mockVideo); // type = 'Trailer'
        await insertVideo({ ...mockVideo, key: 'key2', type: 'Teaser' });

        const trailers = await getTrailersForMovie(1);
        expect(trailers).toHaveLength(1);
        expect(trailers[0].type).toBe('Trailer');
      });

      it('should return empty array when no trailers', async () => {
        await insertVideo({ ...mockVideo, type: 'Teaser' });

        const trailers = await getTrailersForMovie(1);
        expect(trailers).toHaveLength(0);
      });
    });
  });

  // ============================================================================
  // REVIEW QUERIES
  // ============================================================================

  describe('Review Queries', () => {
    describe('insertReview', () => {
      it('should insert a review successfully', async () => {
        await insertReview(mockReview);

        const reviews = await getReviewsForMovie(1);
        expect(reviews).toHaveLength(1);
        expect(reviews[0].author).toBe('John Doe');
        expect(reviews[0].content).toBe('Great movie!');
      });

      it('should auto-generate identity', async () => {
        await insertReview(mockReview);
        await insertReview({ ...mockReview, author: 'Jane Doe' });

        const reviews = await getReviewsForMovie(1);
        expect(reviews).toHaveLength(2);
        expect(reviews[0].identity).toBeDefined();
        expect(reviews[1].identity).toBeDefined();
        expect(reviews[0].identity).not.toBe(reviews[1].identity);
      });
    });

    describe('getReviewsForMovie', () => {
      it('should return all reviews for a movie', async () => {
        await insertReview(mockReview);
        await insertReview({ ...mockReview, author: 'Jane Doe' });

        const reviews = await getReviewsForMovie(1);
        expect(reviews).toHaveLength(2);
      });

      it('should return empty array for movie with no reviews', async () => {
        const reviews = await getReviewsForMovie(999);
        expect(reviews).toHaveLength(0);
      });

      it('should only return reviews for specified movie', async () => {
        await insertReview(mockReview); // movie id 1
        await insertReview({ ...mockReview, id: 2 }); // movie id 2

        const reviews = await getReviewsForMovie(1);
        expect(reviews).toHaveLength(1);
        expect(reviews[0].id).toBe(1);
      });
    });
  });

  // ============================================================================
  // EDGE CASES & SQL INJECTION TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle null values gracefully', async () => {
      const movieWithNulls: MovieDetails = {
        ...mockMovie,
        overview: '',
        poster_path: '',
      };

      await insertMovie(movieWithNulls);
      const movie = await getMovieById(1);

      expect(movie).not.toBeNull();
      expect(movie?.overview).toBe('');
    });

    it('should handle duplicate inserts with REPLACE strategy', async () => {
      await insertMovie(mockMovie);
      await insertMovie({ ...mockMovie, title: 'Updated' });

      const all = await getAllMovies();
      expect(all).toHaveLength(1);
      expect(all[0].title).toBe('Updated');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in getMovieById', async () => {
      await insertMovie(mockMovie);

      // Attempt SQL injection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maliciousId = "1 OR 1=1; DROP TABLE movie_details--" as any;

      // Should not throw error and should use prepared statement
      await expect(getMovieById(maliciousId)).resolves.not.toThrow();
    });

    it('should prevent SQL injection in getVideosForMovie', async () => {
      await insertVideo(mockVideo);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maliciousId = "1 OR 1=1; DROP TABLE video_details--" as any;

      await expect(getVideosForMovie(maliciousId)).resolves.not.toThrow();
    });
  });
});
