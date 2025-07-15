# Quick Start: Build APK on Windows

## 🚀 Super Simple Method

### Step 1: Find Your Project
Your project folder should contain these files:
- `package.json`
- `src` folder
- `index.html`
- `capacitor.config.ts`

### Step 2: Open Command Prompt in Project Folder
**Method A: Using File Explorer**
1. Open File Explorer
2. Navigate to your project folder
3. Hold `Shift` and right-click in empty space
4. Select "Open PowerShell window here" or "Open command window here"

**Method B: Using Command Prompt**
1. Press `Win + R`, type `cmd`, press Enter
2. Navigate to your project:
   ```cmd
   cd C:\path\to\your\project
   ```

### Step 3: Run the Setup Script
```cmd
scripts\navigate-and-build.bat
```

This script will:
- ✅ Check if you're in the right directory
- ✅ Find your project automatically if possible
- ✅ Install all required dependencies
- ✅ Build your web app
- ✅ Set up Android platform
- ✅ Build your APK
- ✅ Open Android Studio if needed

## 📱 What You Need Installed

The script will check for these and guide you to install them:

1. **Node.js** - Download from: https://nodejs.org/
2. **Java JDK 11+** - Download from: https://adoptium.net/temurin/releases/
3. **Android Studio** - Download from: https://developer.android.com/studio

## 🔧 Environment Variables

The script will help you set these up:
- `JAVA_HOME`
- `ANDROID_HOME` 
- `CAPACITOR_ANDROID_STUDIO_PATH`

## 📍 Your APK Location

After successful build, find your APK at:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

## 🆘 If Something Goes Wrong

1. **"Not in project directory"** - Make sure you're in the folder with `package.json`
2. **"Java not found"** - Install JDK and restart computer
3. **"Android Studio not found"** - Install Android Studio and set environment variables
4. **Build fails** - Try running the script again, it will resume from where it left off

## 🎯 One-Command Solution

If you're confident everything is installed:
```cmd
scripts\complete-setup-windows.bat
```

---

**Need help?** The scripts will guide you through each step with clear error messages and solutions!