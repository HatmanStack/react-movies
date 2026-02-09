import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* SEO Meta Tags */}
        <title>React Movies - Discover Popular Movies & TV Shows</title>
        <meta name="description" content="Discover popular movies and TV shows from TMDb. Browse top-rated films, read reviews, watch trailers, and save your favorites." />
        <link rel="canonical" href="https://movies.hatstack.fun/" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="React Movies" />
        <meta name="theme-color" content="#1976D2" />

        {/* Favicon and Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/icon.png" />

        {/* Default Open Graph (overridden per-page) */}
        <meta property="og:site_name" content="React Movies" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:type" content="website" />

        {/* Default Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />

        {/* Web Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
