import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.homeinventory.app',
  appName: 'Home Inventory',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.230:3000',
    cleartext: true,
  },
};

export default config;
