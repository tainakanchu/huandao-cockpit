import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.confirmBackdrop}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmBody}>{message}</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={[styles.confirmBtn, styles.confirmBtnCancel]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmBtnCancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                styles.confirmBtnOk,
                destructive && styles.confirmBtnDestructive,
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmBtnOkText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type Confirmation = Omit<ConfirmDialogProps, 'visible' | 'onCancel'>;

export function useConfirmDialog() {
  const [pending, setPending] = useState<Confirmation | null>(null);
  const dialog = pending && (
    <ConfirmDialog
      {...pending}
      visible
      onCancel={() => setPending(null)}
      onConfirm={() => {
        setPending(null);
        pending.onConfirm();
      }}
    />
  );
  return { confirm: setPending, dialog };
}

const styles = StyleSheet.create({
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 6,
  },
  confirmBody: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnCancel: {
    backgroundColor: CyclingColors.background,
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
  },
  confirmBtnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.textSecondary,
  },
  confirmBtnOk: {
    backgroundColor: CyclingColors.primary,
  },
  confirmBtnDestructive: {
    backgroundColor: CyclingColors.critical,
  },
  confirmBtnOkText: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.white,
  },
});
