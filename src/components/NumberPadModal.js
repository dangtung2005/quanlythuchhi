import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/formatters';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

function NumberPadKey({ value, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  function animateTo(nextValue) {
    Animated.spring(scale, {
      toValue: nextValue,
      speed: 28,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      onPress={() => onPress(value)}
      onPressIn={() => animateTo(0.94)}
      onPressOut={() => animateTo(1)}
      style={styles.keyPressable}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.key,
            pressed ? styles.keyPressed : null,
            { transform: [{ scale }] },
          ]}
        >
          {value === 'back' ? (
            <Ionicons name="backspace-outline" size={24} color="#2d241c" />
          ) : value === 'clear' ? (
            <Text style={styles.clearText}>Xóa</Text>
          ) : (
            <Text style={styles.keyText}>{value}</Text>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

export default function NumberPadModal({
  visible,
  title,
  value,
  onClose,
  onSubmit,
  displayLabel = 'Giá trị đang nhập',
  displayFormatter,
  submitText = 'Nhập',
}) {
  const [draftValue, setDraftValue] = useState('0');
  const valueScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setDraftValue(value && value !== '' ? String(value) : '0');
    }
  }, [value, visible]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(valueScale, {
        toValue: 0.985,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(valueScale, {
        toValue: 1,
        speed: 26,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [draftValue, valueScale]);

  function handleKeyPress(key) {
    if (key === 'clear') {
      setDraftValue('0');
      return;
    }

    if (key === 'back') {
      setDraftValue((current) => {
        const next = current.slice(0, -1);
        return next.length === 0 ? '0' : next;
      });
      return;
    }

    setDraftValue((current) => {
      if (current === '0') {
        return key === '000' ? '0' : key;
      }

      return `${current}${key}`;
    });
  }

  function handleSubmit() {
    onSubmit(draftValue);
    onClose();
  }

  const displayValue = displayFormatter
    ? displayFormatter(draftValue)
    : formatCurrency(Number(draftValue || 0));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              {({ pressed }) => (
                <View style={[styles.closeButton, pressed ? styles.closeButtonPressed : null]}>
                  <Ionicons name="close" size={24} color="#2d241c" />
                </View>
              )}
            </Pressable>
          </View>

          <Animated.View
            style={[
              styles.valueCard,
              { transform: [{ scale: valueScale }] },
            ]}
          >
            <Text style={styles.valueLabel}>{displayLabel}</Text>
            <Text style={styles.valueText}>{displayValue}</Text>
          </Animated.View>

          <View style={styles.grid}>
            {KEYS.map((key) => (
              <NumberPadKey key={key} value={key} onPress={handleKeyPress} />
            ))}
          </View>

          <View style={styles.actionRow}>
            <Pressable onPress={onClose} style={styles.actionPressable}>
              {({ pressed }) => (
                <View style={[styles.cancelButton, pressed ? styles.cancelButtonPressed : null]}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </View>
              )}
            </Pressable>

            <Pressable onPress={handleSubmit} style={styles.actionPressable}>
              {({ pressed }) => (
                <View style={[styles.submitButton, pressed ? styles.submitButtonPressed : null]}>
                  <Text style={styles.submitText}>{submitText}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(25, 18, 10, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#f7f1e4',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2d241c',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3e6',
  },
  closeButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  valueCard: {
    backgroundColor: '#fffaf0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#c9b59f',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  valueLabel: {
    fontSize: 13,
    color: '#8a7863',
    marginBottom: 6,
  },
  valueText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2d241c',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keyPressable: {
    width: '31%',
    marginBottom: 12,
  },
  key: {
    height: 72,
    borderRadius: 20,
    backgroundColor: '#fffaf0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#cebda8',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  keyPressed: {
    backgroundColor: '#fff2e1',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d241c',
  },
  clearText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#c96d27',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionPressable: {
    flex: 1,
  },
  cancelButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8ddd0',
  },
  cancelButtonPressed: {
    backgroundColor: '#ddd0c2',
    transform: [{ scale: 0.98 }],
  },
  cancelText: {
    color: '#6a5848',
    fontSize: 16,
    fontWeight: '800',
  },
  submitButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ee8e34',
  },
  submitButtonPressed: {
    backgroundColor: '#e07d1f',
    transform: [{ scale: 0.98 }],
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
