import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatRelativeDate, formatSignedAmount } from '../utils/formatters';
import SwipeableRow from './SwipeableRow';
import { THEMES } from '../styles/theme';

export default function TransactionItem({ item, walletName, onPress, onDelete, theme = THEMES.light }) {
  const styles = createStyles(theme);
  const content = (
    <TouchableOpacity activeOpacity={0.85} style={styles.item} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: `${item.tint}18` }]}>
        <MaterialCommunityIcons name={item.icon} size={22} color={item.tint} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.category} • {walletName} • {formatRelativeDate(item.createdAt)}
        </Text>
      </View>

      <Text style={[styles.amount, item.type === 'income' ? styles.income : styles.expense]}>
        {formatSignedAmount(item.type, item.amount)}
      </Text>
    </TouchableOpacity>
  );

  if (onDelete) {
    return <SwipeableRow onDelete={onDelete}>{content}</SwipeableRow>;
  }

  return content;
}

function createStyles(theme) {
  return StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSoft,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
  meta: { fontSize: 13, color: theme.textMuted, lineHeight: 18 },
  amount: { fontSize: 15, fontWeight: '800', marginLeft: 8 },
  income: { color: theme.success },
  expense: { color: theme.danger },
});
}
