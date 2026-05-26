import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SectionHeader from '../components/SectionHeader';
import SwipeableRow from '../components/SwipeableRow';
import { CATEGORY_PRESETS } from '../data/seedData';
import { createAppStyles } from '../styles/appStyles';
import { getVietnamDateParts } from '../utils/dateTime';
import { formatCurrency, t } from '../utils/formatters';
import { analyzeFinance } from '../utils/smartInsights';

function formatMonthToken(date) {
  const parts = getVietnamDateParts(date);
  return `${String(parts.month + 1).padStart(2, '0')}/${parts.year}`;
}

function formatPercent(value) {
  return `${value.toLocaleString('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function getCategoryVisual(categoryKey, fallbackType = 'expense') {
  return (
    CATEGORY_PRESETS.find((item) => item.key === categoryKey) ||
    CATEGORY_PRESETS.find((item) => item.type === fallbackType) ||
    CATEGORY_PRESETS[0]
  );
}

function groupTransactionsByCategory(transactions, type) {
  const grouped = transactions
    .filter((item) => item.type === type)
    .reduce((accumulator, item) => {
      const existing = accumulator[item.categoryKey] || {
        category: item.category,
        categoryKey: item.categoryKey,
        amount: 0,
        count: 0,
      };

      existing.amount += item.amount;
      existing.count += 1;
      accumulator[item.categoryKey] = existing;
      return accumulator;
    }, {});

  const items = Object.values(grouped).sort((left, right) => right.amount - left.amount);
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return items.map((item) => {
    const visual = getCategoryVisual(item.categoryKey, type);

    return {
      ...item,
      icon: visual.icon,
      tint: visual.tint,
      percent: total > 0 ? (item.amount / total) * 100 : 0,
    };
  });
}

function DonutChart({ data, theme, type }) {
  const styles = stylesFactory(theme);
  const size = 300;
  const center = size / 2;
  const radius = 78;
  const strokeWidth = 44;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  let runningPercent = 0;
  const segments = data.map((item) => {
    const segment = {
      ...item,
      startPercent: runningPercent,
      midPercent: runningPercent + item.percent / 2,
    };
    runningPercent += item.percent;
    return segment;
  });
  const labelItems = segments.filter((item, index) => item.percent >= 7 || index < 3).slice(0, 4);

  if (!total) {
    return (
      <View style={styles.chartEmptyWrap}>
        <View style={styles.chartEmptyCircle}>
          <Ionicons name="pie-chart-outline" size={42} color={theme.textSoft} />
        </View>
        <Text style={styles.chartEmptyText}>Chưa có dữ liệu trong tháng này</Text>
      </View>
    );
  }

  let offset = 0;

  return (
    <View style={styles.chartWrap}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.surfaceMuted}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {segments.map((item) => {
            const segmentLength = circumference * (item.amount / total);
            const circle = (
              <Circle
                key={item.categoryKey}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.tint}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={-offset}
                fill="none"
              />
            );

            offset += segmentLength;
            return circle;
          })}
        </G>

        {labelItems.map((item) => {
          const midAngle = item.midPercent * 3.6 - 90;
          const radians = (midAngle * Math.PI) / 180;
          const lineStartX = center + Math.cos(radians) * (radius + 24);
          const lineStartY = center + Math.sin(radians) * (radius + 24);
          const lineEndX = center + Math.cos(radians) * (radius + 54);
          const lineEndY = center + Math.sin(radians) * (radius + 54);
          const horizontalX = lineEndX + (lineEndX >= center ? 36 : -36);
          const anchor = horizontalX >= center ? 'start' : 'end';
          const textX = horizontalX + (anchor === 'start' ? 10 : -10);

          return (
            <G key={`${item.categoryKey}-label`}>
              <Line x1={lineStartX} y1={lineStartY} x2={lineEndX} y2={lineEndY} stroke={item.tint} strokeWidth="2" />
              <Line x1={lineEndX} y1={lineEndY} x2={horizontalX} y2={lineEndY} stroke={item.tint} strokeWidth="2" />
              <SvgText
                x={textX}
                y={lineEndY - 4}
                fill={theme.textMuted}
                fontSize="11"
                textAnchor={anchor}
              >
                {formatPercent(item.percent)}
              </SvgText>
              <SvgText
                x={textX}
                y={lineEndY + 16}
                fill={theme.text}
                fontSize="13"
                fontWeight="700"
                textAnchor={anchor}
              >
                {item.category}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      <View style={styles.chartCenter}>
        <Text style={styles.chartCenterLabel}>
          {type === 'expense' ? t('expense') : t('income')}
        </Text>
        <Text style={styles.chartCenterValue}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

const stylesFactory = (theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingTop: 0,
      paddingBottom: 120,
      paddingHorizontal: 0,
    },
    topBar: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 18,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    topBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: theme.text,
    },
    topBarAction: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    monthBar: {
      marginTop: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
      backgroundColor: theme.surfaceAlt,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    monthButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthCard: {
      flex: 1,
      minHeight: 76,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      gap: 16,
    },
    monthText: {
      flex: 1,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '800',
      color: theme.text,
    },
    summaryCard: {
      marginHorizontal: 18,
      marginTop: 18,
      backgroundColor: theme.surface,
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    summarySplit: {
      flex: 1,
      paddingVertical: 22,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryDivider: {
      width: 1,
      backgroundColor: theme.border,
    },
    summaryLabel: {
      fontSize: 15,
      color: theme.textMuted,
      marginBottom: 10,
    },
    summaryValue: {
      fontSize: 27,
      fontWeight: '800',
    },
    expenseValue: {
      color: theme.danger,
    },
    incomeValue: {
      color: theme.info,
    },
    netRow: {
      paddingVertical: 18,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    netLabel: {
      fontSize: 18,
      color: theme.textMuted,
      fontWeight: '600',
    },
    netValue: {
      fontSize: 30,
      color: theme.text,
      fontWeight: '800',
    },
    tabs: {
      marginTop: 18,
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    tabButtonActive: {
      borderBottomColor: theme.info,
    },
    tabLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textMuted,
    },
    tabLabelActive: {
      color: theme.info,
    },
    chartCard: {
      marginHorizontal: 18,
      marginTop: 18,
      backgroundColor: theme.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 18,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    chartWrap: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartCenter: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartCenterLabel: {
      color: theme.textMuted,
      fontSize: 15,
      marginBottom: 6,
    },
    chartCenterValue: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '800',
      textAlign: 'center',
      paddingHorizontal: 36,
    },
    chartEmptyWrap: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },
    chartEmptyCircle: {
      width: 164,
      height: 164,
      borderRadius: 82,
      borderWidth: 26,
      borderColor: theme.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    chartEmptyText: {
      color: theme.textMuted,
      fontSize: 15,
    },
    categoryList: {
      marginTop: 12,
      width: '100%',
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    categoryIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      backgroundColor: theme.surfaceAlt,
    },
    categoryTextWrap: {
      flex: 1,
      marginRight: 10,
    },
    categoryName: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    categoryMeta: {
      fontSize: 13,
      color: theme.textMuted,
    },
    categoryAmountWrap: {
      alignItems: 'flex-end',
      marginRight: 10,
    },
    categoryAmount: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 4,
    },
    categoryPercent: {
      fontSize: 13,
      color: theme.textMuted,
      fontWeight: '600',
    },
    budgetPanel: {
      marginHorizontal: 18,
      marginTop: 18,
    },
    emptyWrap: { paddingVertical: 8, alignItems: 'flex-start' },
    emptyText: { fontSize: 14, color: theme.textMuted, marginBottom: 12 },
    addBudgetButton: {
      backgroundColor: theme.accent,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    addBudgetText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
    budgetCard: {
      marginBottom: 14,
      backgroundColor: theme.surfaceAlt,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.borderSoft,
    },
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    budgetTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
    budgetAmount: { fontSize: 12, color: theme.textMuted, marginLeft: 10 },
    track: { height: 10, backgroundColor: theme.surfaceMuted, borderRadius: 999, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 999 },
    budgetHint: { marginTop: 8, fontSize: 12, color: theme.textMuted },
  });

export default function ReportsScreen({
  data,
  theme,
  selectedDate,
  onEditBudget,
  onDeleteBudget,
  onChangeMonth,
  onOpenDateFilter,
}) {
  const appStyles = createAppStyles(theme);
  const styles = stylesFactory(theme);
  const insights = analyzeFinance(data, selectedDate);
  const [activeType, setActiveType] = React.useState('expense');
  const monthLabel = formatMonthToken(selectedDate);
  const breakdown = groupTransactionsByCategory(insights.monthTransactions, activeType);
  const netAmount = insights.monthIncome - insights.monthExpense;

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.topBarRow}>
          <Text style={styles.title}>Báo cáo</Text>
          <TouchableOpacity activeOpacity={0.85} style={styles.topBarAction} onPress={() => {}}>
            <Ionicons name="search-outline" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.monthBar}>
        <TouchableOpacity activeOpacity={0.85} style={styles.monthButton} onPress={() => onChangeMonth(-1)}>
          <Ionicons name="chevron-back" size={30} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} style={styles.monthCard} onPress={onOpenDateFilter}>
          <Text style={styles.monthText}>{monthLabel}</Text>
          <Ionicons name="calendar-outline" size={24} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} style={styles.monthButton} onPress={() => onChangeMonth(1)}>
          <Ionicons name="chevron-forward" size={30} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        directionalLockEnabled
        bounces={false}
        contentContainerStyle={[appStyles.scrollContent, styles.content]}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summarySplit}>
              <Text style={styles.summaryLabel}>Chi tiêu</Text>
              <Text style={[styles.summaryValue, styles.expenseValue]}>
                -{formatCurrency(insights.monthExpense)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summarySplit}>
              <Text style={styles.summaryLabel}>Thu nhập</Text>
              <Text style={[styles.summaryValue, styles.incomeValue]}>
                +{formatCurrency(insights.monthIncome)}
              </Text>
            </View>
          </View>

          <View style={styles.netRow}>
            <Text style={styles.netLabel}>Thu chi</Text>
            <Text style={styles.netValue}>
              {netAmount > 0 ? '+' : ''}
              {formatCurrency(netAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {[
            { key: 'expense', label: 'Chi tiêu' },
            { key: 'income', label: 'Thu nhập' },
          ].map((tab) => {
            const active = activeType === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setActiveType(tab.key)}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.chartCard}>
          <DonutChart data={breakdown} theme={theme} type={activeType} />

          <View style={styles.categoryList}>
            {breakdown.map((item) => (
              <View key={item.categoryKey} style={styles.categoryRow}>
                <View style={styles.categoryIconWrap}>
                  <MaterialCommunityIcons name={item.icon} size={28} color={item.tint} />
                </View>
                <View style={styles.categoryTextWrap}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <Text style={styles.categoryMeta}>{item.count} giao dịch</Text>
                </View>
                <View style={styles.categoryAmountWrap}>
                  <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
                  <Text style={styles.categoryPercent}>{formatPercent(item.percent)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSoft} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.budgetPanel}>
          <View style={appStyles.panelCard}>
            <SectionHeader title={t('monthly_budget_map')} theme={theme} />
            {insights.budgetSnapshot.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>{t('no_expense_month')}</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.addBudgetButton}
                  onPress={() => onEditBudget(null)}
                >
                  <Text style={styles.addBudgetText}>{t('create_budget')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              insights.budgetSnapshot.map((budget) => {
                const progress = Math.min(budget.progress, 1);
                const accent = budget.isOverLimit
                  ? theme.danger
                  : budget.isNearLimit
                    ? theme.warning
                    : theme.accent;

                return (
                  <SwipeableRow key={budget.id} onDelete={() => onDeleteBudget(budget.id)}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.budgetCard}
                      onPress={() => onEditBudget(budget)}
                    >
                      <View style={styles.budgetHeader}>
                        <Text style={styles.budgetTitle}>{budget.category}</Text>
                        <Text style={styles.budgetAmount}>
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                        </Text>
                      </View>
                      <View style={styles.track}>
                        <View
                          style={[
                            styles.fill,
                            { width: `${progress * 100}%`, backgroundColor: accent },
                          ]}
                        />
                      </View>
                      <Text style={styles.budgetHint}>
                        {budget.isOverLimit
                          ? t('over_limit_month')
                          : budget.isNearLimit
                            ? t('near_limit')
                            : t('remaining_amount', {
                                amount: formatCurrency(budget.remaining),
                              })}
                      </Text>
                    </TouchableOpacity>
                  </SwipeableRow>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
