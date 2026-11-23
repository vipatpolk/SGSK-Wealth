import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sgsk.wealth.mobile',
  appName: 'SGSK Wealth',
  webDir: 'dist/sgsk-wealth-mobile/browser',
  server: {
    androidScheme: 'http',
    iosScheme: 'capacitor',
    cleartext: true,
    allowNavigation: ['10.0.2.2', '127.0.0.1', 'localhost'],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0B1220',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#0B1220',
    },
  },
};

export default config;
