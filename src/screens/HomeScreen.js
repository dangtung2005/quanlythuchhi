import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SectionHeader from '../components/SectionHeader';
import SearchBar from '../components/SearchBar';
import TransactionItem from '../components/TransactionItem';
import { QUICK_ACTIONS } from '../data/seedData';
import { createAppStyles } from '../styles/appStyles';
import { analyzeFinance } from '../utils/smartInsights';
import { formatCurrency, formatDateBadge, t } from '../utils/formatters';

function QuickActionButton({ item, onPress, styles, theme }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <MaterialCommunityIcons name={item.icon} size={24} color={theme.accentStrong} />
      </View>
      <Text style={styles.quickActionText}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function WalletCard({ wallet, styles }) {
  return (
    <View style={styles.walletCard}>
      <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
        <Ionicons name="wallet-outline" size={18} color="#ffffff" />
      </View>
      <Text style={styles.walletCardName} numberOfLines={1}>
        {wallet.name}
      </Text>
      <Text style={styles.walletCardAmount} numberOfLines={1}>
        {formatCurrency(wallet.amount)}
      </Text>
    </View>
  );
}

function SmartSpotlight({ insights, theme, styles, onOpenReports, onOpenTransactionGroup, selectedDate }) {
  const topPressureBudget = insights.overspentBudgets[0] || insights.warningBudgets[0] || null;
  const forecastValue =
    insights.forecast.status === 'risk'
      ? `-${formatCurrency(Math.abs(insights.projectedSavings))}`
      : formatCurrency(Math.max(insights.projectedSavings, 0));

  return (
    <View style={styles.smartPanel}>
      <View style={styles.smartPanelHeader}>
        <View>
          <Text style={styles.smartEyebrow}>{t('smart_corner')}</Text>
          <Text style={styles.smartHeroTitle}>Bức tranh tài chính hôm nay</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85} style={styles.smartScoreBadge} onPress={onOpenReports}>
          <Text style={styles.smartScoreValue}>{insights.score.value}</Text>
          <Text style={styles.smartScoreLabel}>Điểm</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.smartStatsRow}>
        <View style={styles.smartStatCard}>
          <Text style={styles.smartStatLabel}>Dự báo cuối tháng</Text>
          <Text
            style={[
              styles.smartStatValue,
              insights.forecast.status === 'risk' ? styles.smartStatDanger : styles.smartStatSafe,
            ]}
          >
            {forecastValue}
          </Text>
        </View>
        <View style={styles.smartStatCard}>
          <Text style={styles.smartStatLabel}>Chi bình quân/ngày</Text>
          <Text style={styles.smartStatValue}>{formatCurrency(insights.averageDailyExpense)}</Text>
        </View>
      </View>

      <View style={styles.smartHighlightCard}>
        <View style={styles.smartHighlightIcon}>
          <Ionicons name="sparkles-outline" size={20} color={theme.accentStrong} />
        </View>
        <View style={styles.smartHighlightCopy}>
          <Text style={styles.smartHighlightTitle}>
            {insights.anomaly?.title || insights.score.label}
          </Text>
          <Text style={styles.smartHighlightText}>
            {insights.anomaly?.message || t('smart_corner_desc')}
          </Text>
        </View>
      </View>

      <View style={styles.smartPillRow}>
        {insights.topCategory ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.smartPill}
            onPress={() =>
              onOpenTransactionGroup({
                title: `${insights.topCategory.category} • ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`,
                transactions: insights.monthTransactions.filter(
                  (item) => item.category === insights.topCategory.category
                ),
              })
            }
          >
            <Text style={styles.smartPillLabel}>Chi nhiều nhất</Text>
            <Text style={styles.smartPillValue}>{insights.topCategory.category}</Text>
          </TouchableOpacity>
        ) : null}

        {topPressureBudget ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.smartPill}
            onPress={() => onOpenReports()}
          >
            <Text style={styles.smartPillLabel}>Ngân sách áp lực</Text>
            <Text style={styles.smartPillValue}>{topPressureBudget.category}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.smartTipsWrap}>
        <Text style={styles.smartTipsTitle}>{t('next_moves')}</Text>
        {insights.smartTips.slice(0, 2).map((tip) => (
          <View key={tip} style={styles.smartTipRow}>
            <Ionicons name="flash-outline" size={16} color={theme.warning} />
            <Text style={styles.smartTipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen({
  data,
  theme,
  onQuickAction,
  onOpenReports,
  onEditTransaction,
  onOpenTransactionGroup,
  selectedDate,
  onOpenDateFilter,
  onOpenNotifications,
  notificationCount,
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const appStyles = createAppStyles(theme);
  const styles = createStyles(theme);
  const insights = analyzeFinance(data, selectedDate);
  const walletMap = Object.fromEntries(data.wallets.map((wallet) => [wallet.id, wallet.name]));
  const recentTransactions = insights.monthTransactions.slice(0, 5);
  const quickActions = useMemo(
    () =>
      QUICK_ACTIONS.map((item) => ({
        ...item,
        label:
          item.key === 'add_income'
            ? t('quick_add_income')
            : item.key === 'add_expense'
              ? t('quick_add_expense')
              : item.key === 'budget'
                ? t('quick_budget')
                : t('quick_wallets'),
      })),
    [data.settings.language]
  );

  const headlineMessage =
    insights.forecast.status === 'risk'
      ? t('forecast_overspend', {
          amount: formatCurrency(Math.abs(insights.projectedSavings)),
        })
      : t('forecast_surplus', {
          amount: formatCurrency(Math.max(insights.projectedSavings, 0)),
        });

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return recentTransactions;
    const query = searchQuery.trim().toLowerCase();
    return data.transactions.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        walletMap[item.walletId]?.toLowerCase().includes(query) ||
        (item.note && item.note.toLowerCase().includes(query))
    );
  }, [data.transactions, recentTransactions, searchQuery, walletMap]);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={appStyles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>{t('greeting', { name: data.user.name })}</Text>
            <Text style={styles.headerTitle}>{t('home_title')}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.notificationBadge}
            onPress={onOpenNotifications}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.iconColor} />
            {notificationCount > 0 ? (
              <View style={styles.notificationCountBadge}>
                <Text style={styles.notificationCountText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} theme={theme} />

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>{t('total_balance')}</Text>
              <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(insights.totalBalance)}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} style={styles.dateChip} onPress={onOpenDateFilter}>
              <Ionicons name="calendar-outline" size={14} color="#ffffff" />
              <Text style={styles.dateChipText}>{formatDateBadge(selectedDate)}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heroMessage}>{headlineMessage}</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>{t('income_mtd')}</Text>
              <Text style={[styles.heroStatValue, { color: '#dfffe9' }]}>
                {formatCurrency(insights.monthIncome)}
              </Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>{t('expense_mtd')}</Text>
              <Text style={[styles.heroStatValue, { color: '#fff3cf' }]}>
                {formatCurrency(insights.monthExpense)}
              </Text>
            </View>
          </View>

          <View style={styles.heroFooterRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeValue}>{data.wallets.length}</Text>
              <Text style={styles.heroBadgeLabel}>{t('total_wallets')}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeValue}>{insights.score.value}</Text>
              <Text style={styles.heroBadgeLabel}>Điểm thông minh</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActionGrid}>
          {quickActions.map((item) => (
            <QuickActionButton
              key={item.key}
              item={item}
              onPress={() => onQuickAction(item)}
              styles={styles}
              theme={theme}
            />
          ))}
        </View>

        <View style={appStyles.panelCard}>
          <SectionHeader
            title={t('wallet_stack')}
            actionText={t('open_reports')}
            onActionPress={onOpenReports}
            theme={theme}
          />
          <View style={styles.walletGrid}>
            {data.wallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} styles={styles} />
            ))}
          </View>
        </View>

        <SmartSpotlight
          insights={insights}
          theme={theme}
          styles={styles}
          onOpenReports={onOpenReports}
          onOpenTransactionGroup={onOpenTransactionGroup}
          selectedDate={selectedDate}
        />

        <View style={appStyles.panelCard}>
          <SectionHeader
            title={
              searchQuery
                ? t('search_results_count', { count: filteredTransactions.length })
                : t('recent_transactions')
            }
            theme={theme}
          />
          {filteredTransactions.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery ? t('search_no_results') : t('no_transaction_day')}
            </Text>
          ) : (
            filteredTransactions.map((item) => (
              <TransactionItem
                key={item.id}
                item={item}
                walletName={walletMap[item.walletId]}
                onPress={() => onEditTransaction(item)}
                theme={theme}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    headerCopy: {
      flex: 1,
      paddingRight: 12,
    },
    greeting: {
      fontSize: 14,
      color: theme.textMuted,
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      flexShrink: 1,
    },
    notificationBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.iconSurface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      flexShrink: 0,
    },
    notificationCountBadge: {
      position: 'absolute',
      top: -3,
      right: -2,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 5,
      borderRadius: 10,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.background,
    },
    notificationCountText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '800',
    },
    heroCard: {
      backgroundColor: theme.hero,
      borderRadius: 28,
      padding: 20,
      marginBottom: 18,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    heroLabel: {
      color: '#dff8eb',
      fontSize: 14,
      marginBottom: 8,
    },
    heroAmount: {
      color: '#ffffff',
      fontSize: 31,
      fontWeight: '800',
      maxWidth: 240,
    },
    dateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.18)',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 999,
    },
    dateChipText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 6,
    },
    heroMessage: {
      color: '#ecfff5',
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 14,
    },
    heroStatsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    heroStatCard: {
      flex: 1,
      backgroundColor: theme.heroOverlay,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    heroStatLabel: {
      color: '#dff8eb',
      fontSize: 12,
      marginBottom: 6,
    },
    heroStatValue: {
      fontSize: 16,
      fontWeight: '800',
    },
    heroFooterRow: {
      flexDirection: 'row',
      gap: 10,
    },
    heroBadge: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingVertical: 10,
      alignItems: 'center',
    },
    heroBadgeValue: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    heroBadgeLabel: {
      marginTop: 2,
      fontSize: 12,
      color: theme.textMuted,
    },
    quickActionGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    quickAction: {
      width: '23%',
      alignItems: 'center',
    },
    quickActionIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    quickActionText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    walletGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
    },
    walletCard: {
      width: '48%',
      backgroundColor: theme.surfaceAlt,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.borderSoft,
    },
    walletIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    walletCardName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    walletCardAmount: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    smartPanel: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      marginBottom: 18,
    },
    smartPanelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    smartEyebrow: {
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      color: theme.textMuted,
      marginBottom: 6,
    },
    smartHeroTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.text,
    },
    smartScoreBadge: {
      minWidth: 76,
      borderRadius: 22,
      backgroundColor: theme.surfaceAlt,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderSoft,
    },
    smartScoreValue: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.accentStrong,
    },
    smartScoreLabel: {
      fontSize: 11,
      color: theme.textMuted,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    smartStatsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    smartStatCard: {
      flex: 1,
      backgroundColor: theme.surfaceAlt,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.borderSoft,
      padding: 14,
    },
    smartStatLabel: {
      color: theme.textMuted,
      fontSize: 12,
      marginBottom: 6,
    },
    smartStatValue: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '800',
    },
    smartStatDanger: {
      color: theme.danger,
    },
    smartStatSafe: {
      color: theme.success,
    },
    smartHighlightCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.accentSoft,
      borderRadius: 22,
      padding: 14,
      marginBottom: 12,
    },
    smartHighlightIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    smartHighlightCopy: {
      flex: 1,
    },
    smartHighlightTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 4,
    },
    smartHighlightText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    smartPillRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    smartPill: {
      flex: 1,
      backgroundColor: theme.surfaceAlt,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderSoft,
      padding: 14,
    },
    smartPillLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 5,
    },
    smartPillValue: {
      fontSize: 15,
      color: theme.text,
      fontWeight: '800',
    },
    smartTipsWrap: {
      borderTopWidth: 1,
      borderTopColor: theme.borderSoft,
      paddingTop: 14,
    },
    smartTipsTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 10,
    },
    smartTipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    smartTipText: {
      flex: 1,
      marginLeft: 8,
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textMuted,
    },
  });
}
