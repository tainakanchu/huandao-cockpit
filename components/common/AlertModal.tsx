import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useT } from '@/lib/i18n';
import type { AdvisoryCard } from '@/lib/types';

type Props = {
  visible: boolean;
  card: AdvisoryCard | null;
  onDismiss: () => void;
  onAlternateGoal?: () => void;
};

const typeIcons: Record<string, string> = {
  wind: '💨',
  supply: '🏪',
  climb: '⛰️',
  heat: '🌡️',
  rain: '🌧️',
  time: '⏰',
  danger: '⚠️',
};

export default function AlertModal({
  visible,
  card,
  onDismiss,
  onAlternateGoal,
}: Props) {
  const t = useT();
  if (!card) return null;

  const severityColor = CyclingColors.severity[card.severity];
  const severityBg = CyclingColors.severity[`${card.severity}Bg` as keyof typeof CyclingColors.severity] as string;
  const icon = typeIcons[card.type] ?? '⚠️';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { borderTopColor: severityColor }]}>
          <View style={[styles.iconRow, { backgroundColor: severityBg }]}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.severity, { color: severityColor }]}>
              {card.severity.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.title}>{card.title}</Text>
          <Text style={styles.body}>{card.body}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: severityColor }]}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{t.confirm}</Text>
            </TouchableOpacity>

            {onAlternateGoal && card.severity === 'critical' && (
              <TouchableOpacity
                style={[styles.button, styles.altButton]}
                onPress={onAlternateGoal}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.altButtonText]}>
                  {t.changeGoal}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    borderTopWidth: 4,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 24,
  },
  severity: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: CyclingColors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: CyclingColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  altButton: {
    backgroundColor: CyclingColors.card,
    borderWidth: 2,
    borderColor: CyclingColors.critical,
  },
  altButtonText: {
    color: CyclingColors.critical,
  },
});
