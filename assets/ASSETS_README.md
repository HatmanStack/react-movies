# App Assets Guide

This directory contains the app icon and splash screen assets for the Movies app.

## Current Assets

The app currently uses default Expo placeholder assets. For production, you should replace these with custom Movie-themed assets.

## Required Custom Assets

### 1. App Icon (`icon.png`)
- **Size:** 1024x1024 pixels
- **Format:** PNG with transparency
- **Design:** Movie/film-themed icon (e.g., film reel, movie camera, clapperboard)
- **Colors:** Consider using brand blue (#1976D2) as primary color
- **Path:** `./assets/images/icon.png`

### 2. Adaptive Icon (`adaptive-icon.png`)
- **Size:** 1024x1024 pixels
- **Format:** PNG with transparency
- **Design:** Same as app icon, but ensure important elements are within the safe zone (center 66%)
- **Background:** Configured as #1976D2 in app.json
- **Path:** `./assets/images/adaptive-icon.png`

### 3. Splash Screen (`splash-icon.png`)
- **Size:** 1284x2778 pixels (iPhone 14 Pro Max resolution)
- **Format:** PNG
- **Design:** Centered app icon or logo
- **Background:** Configured as #1976D2 in app.json
- **Path:** `./assets/images/splash-icon.png`

### 4. Favicon (`favicon.png`)
- **Size:** 48x48 pixels
- **Format:** PNG
- **Design:** Simplified version of app icon
- **Path:** `./assets/images/favicon.png`

## Design Recommendations

### Color Palette
- **Primary Blue:** #1976D2 (Material Design Blue 700)
- **Secondary:** #FFFFFF (White)
- **Accent:** #FFC107 (Amber for rating stars)

### Style Guidelines
- Use a modern, flat design aesthetic
- Ensure icon is recognizable at small sizes (48x48)
- Maintain consistency with Material Design principles
- Consider the target audience (movie enthusiasts)

### Design Tools
- **Figma:** Use Figma's icon templates
- **Adobe Illustrator:** Vector-based design for scalability
- **Canva:** Quick design with templates
- **Free Icons:** Consider flaticon.com or icons8.com for inspiration

## Asset Generation

After creating your custom assets:

1. **Export at the correct sizes:**
   - Icon: 1024x1024
   - Splash: 1284x2778
   - Favicon: 48x48

2. **Optimize file sizes:**
   ```bash
   # Using ImageOptim (macOS)
   # Or TinyPNG (web-based)
   # Or pngquant (CLI)
   pngquant --quality 80-90 icon.png
   ```

3. **Replace files in `./assets/images/`:**
   - icon.png
   - adaptive-icon.png
   - splash-icon.png
   - favicon.png

4. **Test on device:**
   ```bash
   # Clear Expo cache
   npx expo start --clear

   # Build development client to see icon
   eas build --profile development --platform android
   ```

## Troubleshooting

### Icon not updating
- Clear Expo cache: `npx expo start --clear`
- Rebuild the app
- Check file paths in app.json

### Icon appears blurry
- Ensure you're using PNG format, not JPEG
- Verify image is exactly 1024x1024
- Avoid scaling up small images

### Splash screen issues
- Verify backgroundColor in app.json matches your design
- Ensure resizeMode is set to "contain" for centered icons
- Test on various screen sizes

## References

- [Expo App Icons Guide](https://docs.expo.dev/develop/user-interface/app-icons/)
- [Expo Splash Screens](https://docs.expo.dev/develop/user-interface/splash-screen/)
- [Material Design Icons](https://material.io/design/iconography)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
