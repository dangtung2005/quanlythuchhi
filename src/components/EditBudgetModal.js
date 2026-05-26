import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/formatters';
import NumberPadModal from './NumberPadModal';

export default function EditBudgetModal({
  visible,
  onClose,
  onSubmit,
  budget,
  saving,
  isCreateMode,
}) {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [numberPadVisible, setNumberPadVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      if (budget) {
        setCategory(budget.category);
        setLimit(String(budget.limit));
      } else {
        setCategory('');
        setLimit('');
      }
    }
  }, [visible, budget]);

  async function handleSubmit() {
    const parsedLimit = Number(limit);
    if (!category.trim() || Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      return;
    }

    if (isCreateMode) {
      await onSubmit({
        category: category.trim(),
        limit: parsedLimit,
      });
    } else {
      await onSubmit(budget.id, {
        category: category.trim(),
        limit: parsedLimit,
      });
    }
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isCreateMode ? 'Thêm mục ngân sách' : 'Chỉnh sửa ngân sách'}
            </Text>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose}>
              <Ionicons name="close" size={24} color="#2d241c" />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Tên ngân sách"
            placeholderTextColor="#9c8b79"
            style={styles.input}
            value={category}
            onChangeText={setCategory}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.amountField}
            onPress={() => setNumberPadVisible(true)}
          >
            <Text style={limit ? styles.amountText : styles.amountPlaceholder}>
              {limit ? formatCurrency(Number(limit)) : 'Hạn mức ngân sách'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.cancelButton} onPress={onClose}>
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
          title="Nhập hạn mức ngân sách"
          value={limit}
          onClose={() => setNumberPadVisible(false)}
          onSubmit={setLimit}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(25, 18, 10, 0.35)', justifyContent: 'flex-end' },
  backdropPressable: { flex: 1 },
  card: { backgroundColor: '#fff9f0', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '800', color: '#2d241c' },
  input: { backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#2d241c', marginBottom: 12 },
  amountField: { backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 12 },
  amountText: { fontSize: 15, color: '#2d241c', fontWeight: '700' },
  amountPlaceholder: { fontSize: 15, color: '#9c8b79' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelButton: { flex: 1, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1e6d8' },
  cancelText: { color: '#6a5848', fontSize: 16, fontWeight: '800' },
  submitButton: { flex: 1, backgroundColor: '#ee8e34', height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
