/**
 * SEO utility functions and constants
 */

export const SEO_CONFIG = {
  siteName: 'React Movies',
  siteUrl: 'https://movies.hatstack.fun',
  defaultTitle: 'React Movies - Discover Popular Movies & TV Shows',
  defaultDescription:
    'Discover popular movies and TV shows from TMDb. Browse top-rated films, read reviews, watch trailers, and save your favorites.',
  defaultImage: '/og-image.jpg',
  twitterHandle: '@reactmovies',
};

/**
 * Generate page title with site name suffix
 */
export function generateTitle(pageTitle?: string): string {
  if (!pageTitle) return SEO_CONFIG.defaultTitle;
  return `${pageTitle} | ${SEO_CONFIG.siteName}`;
}

/**
 * Truncate description to SEO-friendly length (155 characters)
 */
export function truncateDescription(text: string, maxLength: number = 155): string {
  if (!text) return SEO_CONFIG.defaultDescription;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SEO_CONFIG.siteUrl}${cleanPath}`;
}

/**
 * Generate TMDb poster URL for Open Graph
 * Use larger size (w780) for better social sharing
 */
export function generateOgImageUrl(posterPath: string | null | undefined): string {
  if (!posterPath) return `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`;
  return `https://image.tmdb.org/t/p/w780${posterPath}`;
}

/**
 * Generate JSON-LD structured data for a movie
 */
export function generateMovieJsonLd(movie: {
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  original_language: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: movie.overview,
    image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    datePublished: movie.release_date,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: movie.vote_average.toFixed(1),
      bestRating: '10',
      worstRating: '0',
      ratingCount: movie.vote_count,
    },
    inLanguage: movie.original_language,
  };
}
