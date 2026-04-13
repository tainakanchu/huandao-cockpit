// ============================================
// 環島コックピット - クロスプラットフォーム Storage アダプタ
// ============================================

import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * Web では localStorage、Native では AsyncStorage を使用する
 * クロスプラットフォーム対応の StateStorage アダプタ。
 */
export const crossPlatformStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name) ?? null;
    }
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.getItem(name);
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(name, value);
  },

  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(name);
  },
};
