import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createAppStyles } from '../styles/appStyles';
import { analyzeFinance } from '../utils/smartInsights';
import { formatCurrency, formatDateBadge, t } from '../utils/formatters';

function StatCard({ label, value, hint, styles, valueStyle }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueStyle]}>{value}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export default function SmartScreen({
  data,
  theme,
  selectedDate,
  onOpenDateFilter,
  onOpenReports,
  onOpenTransactionGroup,
}) {
  const appStyles = createAppStyles(theme);
  const styles = createStyles(theme);
  const insights = analyzeFinance(data, selectedDate);
  const topPressureBudget = insights.overspentBudgets[0] || insights.warningBudgets[0] || null;
  const forecastValue =
    insights.forecast.status === 'risk'
      ? `-${formatCurrency(Math.abs(insights.projectedSavings))}`
      : formatCurrency(Math.max(insights.projectedSavings, 0));

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={appStyles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('smart_title')}</Text>
            <Text style={styles.subtitle}>{t('smart_subtitle')}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} style={styles.dateChip} onPress={onOpenDateFilter}>
            <Ionicons name="calendar-outline" size={16} color={theme.accentText} />
            <Text style={styles.dateChipText}>{formatDateBadge(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.scoreOrb}>
              <Text style={styles.scoreValue}>{insights.score.value}</Text>
              <Text style={styles.scoreLabel}>{t('smart_score_label')}</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroState}>{insights.score.label}</Text>
              <Text style={styles.heroForecast}>
                {t('smart_forecast_title')}: {forecastValue}
              </Text>
              <Text style={styles.heroMeta}>
                {t('smart_daily_cap_title')}: {formatCurrency(insights.averageDailyExpense)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statGrid}>
          <StatCard
            label={t('smart_health_label')}
            value={insights.forecast.status === 'risk' ? t('cashflow_pressure') : t('forecast_stable')}
            styles={styles}
          />
          <StatCard
            label={t('smart_daily_cap_title')}
            value={formatCurrency(insights.averageDailyExpense)}
            styles={styles}
          />
        </View>

        {insights.topCategory ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.featureCard}
            onPress={() =>
              onOpenTransactionGroup({
                title: `${insights.topCategory.category} • ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`,
                transactions: insights.monthTransactions.filter(
                  (item) => item.category === insights.topCategory.category
                ),
              })
            }
          >
            <View style={styles.featureHeader}>
              <Text style={styles.featureLabel}>{t('smart_top_category')}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textSoft} />
            </View>
            <Text style={styles.featureTitle}>{insights.topCategory.category}</Text>
            <Text style={styles.featureValue}>
              {formatCurrency(insights.topCategory.amount)}
            </Text>
          </TouchableOpacity>
        ) : null}

        {topPressureBudget ? (
          <TouchableOpacity activeOpacity={0.85} style={styles.featureCard} onPress={onOpenReports}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureLabel}>{t('smart_budget_pressure_title')}</Text>
              <Ionicons name="pie-chart-outline" size={18} color={theme.warning} />
            </View>
            <Text style={styles.featureTitle}>{topPressureBudget.category}</Text>
            <Text style={styles.featureValue}>
              {formatCurrency(topPressureBudget.spent)} / {formatCurrency(topPressureBudget.limit)}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={appStyles.panelCard}>
          <Text style={styles.sectionTitle}>{t('smart_anomaly_title')}</Text>
          <View style={styles.signalCard}>
            <View style={styles.signalIcon}>
              <Ionicons name="sparkles-outline" size={20} color={theme.accentStrong} />
            </View>
            <View style={styles.signalCopy}>
              <Text style={styles.signalTitle}>{insights.anomaly?.title || insights.score.label}</Text>
              <Text style={styles.signalText}>{insights.anomaly?.message || t('smart_corner_desc')}</Text>
            </View>
          </View>
        </View>

        <View style={appStyles.panelCard}>
          <Text style={styles.sectionTitle}>{t('next_moves')}</Text>
          {insights.smartTips.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Ionicons name="flash-outline" size={16} color={theme.warning} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
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
      marginBottom: 18,
    },
    headerCopy: {
      flex: 1,
      paddingRight: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.textMuted,
    },
    dateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.accent,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    dateChipText: {
      marginLeft: 6,
      color: theme.accentText,
      fontSize: 12,
      fontWeight: '700',
    },
    heroCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 28,
      padding: 18,
      marginBottom: 18,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    scoreOrb: {
      width: 112,
      height: 112,
      borderRadius: 56,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreValue: {
      fontSize: 34,
      fontWeight: '800',
      color: theme.accentStrong,
    },
    scoreLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
      textAlign: 'center',
    },
    heroCopy: {
      flex: 1,
    },
    heroState: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 8,
    },
    heroForecast: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    heroMeta: {
      fontSize: 14,
      color: theme.textMuted,
    },
    statGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 18,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 22,
      padding: 16,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    statHint: {
      marginTop: 6,
      fontSize: 12,
      color: theme.textSoft,
    },
    featureCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 24,
      padding: 18,
      marginBottom: 18,
    },
    featureHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    featureLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
    },
    featureTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 8,
    },
    featureValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.accentStrong,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 12,
    },
    signalCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.accentSoft,
      borderRadius: 20,
      padding: 14,
    },
    signalIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    signalCopy: {
      flex: 1,
    },
    signalTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 5,
    },
    signalText: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textMuted,
    },
    tipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    tipText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 13,
      lineHeight: 19,
      color: theme.textMuted,
    },
  });
}
