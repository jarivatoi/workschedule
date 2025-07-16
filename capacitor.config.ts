import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.narayya.workschedule',
  appName: 'Work Schedule',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#6366f1",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      useDialog: false
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#6366f1"
    },
    Keyboard: {
      resize: "body",
      style: "light",
      resizeOnFullScreen: true
    }
  },
  android: {
    buildOptions: {
      releaseType: "APK"
    }
  }
};

export default config;