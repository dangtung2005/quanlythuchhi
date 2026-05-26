import React, { useEffect, useState } from 'react';
import {
  Alert,
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

const WALLET_COLORS = ['#ee8e34', '#4b7bec', '#31a66a', '#9b59b6', '#e17055', '#16a085'];

export default function EditWalletModal({
  visible,
  onClose,
  onSubmit,
  onDelete,
  wallet,
  saving,
  isCreateMode = false,
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [color, setColor] = useState(WALLET_COLORS[0]);
  const [numberPadVisible, setNumberPadVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (wallet) {
      setName(wallet.name);
      setAmount(String(wallet.amount));
      setColor(wallet.color || WALLET_COLORS[0]);
      return;
    }

    setName('');
    setAmount('');
    setColor(WALLET_COLORS[0]);
  }, [visible, wallet]);

  async function handleSubmit() {
    const parsedAmount = Number(String(amount).replace(/[^0-9]/g, ''));

    if (!name.trim() || Number.isNaN(parsedAmount)) {
      return;
    }

    if (isCreateMode) {
      await onSubmit({
        name: name.trim(),
        amount: parsedAmount,
        color,
      });
    } else if (wallet) {
      await onSubmit(wallet.id, {
        name: name.trim(),
        amount: parsedAmount,
        color,
      });
    }

    onClose();
  }

  function handleDelete() {
    if (!wallet || !onDelete) {
      return;
    }

    Alert.alert(
      'Xóa ví',
      'Ví đang có giao dịch sẽ không thể xóa. Bạn có muốn xóa ví này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(wallet.id);
              onClose();
            } catch (error) {
              const message =
                error?.message === 'WALLET_IN_USE'
                  ? 'Ví này đang được dùng trong giao dịch, hãy chuyển hoặc xóa giao dịch trước.'
                  : String(error?.message || error);
              Alert.alert('Không thể xóa ví', message);
            }
          },
        },
      ]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{isCreateMode ? 'Thêm ví mới' : 'Chỉnh sửa ví'}</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose}>
              <Ionicons name="close" size={24} color="#2d241c" />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Tên ví hoặc tài khoản"
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

          <Text style={styles.label}>Màu đại diện</Text>
          <View style={styles.colorRow}>
            {WALLET_COLORS.map((item) => (
              <TouchableOpacity
                key={item}
                activeOpacity={0.85}
                style={[
                  styles.colorDot,
                  { backgroundColor: item },
                  color === item && styles.colorDotActive,
                ]}
                onPress={() => setColor(item)}
              >
                {color === item ? <Ionicons name="checkmark" size={18} color="#ffffff" /> : null}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionRow}>
            {!isCreateMode ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={saving}
              >
                <Text style={styles.deleteText}>Xóa</Text>
              </TouchableOpacity>
            ) : null}

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
              <Text style={styles.submitText}>{saving ? 'Đang lưu...' : isCreateMode ? 'Thêm' : 'Lưu'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <NumberPadModal
          visible={numberPadVisible}
          title={isCreateMode ? 'Nhập số dư ví' : 'Nhập số dư hiện tại'}
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
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#665444',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotActive: {
    borderWidth: 2,
    borderColor: '#2d241c',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  deleteButton: {
    minWidth: 76,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8ddd6',
  },
  deleteText: {
    color: '#bc5332',
    fontSize: 16,
    fontWeight: '800',
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
