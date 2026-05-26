import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../utils/formatters';

const TONE_MAP = {
  alert: {
    icon: 'alert-circle-outline',
    iconColor: '#d56539',
    iconBackground: '#fff0e8',
    iconBackgroundDark: '#2d1a13',
    accent: '#d56539',
  },
  warning: {
    icon: 'warning-outline',
    iconColor: '#ee8e34',
    iconBackground: '#fff3df',
    iconBackgroundDark: '#2d2213',
    accent: '#ee8e34',
  },
  success: {
    icon: 'checkmark-circle-outline',
    iconColor: '#1d9c63',
    iconBackground: '#edf9f2',
    iconBackgroundDark: '#132d1e',
    accent: '#1d9c63',
  },
  info: {
    icon: 'notifications-outline',
    iconColor: '#4b7bec',
    iconBackground: '#edf3ff',
    iconBackgroundDark: '#131e2d',
    accent: '#4b7bec',
  },
};

function NotificationCard({ item, onPress, styles, theme }) {
  const tone = TONE_MAP[item.tone] || TONE_MAP.info;
  const iconBg = theme.mode === 'dark' ? tone.iconBackgroundDark : tone.iconBackground;

  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.noticeCard} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={tone.icon} size={22} color={tone.iconColor} />
      </View>

      <View style={styles.noticeContent}>
        <View style={styles.noticeHeader}>
          <Text style={styles.noticeTitle}>{item.title}</Text>
          {item.isUnread ? <View style={[styles.noticeDot, { backgroundColor: tone.accent }]} /> : null}
        </View>

        <Text style={styles.noticeMessage}>{item.message}</Text>

        <View style={styles.noticeFooter}>
          <Text style={styles.noticeTime}>{item.timeLabel}</Text>
          <View style={[styles.noticePill, { backgroundColor: iconBg }]}>
            <Text style={[styles.noticePillText, { color: tone.iconColor }]}>{item.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationScreen({
  notifications,
  onSelectNotification,
  onMarkAllAsRead,
  onBack,
  theme,
}) {
  const styles = createStyles(theme);
  const unreadCount = notifications.filter((item) => item.isUnread).length;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications_title')}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Actions row */}
      {notifications.length > 0 ? (
        <View style={styles.actionsRow}>
          <Text style={styles.helperText}>
            {unreadCount > 0 ? t('notifications_helper') : t('notifications_all_read')}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.markAllButton, unreadCount === 0 ? styles.markAllButtonDisabled : null]}
            onPress={onMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <Text
              style={[
                styles.markAllButtonText,
                unreadCount === 0 ? styles.markAllButtonTextDisabled : null,
              ]}
            >
              {t('mark_all_read')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Content */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="file-tray-outline" size={48} color={theme.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>{t('no_notifications')}</Text>
          <Text style={styles.emptyText}>{t('no_notifications_desc')}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {notifications.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              styles={styles}
              theme={theme}
              onPress={() => onSelectNotification(item)}
            />
          ))}
        </ScrollView>
      )}
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
    },
    headerRight: {
      width: 42,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 18,
      marginBottom: 10,
      gap: 12,
    },
    helperText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: theme.textMuted,
    },
    markAllButton: {
      borderRadius: 999,
      backgroundColor: theme.mode === 'dark' ? '#1f2522' : '#fff2dd',
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    markAllButtonDisabled: {
      backgroundColor: theme.mode === 'dark' ? '#1a1f1d' : '#f4ebdf',
    },
    markAllButtonText: {
      color: '#ee8e34',
      fontSize: 13,
      fontWeight: '800',
    },
    markAllButtonTextDisabled: {
      color: '#b6a89a',
    },
    listContent: {
      paddingHorizontal: 18,
      paddingBottom: 120,
    },
    noticeCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.surface,
      borderRadius: 22,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    noticeContent: {
      flex: 1,
    },
    noticeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    noticeTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
      paddingRight: 12,
    },
    noticeDot: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
    },
    noticeMessage: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.textMuted,
      marginBottom: 12,
    },
    noticeFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    noticeTime: {
      fontSize: 12,
      color: theme.textSoft,
      fontWeight: '600',
    },
    noticePill: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    noticePillText: {
      fontSize: 12,
      fontWeight: '700',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyIconWrap: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textMuted,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.textSoft,
      textAlign: 'center',
    },
  });
}
