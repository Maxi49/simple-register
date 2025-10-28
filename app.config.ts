import 'dotenv/config';

export default {
  expo: {
    name: 'Registrador Cooperativa Hogar de Cristo',
    slug: 'simple-register',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'simpleregister',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    jsEngine: 'hermes',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.frame.gestorcolaborativa',
      infoPlist: { ITSAppUsesNonExemptEncryption: false },
    },
    android: {
      package: 'com.frame.gestorcolaborativa',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      jsEngine: 'hermes',
      versionCode: 2,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      ['expo-splash-screen', { image: './assets/images/splash-icon.png', imageWidth: 200, resizeMode: 'contain', backgroundColor: '#ffffff', dark: { backgroundColor: '#000000' } }],
      'expo-font',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
    extra: {
      router: {},
      // 👇 mantené tus envs sin problema
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    runtimeVersion: { policy: 'appVersion' },
  },
};

