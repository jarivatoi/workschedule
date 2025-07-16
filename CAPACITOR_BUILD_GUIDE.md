# Capacitor APK Build Guide

## 🚀 Quick Start Commands

### Development Build (Debug APK)
```bash
npm run android:build
```

### Production Build (Release APK)
```bash
npm run android:release
```

### Open in Android Studio
```bash
npm run cap:android
```

## 📋 Prerequisites

### Required Software
1. **Node.js** (v16 or higher)
   - Download: https://nodejs.org/

2. **Android Studio** (Latest version)
   - Download: https://developer.android.com/studio
   - Install Android SDK (API 33 or higher)
   - Install Android Build Tools

3. **Java Development Kit (JDK 11 or higher)**
   - Download: https://adoptium.net/temurin/releases/

### Environment Variables (Required)
```bash
# Windows
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-11.0.19.7-hotspot

# macOS/Linux
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
```

## 🔧 Step-by-Step Build Process

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build Web App
```bash
npm run build
```

### Step 3: Sync with Capacitor
```bash
npm run cap:sync
```

### Step 4: Build APK
Choose one of these options:

#### Option A: Command Line Build (Recommended)
```bash
# Debug APK
npm run android:build

# Release APK (for production)
npm run android:release
```

#### Option B: Android Studio Build
```bash
# Open in Android Studio
npm run cap:android

# Then in Android Studio:
# 1. Wait for Gradle sync to complete
# 2. Build → Build Bundle(s) / APK(s) → Build APK(s)
```

## 📱 APK Output Locations

### Debug APK
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🛠️ Available NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run cap:build` | Build web app and sync with Capacitor |
| `npm run cap:android` | Build and open in Android Studio |
| `npm run cap:sync` | Sync Capacitor plugins and copy web assets |
| `npm run cap:copy` | Copy web assets to native platforms |
| `npm run android:dev` | Run with live reload for development |
| `npm run android:build` | Build debug APK via command line |
| `npm run android:release` | Build release APK via command line |

## 🔍 Troubleshooting

### Common Issues

#### 1. "ANDROID_HOME not set"
**Solution:**
```bash
# Find your Android SDK path in Android Studio:
# File → Project Structure → SDK Location

# Set environment variable:
# Windows: set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
# macOS/Linux: export ANDROID_HOME=$HOME/Android/Sdk
```

#### 2. "Java not found"
**Solution:**
```bash
# Install JDK 11+ and set JAVA_HOME
# Windows: set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-11.0.19.7-hotspot
# macOS/Linux: export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
```

#### 3. "Gradle build failed"
**Solution:**
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

#### 4. "Unable to launch Android Studio"
**Solution:**
```bash
# Set Capacitor Android Studio path
# Windows: set CAPACITOR_ANDROID_STUDIO_PATH="C:\Program Files\Android\Android Studio\bin\studio64.exe"
# macOS: export CAPACITOR_ANDROID_STUDIO_PATH="/Applications/Android Studio.app/Contents/bin/studio.sh"
```

### Performance Tips

1. **Use SSD storage** for faster builds
2. **Increase Gradle memory** in `android/gradle.properties`:
   ```properties
   org.gradle.jvmargs=-Xmx4g -XX:MaxPermSize=512m
   ```
3. **Enable Gradle daemon** for faster subsequent builds
4. **Use physical device** for testing (faster than emulator)

## 🔐 Release Build Configuration

### For Production APK (Release)

1. **Generate signing key:**
```bash
keytool -genkey -v -keystore work-schedule-release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias work-schedule
```

2. **Configure signing in `android/app/build.gradle`:**
```gradle
android {
    signingConfigs {
        release {
            storeFile file('work-schedule-release.keystore')
            storePassword 'your_store_password'
            keyAlias 'work-schedule'
            keyPassword 'your_key_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Build release APK:**
```bash
npm run android:release
```

## 📊 Build Verification

### Check APK Details
```bash
# APK size and info
ls -lh android/app/build/outputs/apk/debug/app-debug.apk

# APK contents (optional)
unzip -l android/app/build/outputs/apk/debug/app-debug.apk
```

### Test Installation
```bash
# Install on connected device
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Check installed apps
adb shell pm list packages | grep workschedule
```

## 🚀 Deployment Options

### 1. Direct Installation
- Transfer APK to Android device
- Enable "Unknown Sources" in device settings
- Install APK file

### 2. Google Play Store
- Use release APK
- Follow Google Play Console upload process
- Requires signed APK with proper keystore

### 3. Internal Distribution
- Use Firebase App Distribution
- TestFlight alternatives for Android
- Enterprise distribution methods

## 📝 Development Workflow

### Daily Development
```bash
# 1. Make changes to web app
# 2. Test in browser
npm run dev

# 3. Test on Android device
npm run android:dev  # Live reload enabled

# 4. Build final APK when ready
npm run android:build
```

### Before Release
```bash
# 1. Build and test thoroughly
npm run android:build

# 2. Test APK on multiple devices
# 3. Build release version
npm run android:release

# 4. Test release APK
# 5. Deploy to store or distribute
```

## 🔧 Advanced Configuration

### Custom Build Variants
Edit `android/app/build.gradle` to add custom build types:

```gradle
buildTypes {
    debug {
        applicationIdSuffix ".debug"
        debuggable true
    }
    staging {
        applicationIdSuffix ".staging"
        debuggable true
    }
    release {
        minifyEnabled true
        debuggable false
    }
}
```

### Custom App Icons
Replace icons in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Use Android Studio's Image Asset Studio for automatic generation

### Custom Splash Screen
Replace splash images in:
- `android/app/src/main/res/drawable-*/splash.png`
- Configure in `capacitor.config.ts` SplashScreen plugin

## 📞 Support Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Developer Guide**: https://developer.android.com/guide
- **Gradle Build Tool**: https://gradle.org/guides/
- **Troubleshooting**: https://capacitorjs.com/docs/android/troubleshooting

---

**Last Updated**: December 2024  
**Capacitor Version**: 7.4.0  
**Target Android API**: 34