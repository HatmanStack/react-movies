# Production Build Guide

This guide explains how to create production-ready builds of the Movies app for Android and iOS.

## Prerequisites

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure Project Owner
Update `app.json`:
```json
{
  "expo": {
    "owner": "your-expo-username"
  }
}
```

### 4. Set Up API Keys
Create `.env` file in project root:
```env
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
EXPO_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
```

**IMPORTANT:** Never commit `.env` to git. It's already in `.gitignore`.

## Build Profiles

The project includes three build profiles in `eas.json`:

### 1. Development
For local development and testing with Expo Go or development client.
```bash
eas build --profile development --platform android
```

### 2. Preview
For internal testing and QA. Creates APK for easy installation.
```bash
eas build --profile preview --platform android
```

### 3. Production
For app store submission. Creates optimized app bundle (AAB).
```bash
eas build --profile production --platform android
```

## Android Build Process

### Step 1: Prepare for Build

1. **Update version numbers** in `app.json`:
   ```json
   {
     "version": "1.0.0",
     "android": {
       "versionCode": 1
     }
   }
   ```

2. **Test the app**:
   ```bash
   npm test
   npm run lint
   ```

### Step 2: Create Keystore (First Build Only)

EAS Build will automatically generate a keystore for you. To use an existing keystore:

```bash
eas credentials
```

Then follow the prompts to configure your Android keystore.

### Step 3: Build AAB for Google Play

```bash
# Build production AAB
eas build --profile production --platform android

# Wait for build to complete (10-20 minutes)
# Download AAB from build page or use:
eas build:download --platform android --latest
```

### Step 4: Test the Build

Install on a physical device:
```bash
# For preview APK
eas build --profile preview --platform android
adb install path/to/app.apk
```

### Step 5: Submit to Google Play

#### Option A: Manual Upload
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new application
3. Upload AAB to Internal Testing track
4. Complete store listing information
5. Submit for review

#### Option B: Automated Submission
1. Set up Google Play service account:
   - Follow [Expo's guide](https://docs.expo.dev/submit/android/)
   - Download `service-account.json`
   - Place in project root (DO NOT commit to git)

2. Update `eas.json` submission config:
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

3. Submit:
   ```bash
   eas submit --platform android --latest
   ```

## iOS Build Process (Optional)

### Step 1: Apple Developer Setup

1. **Enroll in Apple Developer Program** ($99/year)
   - https://developer.apple.com/programs/

2. **Create App ID** in Apple Developer Portal
   - Bundle Identifier: `com.movies.app`

3. **Generate certificates and profiles**:
   ```bash
   eas credentials
   ```

### Step 2: Build IPA

```bash
eas build --profile production --platform ios
```

### Step 3: Submit to App Store

```bash
# Configure App Store Connect
eas submit --platform ios --latest
```

## Environment Variables

For production builds, set environment variables in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_TMDB_API_KEY": "your_key_here",
        "EXPO_PUBLIC_YOUTUBE_API_KEY": "your_key_here"
      }
    }
  }
}
```

**Security Note:** For sensitive values, use EAS Secrets:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_TMDB_API_KEY --value your_key
eas secret:create --scope project --name EXPO_PUBLIC_YOUTUBE_API_KEY --value your_key
```

Then remove from `eas.json`.

## Build Optimization

### Reduce Build Size

1. **Enable Hermes** (already enabled by default in Expo SDK 50+)
2. **Remove unused dependencies**:
   ```bash
   npx depcheck
   ```

3. **Optimize images**:
   - Use WebP format for assets
   - Compress with TinyPNG or ImageOptim

4. **Enable ProGuard** (Android):
   Add to `eas.json`:
   ```json
   {
     "build": {
       "production": {
         "android": {
           "enableProguardInReleaseBuilds": true
         }
       }
     }
   }
   ```

### Build Performance

- Use EAS Build's caching for faster builds
- Cache is automatic, but can be cleared:
  ```bash
  eas build --clear-cache
  ```

## Troubleshooting

### Build Fails

1. **Check build logs** on Expo dashboard
2. **Verify dependencies** are compatible:
   ```bash
   npx expo-doctor
   ```

3. **Clear cache** and retry:
   ```bash
   eas build --clear-cache --profile production --platform android
   ```

### App Crashes on Launch

1. **Check native logs**:
   ```bash
   # Android
   adb logcat

   # iOS
   xcrun simctl spawn booted log stream
   ```

2. **Verify API keys** are set correctly
3. **Test in development mode** first

### Submission Rejected

1. **Review rejection reason** from store
2. **Common issues:**
   - Missing privacy policy
   - Missing app descriptions
   - Screenshot requirements not met
   - API key issues

## Version Management

### Increment Versions

Before each release:

1. **Update semantic version** in `app.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Increment build numbers**:
   ```json
   "android": { "versionCode": 2 },
   "ios": { "buildNumber": "2" }
   ```

### Over-the-Air (OTA) Updates

For JavaScript-only changes, use EAS Update:

```bash
# Publish update
eas update --branch production --message "Fix movie detail bug"

# Users will receive update on next app launch
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --non-interactive --platform android
```

## Production Checklist

Before submitting to stores:

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Linter passes (`npm run lint`)
- [ ] App tested on physical devices
- [ ] API keys configured in EAS secrets
- [ ] Privacy policy URL added
- [ ] Store listings prepared (screenshots, descriptions)
- [ ] Version numbers incremented
- [ ] Release notes written
- [ ] Tested offline functionality
- [ ] Performance tested with production build

## Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)

## Support

For build issues:
- Expo Discord: https://chat.expo.dev/
- Expo Forums: https://forums.expo.dev/
- GitHub Issues: https://github.com/HatmanStack/android-movies/issues
