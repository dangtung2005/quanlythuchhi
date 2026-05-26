import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SectionHeader from '../components/SectionHeader';
import TransactionItem from '../components/TransactionItem';
import SearchBar from '../components/SearchBar';
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

function BudgetRow({ budget, styles, theme }) {
  const progress = Math.min(budget.progress, 1);
  const toneColor = budget.isOverLimit ? theme.danger : budget.isNearLimit ? theme.warning : theme.accent;

  return (
    <View style={styles.budgetRow}>
      <View style={styles.budgetRowHeader}>
        <Text style={styles.budgetName}>{budget.category}</Text>
        <Text style={styles.budgetValue}>
          {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
        </Text>
      </View>
      <View style={styles.budgetTrack}>
        <View style={[styles.budgetFill, { width: `${progress * 100}%`, backgroundColor: toneColor }]} />
      </View>
      <Text style={styles.budgetHint}>
        {budget.isOverLimit
          ? t('over_limit_short')
          : budget.isNearLimit
            ? t('near_limit_short')
            : t('remaining_amount', { amount: formatCurrency(budget.remaining) })}
      </Text>
    </View>
  );
}

export default function HomeScreen({
  data,
  theme,
  onQuickAction,
  onOpenReports,
  onEditTransaction,
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
  const visibleBudgets = insights.budgetSnapshot.slice(0, 3);
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
    const query = searchQuery.toLowerCase();
    return insights.monthTransactions.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        (t.note && t.note.toLowerCase().includes(query))
    );
  }, [searchQuery, recentTransactions, insights.monthTransactions]);



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

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          theme={theme}
        />

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
              <Text style={styles.heroBadgeValue}>{insights.budgetSnapshot.length}</Text>
              <Text style={styles.heroBadgeLabel}>{t('active_budgets')}</Text>
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

        <View style={appStyles.panelCard}>
          <SectionHeader
            title={t('budget_overview')}
            actionText={t('open_reports')}
            onActionPress={onOpenReports}
            theme={theme}
          />
          {visibleBudgets.length === 0 ? (
            <Text style={styles.emptyText}>{t('no_expense_month')}</Text>
          ) : (
            visibleBudgets.map((budget) => (
              <BudgetRow key={budget.id} budget={budget} styles={styles} theme={theme} />
            ))
          )}
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.smartCard} onPress={onOpenReports}>
          <View style={styles.smartIconWrap}>
            <Ionicons name="sparkles-outline" size={20} color={theme.accentStrong} />
          </View>
          <View style={styles.smartCopy}>
            <Text style={styles.smartTitle}>{t('smart_corner')}</Text>
            <Text style={styles.smartDescription}>{t('smart_corner_desc')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.accentStrong} />
        </TouchableOpacity>

        <View style={appStyles.panelCard}>
          <SectionHeader
            title={searchQuery ? t('search_results_count', { count: filteredTransactions.length }) : t('recent_transactions')}
            theme={theme}
          />
          {filteredTransactions.length === 0 ? (
            <Text style={styles.emptyText}>{searchQuery ? t('search_no_results') : t('no_transaction_day')}</Text>
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
  budgetRow: {
    marginBottom: 14,
  },
  budgetRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  budgetValue: {
    fontSize: 12,
    color: theme.textMuted,
    marginLeft: 12,
  },
  budgetTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.surfaceMuted,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 999,
  },
  budgetHint: {
    marginTop: 6,
    fontSize: 12,
    color: theme.textMuted,
  },
  smartCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smartIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  smartCopy: {
    flex: 1,
    paddingRight: 12,
  },
  smartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  smartDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.textMuted,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textMuted,
  },
});
}
