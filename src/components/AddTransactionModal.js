import React, { useEffect, useMemo, useState } from 'react';
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
import { CATEGORY_PRESETS } from '../data/seedData';
import { formatCurrency, t } from '../utils/formatters';
import {
  resolveSuggestedCategory,
  suggestCategoryKeyFromTitle,
} from '../utils/transactionAssistant';
import NumberPadModal from './NumberPadModal';

function getDefaultCategoryLabel(type) {
  const preset = CATEGORY_PRESETS.find((item) => item.type === type);
  return preset ? preset.label : '';
}

export default function AddTransactionModal({
  visible,
  onClose,
  onSubmit,
  wallets,
  saving,
  defaultType,
  initialTransaction,
}) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [category, setCategory] = useState(getDefaultCategoryLabel(defaultType || 'expense'));
  const [type, setType] = useState(defaultType || 'expense');
  const [numberPadVisible, setNumberPadVisible] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [smartSuggestion, setSmartSuggestion] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialTransaction) {
        setTitle(initialTransaction.title);
        setAmount(String(initialTransaction.amount));
        setNote(initialTransaction.note || '');
        setWalletId(initialTransaction.walletId);
        setType(initialTransaction.type);
        setCategory(initialTransaction.category);
        setCategoryTouched(true);
        setSmartSuggestion(null);
      } else {
        const nextType = defaultType || 'expense';
        setTitle('');
        setAmount('');
        setNote('');
        setWalletId(wallets[0]?.id || '');
        setType(nextType);
        setCategory(getDefaultCategoryLabel(nextType));
        setCategoryTouched(false);
        setSmartSuggestion(null);
      }

      setValidationMessage('');
    }
  }, [defaultType, initialTransaction, visible, wallets]);

  const filteredCategories = useMemo(
    () => CATEGORY_PRESETS.filter((item) => item.type === type),
    [type]
  );
  const selectedPreset = CATEGORY_PRESETS.find((item) => item.label === category);

  useEffect(() => {
    if (!visible || categoryTouched || initialTransaction) {
      return;
    }

    const suggestionKey = suggestCategoryKeyFromTitle(title, type);
    const suggestion = resolveSuggestedCategory(filteredCategories, suggestionKey);
    const hasMatchingPreset = filteredCategories.some((item) => item.label === suggestion);

    if (suggestion && hasMatchingPreset) {
      setCategory(suggestion);
      setSmartSuggestion(suggestion);
      return;
    }

    setSmartSuggestion(null);

    if (!title.trim()) {
      setCategory(getDefaultCategoryLabel(type));
    }
  }, [categoryTouched, filteredCategories, initialTransaction, title, type, visible]);

  function handleTypeChange(nextType) {
    setType(nextType);
    setCategoryTouched(false);
    setCategory(getDefaultCategoryLabel(nextType));
  }

  async function handleSubmit() {
    const parsedAmount = Number(amount.replace(/[^0-9]/g, ''));

    if (!title.trim()) {
      setValidationMessage(t('validation_title'));
      return;
    }

    if (!parsedAmount) {
      setValidationMessage(t('validation_amount'));
      return;
    }

    if (!walletId || !selectedPreset) {
      setValidationMessage(t('validation_wallet_category'));
      return;
    }

    setValidationMessage('');

    await onSubmit({
      title: title.trim(),
      amount: parsedAmount,
      note: note.trim(),
      walletId,
      category,
      categoryKey: selectedPreset.key,
      type,
      icon: selectedPreset.icon,
      tint: selectedPreset.tint,
    });

    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {initialTransaction ? t('edit_transaction') : t('new_smart_transaction')}
            </Text>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose}>
              <Ionicons name="close" size={24} color="#2d241c" />
            </TouchableOpacity>
          </View>

          <View style={styles.segmented}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.segmentButton, type === 'expense' && styles.segmentActive]}
              onPress={() => handleTypeChange('expense')}
            >
              <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextActive]}>
                {t('expense')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.segmentButton, type === 'income' && styles.segmentActive]}
              onPress={() => handleTypeChange('income')}
            >
              <Text style={[styles.segmentText, type === 'income' && styles.segmentTextActive]}>
                {t('income')}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder={t('transaction_title')}
            placeholderTextColor="#9c8b79"
            style={styles.input}
            value={title}
            onChangeText={(nextValue) => {
              setTitle(nextValue);
              setValidationMessage('');
            }}
          />

          {smartSuggestion ? (
            <View style={styles.suggestionCard}>
                <Ionicons name="sparkles-outline" size={16} color="#ee8e34" />
                <Text style={styles.suggestionText}>
                {t('smart_suggest', { category: smartSuggestion })}
                </Text>
              </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.amountField}
            onPress={() => setNumberPadVisible(true)}
          >
            <Text style={amount ? styles.amountText : styles.amountPlaceholder}>
              {amount ? formatCurrency(Number(amount)) : t('amount')}
            </Text>
          </TouchableOpacity>

          <TextInput
            placeholder={t('note')}
            placeholderTextColor="#9c8b79"
            style={[styles.input, styles.note]}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <Text style={styles.label}>{t('wallet')}</Text>
          <View style={styles.wrap}>
            {wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                activeOpacity={0.85}
                style={[styles.chip, walletId === wallet.id && styles.chipActive]}
                onPress={() => setWalletId(wallet.id)}
              >
                <Text style={[styles.chipText, walletId === wallet.id && styles.chipTextActive]}>
                  {wallet.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('category')}</Text>
          <View style={styles.wrap}>
            {filteredCategories.map((item) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.85}
                style={[styles.chip, category === item.label && styles.chipActive]}
                onPress={() => {
                  setCategory(item.label);
                  setCategoryTouched(true);
                  setSmartSuggestion(item.label === smartSuggestion ? smartSuggestion : null);
                }}
              >
                <Text style={[styles.chipText, category === item.label && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {validationMessage ? <Text style={styles.validationText}>{validationMessage}</Text> : null}

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text style={styles.submitText}>
              {saving
                ? 'Saving...'
                : initialTransaction
                  ? t('update_transaction')
                  : t('create_transaction')}
            </Text>
          </TouchableOpacity>
        </View>

        <NumberPadModal
          visible={numberPadVisible}
          title={t('input_amount')}
          value={amount}
          onClose={() => setNumberPadVisible(false)}
          onSubmit={setAmount}
          displayLabel={t('live_amount')}
          submitText={t('use_amount')}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '800', color: '#2d241c' },
  segmented: { flexDirection: 'row', backgroundColor: '#f3e8d9', borderRadius: 16, padding: 4, marginBottom: 14 },
  segmentButton: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#ee8e34' },
  segmentText: { color: '#7c6959', fontWeight: '700' },
  segmentTextActive: { color: '#ffffff' },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2d241c',
    marginBottom: 12,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3df',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  suggestionText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 13,
    color: '#8f6132',
    fontWeight: '700',
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
  note: { minHeight: 88, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: '700', color: '#665444', marginTop: 4, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: '#f3e8d9' },
  chipActive: { backgroundColor: '#ee8e34' },
  chipText: { color: '#6f5d4d', fontWeight: '700' },
  chipTextActive: { color: '#ffffff' },
  validationText: {
    color: '#c6562f',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: '#ee8e34',
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
