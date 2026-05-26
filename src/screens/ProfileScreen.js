import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEMES } from '../styles/theme';
import { t } from '../utils/formatters';

function SettingRow({ label, value, onPress, disabled = false, styles, theme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.settingRow}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.settingRowLabel}>{label}</Text>
      <View style={styles.settingRowRight}>
        <Text style={styles.settingRowValue} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={theme.textSoft} />
      </View>
    </TouchableOpacity>
  );
}

function ToggleRow({ label, value, onValueChange, description, disabled = false, styles, theme }) {
  return (
    <View style={styles.toggleWrap}>
      <View style={styles.toggleRow}>
        <Text style={styles.settingRowLabel}>{label}</Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          thumbColor="#ffffff"
          trackColor={{ false: theme.borderSoft, true: theme.accent }}
          ios_backgroundColor={theme.borderSoft}
        />
      </View>
      {description ? <Text style={styles.toggleDescription}>{description}</Text> : null}
    </View>
  );
}

function OptionPickerModal({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
  styles,
  theme,
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>{t('choose_option')}</Text>

          {options.map((option) => {
            const active = selectedValue === option.value;

            return (
              <TouchableOpacity
                key={String(option.value)}
                activeOpacity={0.85}
                style={[styles.modalOption, active && styles.modalOptionActive]}
                onPress={() => onSelect(option.value)}
              >
                <Text style={[styles.modalOptionText, active && styles.modalOptionTextActive]}>
                  {option.label}
                </Text>
                {active ? <Ionicons name="checkmark" size={18} color={theme.accent} /> : null}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity activeOpacity={0.85} style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t('close')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen({
  data,
  theme = THEMES.light,
  saving,
  onUpdateSettings,
  onExportCsv,
  onImportCsv,
  onReset,
  onBack,
}) {
  const styles = createStyles(theme);
  const settings = data.settings || {};
  const [pickerKey, setPickerKey] = React.useState(null);

  const pickerConfigs = {
    appearance: {
      title: t('appearance'),
      options: [
        { value: 'light', label: t('appearance_light') },
        { value: 'dark', label: t('appearance_dark') },
        { value: 'auto', label: t('appearance_auto') },
      ],
    },
    amountDisplay: {
      title: t('setting_money_style'),
      options: [
        { value: 'symbol', label: t('money_style_symbol') },
        { value: 'code', label: t('money_style_code') },
      ],
    },
    dateFormat: {
      title: t('setting_date_format'),
      options: [
        { value: 'dd/MM/yyyy', label: '21/04/2026' },
        { value: 'MM/dd/yyyy', label: '04/21/2026' },
        { value: 'yyyy-MM-dd', label: '2026-04-21' },
      ],
    },
    language: {
      title: t('language'),
      options: [
        { value: 'vi', label: 'Tiếng Việt' },
        { value: 'en', label: 'English' },
      ],
    },
    currency: {
      title: t('currency'),
      options: [
        { value: 'VND', label: 'VND' },
        { value: 'USD', label: 'USD' },
        { value: 'EUR', label: 'EUR' },
      ],
    },
    weekStartsOn: {
      title: t('setting_week_start'),
      options: [
        { value: 'monday', label: t('week_monday') },
        { value: 'sunday', label: t('week_sunday') },
      ],
    },
    firstDayOfMonth: {
      title: t('setting_first_day_month'),
      options: [1, 5, 10, 15].map((value) => ({ value, label: String(value) })),
    },
    firstMonthOfYear: {
      title: t('setting_first_month_year'),
      options: [1, 4, 7, 10].map((value) => ({
        value,
        label: t(`option_month_${value}`),
      })),
    },
    reportRange: {
      title: t('setting_report_range'),
      options: [
        { value: '3_months', label: t('report_range_3_months') },
        { value: '6_months', label: t('report_range_6_months') },
        { value: '12_months', label: t('report_range_12_months') },
      ],
    },
    overviewMode: {
      title: t('setting_overview_mode'),
      options: [
        { value: 'balance', label: t('overview_mode_balance') },
        { value: 'flow', label: t('overview_mode_flow') },
      ],
    },
  };

  const activePicker = pickerKey ? pickerConfigs[pickerKey] : null;

  function getOptionLabel(key, value) {
    const options = pickerConfigs[key]?.options || [];
    const matched = options.find((item) => item.value === value);
    return matched?.label || String(value ?? '');
  }

  async function handleSelect(key, value) {
    setPickerKey(null);
    await onUpdateSettings({ [key]: value });
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.85} style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
            <Text style={styles.backText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings_screen_title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.sectionTitle}>{t('settings_display')}</Text>
        <View style={styles.sectionCard}>
          <SettingRow
            label={t('appearance')}
            value={getOptionLabel('appearance', settings.appearance)}
            onPress={() => setPickerKey('appearance')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
          <SettingRow
            label={t('setting_money_style')}
            value={getOptionLabel('amountDisplay', settings.amountDisplay)}
            onPress={() => setPickerKey('amountDisplay')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
          <SettingRow
            label={t('setting_date_format')}
            value={getOptionLabel('dateFormat', settings.dateFormat)}
            onPress={() => setPickerKey('dateFormat')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
          <SettingRow
            label={t('language')}
            value={getOptionLabel('language', settings.language)}
            onPress={() => setPickerKey('language')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
          <SettingRow
            label={t('currency')}
            value={getOptionLabel('currency', settings.currency)}
            onPress={() => setPickerKey('currency')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
          <SettingRow
            label={t('setting_week_start')}
            value={getOptionLabel('weekStartsOn', settings.weekStartsOn)}
            onPress={() => setPickerKey('weekStartsOn')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
          <SettingRow
            label={t('setting_first_day_month')}
            value={String(settings.firstDayOfMonth ?? 1)}
            onPress={() => setPickerKey('firstDayOfMonth')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
          <SettingRow
            label={t('setting_first_month_year')}
            value={getOptionLabel('firstMonthOfYear', settings.firstMonthOfYear)}
            onPress={() => setPickerKey('firstMonthOfYear')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
          <SettingRow
            label={t('setting_report_range')}
            value={getOptionLabel('reportRange', settings.reportRange)}
            onPress={() => setPickerKey('reportRange')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
          <SettingRow
            label={t('setting_overview_mode')}
            value={getOptionLabel('overviewMode', settings.overviewMode)}
            onPress={() => setPickerKey('overviewMode')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
          <ToggleRow
            label={t('setting_exclude_reports')}
            value={Boolean(settings.excludeFromReportDefault)}
            onValueChange={(value) => onUpdateSettings({ excludeFromReportDefault: value })}
            description={t('setting_exclude_reports_desc')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('settings_system')}</Text>
        <View style={styles.sectionCard}>
          <ToggleRow
            label={t('setting_daily_reminder')}
            value={Boolean(settings.dailyReminder)}
            onValueChange={(value) => onUpdateSettings({ dailyReminder: value })}
            description={t('setting_daily_reminder_desc')}
            disabled={saving}
            styles={styles}
            theme={theme}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('data_portability')}</Text>
        <View style={styles.resetCard}>
          <Text style={styles.resetDescription}>{t('data_portability_desc')}</Text>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.secondaryButton, saving && styles.disabledButton]}
              onPress={onExportCsv}
              disabled={saving}
            >
              <Ionicons name="download-outline" size={18} color={theme.text} />
              <Text style={styles.secondaryButtonText}>{t('export_csv')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.secondaryButton, saving && styles.disabledButton]}
              onPress={onImportCsv}
              disabled={saving}
            >
              <Ionicons name="document-attach-outline" size={18} color={theme.text} />
              <Text style={styles.secondaryButtonText}>{t('import_csv')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('settings_reset_card')}</Text>
        <View style={styles.resetCard}>
          <Text style={styles.resetDescription}>{t('settings_reset_desc')}</Text>
          <TouchableOpacity activeOpacity={0.85} style={styles.resetButton} onPress={onReset}>
            <Ionicons name="refresh-outline" size={18} color="#ffffff" />
            <Text style={styles.resetText}>{t('reset_demo')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <OptionPickerModal
        visible={Boolean(activePicker)}
        title={activePicker?.title || ''}
        options={activePicker?.options || []}
        selectedValue={pickerKey ? settings[pickerKey] : null}
        onClose={() => setPickerKey(null)}
        onSelect={(value) => handleSelect(pickerKey, value)}
        styles={styles}
        theme={theme}
      />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 140,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 32,
    },
    backButton: {
      minWidth: 112,
      height: 52,
      borderRadius: 22,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    backText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
    },
    headerTitle: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '800',
    },
    headerSpacer: {
      width: 112,
    },
    sectionTitle: {
      color: theme.textMuted,
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 14,
      marginLeft: 4,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 22,
      overflow: 'hidden',
    },
    settingRow: {
      minHeight: 64,
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    settingRowLabel: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 22,
    },
    settingRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
      maxWidth: '48%',
    },
    settingRowValue: {
      color: theme.accentStrong,
      fontSize: 15,
      fontWeight: '500',
      textAlign: 'right',
      flexShrink: 1,
    },
    toggleWrap: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    toggleDescription: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 10,
      paddingRight: 8,
    },
    resetCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
    },
    resetDescription: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 16,
    },
    resetButton: {
      height: 52,
      borderRadius: 18,
      backgroundColor: theme.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    secondaryButton: {
      flex: 1,
      height: 52,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '700',
    },
    disabledButton: {
      opacity: 0.6,
    },
    resetText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    modalCard: {
      width: '100%',
      borderRadius: 24,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 6,
    },
    modalSubtitle: {
      color: theme.textMuted,
      fontSize: 13,
      marginBottom: 16,
    },
    modalOption: {
      minHeight: 52,
      borderRadius: 16,
      paddingHorizontal: 14,
      marginBottom: 10,
      backgroundColor: theme.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalOptionActive: {
      borderWidth: 1,
      borderColor: theme.accent,
      backgroundColor: theme.accentSoft,
    },
    modalOptionText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '600',
    },
    modalOptionTextActive: {
      color: theme.accentStrong,
    },
    closeButton: {
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
      marginTop: 8,
    },
    closeButtonText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
