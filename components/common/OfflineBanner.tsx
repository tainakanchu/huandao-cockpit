import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { CyclingColors } from '@/constants/Colors';

/**
 * Thin top banner shown on Web when navigator.onLine is false.
 * Native builds return null (iOS/Android handle offline via their own shells).
 */
export default function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof navigator === 'undefined') return;

    const handler = () => setOnline(navigator.onLine);
    handler();

    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, []);

  if (Platform.OS !== 'web' || online) return null;

  return (
    <View style={styles.banner} pointerEvents="none">
      <Text style={styles.text}>📡 オフライン — キャッシュ済みデータで表示中</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    backgroundColor: CyclingColors.severity.warning,
    zIndex: 9999,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: CyclingColors.white,
  },
});
