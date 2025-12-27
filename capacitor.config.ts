import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.antigravity.stockapp',
  appName: 'StockApp',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://stock-research-tool.vercel.app/', // Points to dev server from Android Emulator
    cleartext: true              // Allows HTTP for development
  }
};

export default config;
