import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useI18nStore } from '@/lib/i18n';

/**
 * 言語切り替えボタン
 * タップすると ja <-> zh-TW を切り替える
 */
export default function LanguageSwitcher() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  const toggle = () => {
    setLocale(locale === 'ja' ? 'zh-TW' : 'ja');
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={toggle}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>
        {locale === 'ja' ? '繁中' : '日本語'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 8,
  },
  text: {
    color: CyclingColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
