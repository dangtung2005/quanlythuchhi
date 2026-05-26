import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/formatters';
import NumberPadModal from './NumberPadModal';

export default function EditWalletModal({
  visible,
  onClose,
  onSubmit,
  wallet,
  saving,
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [numberPadVisible, setNumberPadVisible] = useState(false);

  useEffect(() => {
    if (visible && wallet) {
      setName(wallet.name);
      setAmount(String(wallet.amount));
    }
  }, [visible, wallet]);

  async function handleSubmit() {
    const parsedAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!wallet || !name.trim() || Number.isNaN(parsedAmount)) {
      return;
    }

    await onSubmit(wallet.id, {
      name: name.trim(),
      amount: parsedAmount,
    });

    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Chỉnh sửa ví</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose}>
              <Ionicons name="close" size={24} color="#2d241c" />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Tên ví"
            placeholderTextColor="#9c8b79"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.amountField}
            onPress={() => setNumberPadVisible(true)}
          >
            <Text style={amount ? styles.amountText : styles.amountPlaceholder}>
              {amount ? formatCurrency(Number(amount)) : 'Số dư hiện tại'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.cancelButton}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={saving}
            >
              <Text style={styles.submitText}>{saving ? 'Đang lưu...' : 'Nhập'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <NumberPadModal
          visible={numberPadVisible}
          title="Nhập số dư ví"
          value={amount}
          onClose={() => setNumberPadVisible(false)}
          onSubmit={setAmount}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(25, 18, 10, 0.35)', justifyContent: 'flex-end' },
  backdropPressable: { flex: 1 },
  card: {
    backgroundColor: '#fff9f0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#2d241c' },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2d241c',
    marginBottom: 12,
  },
  amountField: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  amountText: {
    fontSize: 15,
    color: '#2d241c',
    fontWeight: '700',
  },
  amountPlaceholder: {
    fontSize: 15,
    color: '#9c8b79',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1e6d8',
  },
  cancelText: {
    color: '#6a5848',
    fontSize: 16,
    fontWeight: '800',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#ee8e34',
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
