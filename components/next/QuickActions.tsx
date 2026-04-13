import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';

type Props = {
  onSupplyDone: () => void;
  onRest: () => void;
  onNote: () => void;
  onChangeGoal: () => void;
};

type ActionItem = {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
};

export default function QuickActions({
  onSupplyDone,
  onRest,
  onNote,
  onChangeGoal,
}: Props) {
  const actions: ActionItem[] = [
    {
      icon: '🏪',
      label: '補給済み',
      onPress: onSupplyDone,
      color: CyclingColors.success,
    },
    {
      icon: '☕',
      label: '休憩',
      onPress: onRest,
      color: CyclingColors.primary,
    },
    {
      icon: '📝',
      label: '体調メモ',
      onPress: onNote,
      color: CyclingColors.accent,
    },
    {
      icon: '🎯',
      label: 'ゴール変更',
      onPress: onChangeGoal,
      color: CyclingColors.critical,
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.button, { borderColor: action.color }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{action.icon}</Text>
          <Text style={[styles.label, { color: action.color }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: CyclingColors.card,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
