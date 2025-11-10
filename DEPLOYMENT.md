# Deployment Guide

This guide covers deploying the Movies app to Google Play Store and Apple App Store.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Google Play Store Deployment](#google-play-store-deployment)
- [Apple App Store Deployment](#apple-app-store-deployment)
- [Post-Deployment](#post-deployment)
- [OTA Updates](#ota-updates)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts
- [ ] Expo account (free) - [signup](https://expo.dev/signup)
- [ ] Google Play Console account ($25 one-time fee)
- [ ] Apple Developer Program membership ($99/year) - *iOS only*

### Required Tools
```bash
# EAS CLI
npm install -g eas-cli

# Verify installation
eas --version
```

### Required Assets
- [ ] App icon (1024x1024 PNG)
- [ ] Adaptive icon (1024x1024 PNG) - Android
- [ ] Splash screen (1284x2778 PNG)
- [ ] Screenshots (see store requirements below)
- [ ] Privacy policy URL
- [ ] App description and metadata

## Google Play Store Deployment

### Phase 1: Prepare Store Listing

1. **Create App on Google Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Click "Create app"
   - Fill in:
     - App name: "Movies"
     - Default language: English (United States)
     - App or game: App
     - Free or paid: Free
   - Accept declarations

2. **Set Up Store Listing**
   - Navigate to "Store presence" → "Main store listing"
   - Fill in required fields:
     - **App name**: Movies
     - **Short description** (80 chars max):
       ```
       Discover popular movies and TV shows from TMDb. Browse, favorite, watch trailers.
       ```
     - **Full description** (4000 chars max):
       ```
       Movies is your gateway to discovering the latest and greatest in cinema and television.

       FEATURES:
       • Browse popular movies and top-rated TV shows
       • Mark your favorites for quick access
       • Watch trailers directly in the app
       • Read user reviews before watching
       • Filter by popular, top-rated, or favorites
       • Offline mode - access cached content without internet
       • Beautiful Material Design 3 interface

       DATA POWERED BY TMDb
       All movie and TV show data is provided by The Movie Database (TMDb),
       the world's most comprehensive source for movie and TV metadata.

       COMPLETELY FREE
       No subscriptions, no in-app purchases. Just movies.

       FEEDBACK
       We'd love to hear from you! Report bugs or request features at:
       https://github.com/HatmanStack/android-movies/issues
       ```
   - **App icon**: Upload 512x512 PNG
   - **Feature graphic**: Upload 1024x500 PNG

3. **Upload Screenshots**
   Requirements:
   - Phone: 2-8 screenshots (min 320px, max 3840px)
   - 7-inch tablet: 1-8 screenshots (optional)
   - 10-inch tablet: 1-8 screenshots (optional)

   Recommended:
   - Home screen with movie grid
   - Movie details screen with trailer
   - Favorites screen
   - Filter options screen
   - Offline mode indicator

4. **Categorization**
   - App category: Entertainment
   - Tags: Movies, TV Shows, Trailers, Reviews

5. **Contact Details**
   - Email: your-email@example.com
   - Phone: +1 (optional)
   - Website: https://github.com/HatmanStack/android-movies

6. **Privacy Policy**
   - **Required**: You must provide a privacy policy URL
   - Create one at [Privacy Policy Generator](https://www.privacypolicygenerator.info/)
   - Host on GitHub Pages, your website, or use a service
   - Include:
     - What data is collected (movie preferences, favorites)
     - Third-party services (TMDb API, YouTube API)
     - Data storage (local SQLite database)
     - No personal information collected

### Phase 2: Build the App

1. **Update Version Numbers**

   Edit `app.json`:
   ```json
   {
     "version": "1.0.0",
     "android": {
       "versionCode": 1
     }
   }
   ```

2. **Configure EAS Secrets**

   ```bash
   # Add API keys as secrets (more secure than eas.json)
   eas secret:create --scope project --name EXPO_PUBLIC_TMDB_API_KEY --value YOUR_TMDB_KEY
   eas secret:create --scope project --name EXPO_PUBLIC_YOUTUBE_API_KEY --value YOUR_YOUTUBE_KEY
   ```

3. **Run Tests**

   ```bash
   npm test
   npm run lint
   npx tsc --noEmit
   ```

4. **Build Production AAB**

   ```bash
   # First build will take 15-25 minutes
   eas build --profile production --platform android

   # Monitor build progress on:
   # https://expo.dev/accounts/YOUR_USERNAME/projects/movies-app/builds
   ```

5. **Download AAB**

   ```bash
   # Option 1: Download from build page
   # Option 2: CLI
   eas build:download --platform android --latest
   ```

### Phase 3: Upload to Play Console

1. **Create Internal Testing Release**
   - Go to "Release" → "Testing" → "Internal testing"
   - Click "Create new release"
   - Upload AAB file
   - Release name: `1.0.0 (1)` - Initial release
   - Release notes:
     ```
     Initial release of Movies app

     Features:
     - Browse popular movies and top-rated TV shows
     - Mark favorites
     - Watch trailers
     - Read reviews
     - Offline mode support
     ```
   - Click "Save" then "Review release"
   - Click "Start rollout to Internal testing"

2. **Add Testers**
   - Create email list of testers
   - Add to internal testing track
   - Testers will receive link to install

3. **Test Internal Release**
   - Install on real device via Play Store link
   - Test all features:
     - [ ] Browse movies
     - [ ] Toggle favorites
     - [ ] Watch trailers
     - [ ] View reviews
     - [ ] Filter movies
     - [ ] Offline mode
     - [ ] Pull to refresh

### Phase 4: Submit for Review

1. **Complete All Sections**
   - [ ] Store listing
   - [ ] App content (rating questionnaire)
   - [ ] Pricing & distribution
   - [ ] Content rating
   - [ ] Target audience
   - [ ] News app declaration (select "No")
   - [ ] COVID-19 contact tracing declaration (select "No")
   - [ ] Data safety form

2. **Data Safety Form**
   - **Data collection and security**:
     - Does your app collect any user data? → **No**
     - Is all data encrypted in transit? → **Yes**
   - **Data types**: None (we don't collect personal data)

3. **Content Rating**
   - Complete IARC questionnaire
   - Expected rating: Everyone (no objectionable content)

4. **Promote to Production**
   - After testing, create production release
   - Use same AAB as internal testing
   - Add release notes
   - Choose rollout percentage:
     - Start with 10-20% for first release
     - Monitor crash reports
     - Gradually increase to 100%

5. **Submit for Review**
   - Review timeline: 7-14 days typically
   - May be faster for updates
   - Monitor "Publishing overview" page

### Phase 5: Automated Submission (Optional)

For future updates, automate submission:

1. **Set Up Service Account**
   - Follow [Expo's guide](https://docs.expo.dev/submit/android/)
   - Download `service-account.json`
   - Place in project root

2. **Configure eas.json**
   ```json
   {
     "submit": {
       "production": {
         "android": {
           "serviceAccountKeyPath": "./service-account.json",
           "track": "internal"
         }
       }
     }
   }
   ```

3. **Submit via CLI**
   ```bash
   eas submit --platform android --latest
   ```

## Apple App Store Deployment

### Phase 1: Prerequisites

1. **Enroll in Apple Developer Program**
   - Cost: $99/year
   - URL: https://developer.apple.com/programs/
   - Processing time: 1-2 days

2. **Create App ID**
   - Go to [Apple Developer Portal](https://developer.apple.com/account)
   - Certificates, Identifiers & Profiles
   - Identifiers → + button
   - Select "App IDs"
   - Description: "Movies App"
   - Bundle ID: `com.movies.app`
   - Capabilities: None needed

3. **Create App on App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com/)
   - My Apps → + button
   - New App
   - Platforms: iOS
   - Name: Movies
   - Primary Language: English (U.S.)
   - Bundle ID: com.movies.app
   - SKU: movies-app-001

### Phase 2: Prepare Listing

1. **App Information**
   - Category: Entertainment
   - Content Rights: No (it's free)

2. **Pricing and Availability**
   - Price: Free
   - Availability: All territories

3. **App Privacy**
   - Privacy Policy URL: (same as Android)
   - Data Collection: None
   - Complete privacy questionnaire

4. **Version Information**
   - **Screenshots** (required):
     - 6.5" Display (iPhone 14 Pro Max): 1290 x 2796
     - 5.5" Display (iPhone 8 Plus): 1242 x 2208
     - 12.9" iPad Pro: 2048 x 2732
   - **Description** (same as Android)
   - **Keywords**: movies, tv shows, trailers, tmdb, entertainment
   - **Support URL**: https://github.com/HatmanStack/android-movies
   - **Marketing URL**: (optional)

### Phase 3: Build and Submit

1. **Configure Credentials**
   ```bash
   eas credentials
   # Follow prompts to generate certificates
   ```

2. **Build IPA**
   ```bash
   eas build --profile production --platform ios
   ```

3. **Submit to App Store**
   ```bash
   eas submit --platform ios --latest
   ```

4. **Complete Submission**
   - Go to App Store Connect
   - Version → Build → Select build
   - Export Compliance: No encryption (standard HTTPS only)
   - Advertising Identifier: No
   - Submit for Review

### Phase 4: Review Process

- Timeline: 1-3 days typically
- Monitor status in App Store Connect
- Common rejection reasons:
  - Missing privacy policy
  - Incomplete metadata
  - App not working as described
  - Design issues

## Post-Deployment

### Monitor Analytics

**Google Play Console**
- User acquisition
- User retention
- Crashes and ANRs
- Reviews and ratings

**App Store Connect**
- App Analytics
- Crash reports
- Reviews

### Respond to Reviews

- Respond to negative reviews within 24-48 hours
- Thank users for positive reviews
- Use feedback to prioritize features

### Track Metrics

Key metrics to monitor:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Retention rate (Day 1, Day 7, Day 30)
- Crash-free rate (target: >99%)
- Average session duration
- Feature usage

## OTA Updates

For JavaScript-only changes (no native code), use EAS Update:

### Set Up EAS Update

1. **Install**
   ```bash
   npm install expo-updates
   ```

2. **Configure**
   ```bash
   eas update:configure
   ```

3. **Publish Update**
   ```bash
   # Publish to production branch
   eas update --branch production --message "Fix movie detail crash"

   # Users will receive update on next app launch
   ```

### When to Use OTA

✅ Use OTA for:
- Bug fixes
- Text/content changes
- UI tweaks
- Minor feature additions

❌ Don't use OTA for:
- Native module changes
- SDK upgrades
- New permissions
- Major features (submit new version)

## Versioning Strategy

### Semantic Versioning

Use [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes, major redesign
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, minor improvements

Examples:
- `1.0.0` → Initial release
- `1.0.1` → Bug fix
- `1.1.0` → New search feature
- `2.0.0` → Major redesign

### Build Numbers

Increment for every build:
- Android: `versionCode` (1, 2, 3, ...)
- iOS: `buildNumber` ("1", "2", "3", ...)

### Update Process

1. **Bug fix release** (`1.0.0` → `1.0.1`):
   ```bash
   # Update version
   # Build and test
   eas build --profile production --platform all
   # Submit to stores
   eas submit --platform all --latest
   ```

2. **Feature release** (`1.0.0` → `1.1.0`):
   - Update changelog
   - Run full test suite
   - Beta test with internal testers
   - Gradual rollout (10% → 50% → 100%)

3. **Major release** (`1.0.0` → `2.0.0`):
   - Marketing preparation
   - Press release
   - Updated screenshots
   - Feature highlights in release notes

## Troubleshooting

### Build Rejected

**"App crashes on launch"**
- Check crash logs in respective consoles
- Verify API keys are set correctly
- Test on multiple devices
- Check for environment-specific issues

**"Missing functionality"**
- Ensure all features in description work
- Provide test account if needed
- Include demo video if complex

**"Privacy policy issues"**
- Verify policy is accessible
- Ensure it covers all data collection
- Update if app functionality changed

### Slow Review

**Google Play**
- Usually reviews within 1-3 days
- Can expedite for critical bugs (support ticket)

**App Store**
- Usually 1-3 days
- Can request expedited review (limited uses)

### Crash Reports

1. **Integrate Sentry** (optional but recommended):
   ```bash
   npm install @sentry/react-native
   expo install sentry-expo
   ```

2. **Configure**:
   ```javascript
   import * as Sentry from '@sentry/react-native';

   Sentry.init({
     dsn: 'YOUR_SENTRY_DSN',
     environment: __DEV__ ? 'development' : 'production',
   });
   ```

3. **Monitor** crashes in Sentry dashboard

## Checklist

### Pre-Submission
- [ ] All tests passing
- [ ] TypeScript compiles
- [ ] Lint passes
- [ ] Privacy policy published
- [ ] Screenshots prepared
- [ ] Store listing written
- [ ] Release notes written
- [ ] Version numbers updated
- [ ] API keys configured
- [ ] Tested on physical devices
- [ ] Tested offline functionality
- [ ] Performance tested

### Post-Submission
- [ ] Monitor review status daily
- [ ] Prepare responses for rejections
- [ ] Set up analytics tracking
- [ ] Monitor crash reports
- [ ] Respond to user reviews
- [ ] Plan next version features

## Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)
- [Expo Submission Docs](https://docs.expo.dev/submit/introduction/)
- [EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)

## Support

Questions? Issues?
- 📧 Email: support@yourapp.com
- 💬 GitHub: [android-movies/issues](https://github.com/HatmanStack/android-movies/issues)
