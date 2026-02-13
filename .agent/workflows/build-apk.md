---
description: How to build an Android APK using Capacitor
---

# Build APK Workflow

Follow these steps to convert your web app into a native Android APK.

### 1. Initial Setup (One-time only)

Install the necessary Capacitor libraries and initialize the project.
// turbo
```powershell
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Let Em Cook" "com.letemcook.app" --web-dir dist
npx cap add android
```

### 2. Prepare Assets (Icons & Splash)

Create a high-quality icon (1024x1024) and splash image (2732x2732) in an `assets/` folder, then generate all sizes:
// turbo
```powershell
npm install @capacitor/assets -D
npx capacitor-assets generate --android
```

### 3. Build and Sync

Run this whenever you make changes to your React code.
// turbo
```powershell
npm run build
npx cap copy
npx cap sync
```

### 4. Generate APK in Android Studio

Open the project in Android Studio to build the final file.
// turbo
```powershell
npx cap open android
```

**Inside Android Studio:**
1. Wait for Gradle to finish indexing.
2. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Once finished, click **Locate** in the notification popup to get your `.apk` file.
