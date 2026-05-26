import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createAppStyles } from '../styles/appStyles';
import { formatCurrency, t } from '../utils/formatters';

export default function WalletsScreen({ data, theme, onEditWallet }) {
  const appStyles = createAppStyles(theme);
  const styles = createStyles(theme);
  const totalBalance = data.wallets.reduce((sum, wallet) => sum + wallet.amount, 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={appStyles.scrollContent}>
      <Text style={appStyles.screenTitle}>{t('wallets_title')}</Text>
      <Text style={appStyles.screenSubtitle}>{t('wallets_subtitle')}</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>{t('current_assets')}</Text>
        <Text style={styles.heroAmount}>{formatCurrency(totalBalance)}</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaValue}>{data.wallets.length}</Text>
            <Text style={styles.heroMetaLabel}>{t('wallet_count')}</Text>
          </View>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaValue}>{data.settings?.currency || 'VND'}</Text>
            <Text style={styles.heroMetaLabel}>{t('currency')}</Text>
          </View>
        </View>
      </View>

      {data.wallets.map((wallet) => (
        <TouchableOpacity
          key={wallet.id}
          activeOpacity={0.85}
          style={styles.walletCard}
          onPress={() => onEditWallet(wallet)}
        >
          <View style={[styles.iconWrap, { backgroundColor: wallet.color }]}>
            <Ionicons name="wallet-outline" size={22} color="#ffffff" />
          </View>
          <View style={styles.content}>
            <Text style={styles.name}>{wallet.name}</Text>
            <Text style={styles.hint}>{t('synced_in_app')}</Text>
          </View>
          <View style={styles.amountWrap}>
            <Text style={styles.amount}>{formatCurrency(wallet.amount)}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
  heroCard: {
    backgroundColor: theme.hero,
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
  },
  heroLabel: { color: '#dff8eb', fontSize: 14, marginBottom: 8 },
  heroAmount: { color: '#ffffff', fontSize: 30, fontWeight: '800', marginBottom: 14 },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroMetaItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  heroMetaValue: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  heroMetaLabel: { color: '#dff8eb', fontSize: 12, marginTop: 4 },
  walletCard: {
    backgroundColor: theme.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 4 },
  hint: { fontSize: 13, color: theme.textMuted },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  amount: { fontSize: 15, fontWeight: '800', color: theme.text, marginRight: 4 },
});
}
