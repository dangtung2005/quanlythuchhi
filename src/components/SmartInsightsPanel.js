import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, t } from '../utils/formatters';
import { THEMES } from '../styles/theme';

function getScoreTone(theme) {
  return {
    alert: {
      background: theme.surface,
      border: theme.border,
      accent: theme.danger,
    },
    warning: {
      background: theme.surface,
      border: theme.border,
      accent: theme.warning,
    },
    info: {
      background: theme.surface,
      border: theme.border,
      accent: theme.info,
    },
    success: {
      background: theme.surface,
      border: theme.border,
      accent: theme.success,
    },
  };
}

function MetricPill({ label, value, styles }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export default function SmartInsightsPanel({ insights, mode = 'home', theme = THEMES.light }) {
  const styles = createStyles(theme);
  const scoreToneMap = getScoreTone(theme);
  const tone = scoreToneMap[insights.score.tone] || scoreToneMap.info;
  const scoreWidth = `${Math.max(insights.score.value, 8)}%`;
  const forecastTitle =
    insights.forecast.status === 'risk'
      ? t('cashflow_pressure')
      : insights.forecast.status === 'budget-risk'
        ? t('budget_pressure')
        : t('forecast_stable');

  return (
    <View style={[styles.panel, { backgroundColor: tone.background, borderColor: tone.border }]}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>{t('ai_pulse')}</Text>
          <Text style={styles.title}>{t('smart_signals')}</Text>
        </View>

        <View style={[styles.scoreBadge, { borderColor: tone.accent }]}>
          <Text style={[styles.scoreValue, { color: tone.accent }]}>{insights.score.value}</Text>
          <Text style={styles.scoreText}>{t('score')}</Text>
        </View>
      </View>

      <Text style={styles.scoreLabel}>{insights.score.label}</Text>

      <View style={styles.scoreTrack}>
        <View style={[styles.scoreFill, { width: scoreWidth, backgroundColor: tone.accent }]} />
      </View>

      <View style={styles.metricsRow}>
        <MetricPill
          label={t('run_rate')}
          value={formatCurrency(insights.averageDailyExpense)}
          styles={styles}
        />
        <MetricPill
          label={t('forecast')}
          value={formatCurrency(insights.projectedExpense)}
          styles={styles}
        />
      </View>

      <View style={styles.calloutCard}>
        <View style={styles.calloutHeader}>
          <Ionicons
            name={
              insights.forecast.status === 'stable'
                ? 'sparkles-outline'
                : 'analytics-outline'
            }
            size={18}
            color={tone.accent}
          />
          <Text style={styles.calloutTitle}>{forecastTitle}</Text>
        </View>
        <Text style={styles.calloutText}>
          {insights.forecast.status === 'risk'
            ? t('forecast_risk_desc', {
                amount: formatCurrency(Math.abs(insights.projectedSavings)),
              })
            : insights.forecast.status === 'budget-risk'
              ? t('forecast_budget_desc')
              : t('forecast_stable_desc', {
                  amount: formatCurrency(Math.max(insights.projectedSavings, 0)),
                })}
        </Text>
      </View>

      {insights.anomaly ? (
        <View style={styles.signalRow}>
          <View style={[styles.signalDot, { backgroundColor: insights.anomaly.accent }]} />
          <View style={styles.signalContent}>
            <Text style={styles.signalTitle}>{insights.anomaly.title}</Text>
            <Text style={styles.signalText}>{insights.anomaly.message}</Text>
          </View>
        </View>
      ) : null}

      {insights.topCategory ? (
        <View style={styles.signalRow}>
          <View style={[styles.signalDot, { backgroundColor: '#ee8e34' }]} />
          <View style={styles.signalContent}>
            <Text style={styles.signalTitle}>{t('category_concentration')}</Text>
            <Text style={styles.signalText}>
              {t('category_concentration_desc', {
                category: insights.topCategory.category,
                percent: Math.round(insights.topCategory.share * 100),
              })}
            </Text>
          </View>
        </View>
      ) : null}

      {insights.smartTips.length > 0 ? (
        <View style={styles.tipsWrap}>
          <Text style={styles.tipsTitle}>
            {mode === 'reports' ? t('coach_notes') : t('next_moves')}
          </Text>
          {insights.smartTips.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Ionicons name="flash-outline" size={16} color={tone.accent} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
    lineHeight: 28,
  },
  scoreBadge: {
    minWidth: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: theme.surfaceAlt,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
  },
  scoreLabel: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 12,
  },
  scoreTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.surfaceMuted,
    overflow: 'hidden',
    marginBottom: 14,
  },
  scoreFill: {
    height: '100%',
    borderRadius: 999,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricPill: {
    flex: 1,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  calloutCard: {
    backgroundColor: theme.surfaceAlt,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSoft,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutTitle: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
  },
  calloutText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.textMuted,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  signalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 10,
  },
  signalContent: {
    flex: 1,
  },
  signalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 2,
  },
  signalText: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.textMuted,
  },
  tipsWrap: {
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.borderSoft,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 20,
    color: theme.textMuted,
  },
});
}
