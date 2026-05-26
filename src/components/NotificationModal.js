import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../utils/formatters';
import { THEMES } from '../styles/theme';

const TONE_MAP = {
  alert: {
    icon: 'alert-circle-outline',
    iconColor: '#d56539',
    iconBackground: '#fff0e8',
    accent: '#d56539',
  },
  warning: {
    icon: 'warning-outline',
    iconColor: '#ee8e34',
    iconBackground: '#fff3df',
    accent: '#ee8e34',
  },
  success: {
    icon: 'checkmark-circle-outline',
    iconColor: '#1d9c63',
    iconBackground: '#edf9f2',
    accent: '#1d9c63',
  },
  info: {
    icon: 'notifications-outline',
    iconColor: '#4b7bec',
    iconBackground: '#edf3ff',
    accent: '#4b7bec',
  },
};

function NotificationCard({ item, onPress, styles }) {
  const tone = TONE_MAP[item.tone] || TONE_MAP.info;

  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.noticeCard} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: tone.iconBackground }]}>
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
          <View style={[styles.noticePill, { backgroundColor: tone.iconBackground }]}>
            <Text style={[styles.noticePillText, { color: tone.iconColor }]}>{item.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationModal({
  visible,
  onClose,
  notifications,
  onSelectNotification,
  onMarkAllAsRead,
  theme = THEMES.light,
}) {
  if (!visible) {
    return null;
  }

  const styles = createStyles(theme);
  const unreadCount = notifications.filter((item) => item.isUnread).length;

  return (
    <View style={styles.overlay}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('notifications_title')}</Text>
              <Text style={styles.subtitle}>
                {unreadCount > 0
                  ? t('notifications_new', { count: unreadCount })
                  : t('notifications_empty_subtitle')}
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.85} style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.warmText} />
            </TouchableOpacity>
          </View>

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

          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={28} color="#ee8e34" />
              </View>
              <Text style={styles.emptyTitle}>{t('no_notifications')}</Text>
              <Text style={styles.emptyText}>{t('no_notifications_desc')}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
              {notifications.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  styles={styles}
                  onPress={() => onSelectNotification(item)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  backdrop: {
    flex: 1,
    backgroundColor: theme.modalOverlay,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  card: {
    maxHeight: '78%',
    backgroundColor: theme.modalSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.warmText,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.modalMuted,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.noticeClose,
  },
  listContent: {
    paddingBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: theme.modalMuted,
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.modalSurfaceAlt,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.modalBorder,
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
    color: theme.warmText,
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
    color: theme.warmSubtle,
    marginBottom: 12,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeTime: {
    fontSize: 12,
    color: theme.warmSoft,
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
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 12,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.mode === 'dark' ? '#1f2522' : '#fff2dd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.warmText,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.modalMuted,
    textAlign: 'center',
  },
});
}
