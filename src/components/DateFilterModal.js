import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_LABELS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function clampDay(year, month, day) {
  const maxDay = new Date(year, month + 1, 0).getDate();
  return Math.min(day, maxDay);
}

function buildCalendarDays(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const items = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    items.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    items.push(new Date(year, month, day));
  }

  while (items.length % 7 !== 0) {
    items.push(null);
  }

  return items;
}

function buildYearRange(centerYear) {
  const startYear = centerYear - 5;
  return Array.from({ length: 12 }, (_, index) => startYear + index);
}

export default function DateFilterModal({ visible, selectedDate, onClose, onSubmit }) {
  const [draftDate, setDraftDate] = useState(selectedDate);
  const [displayMonth, setDisplayMonth] = useState(startOfMonth(selectedDate));
  const [pickerMode, setPickerMode] = useState('day');

  useEffect(() => {
    if (visible) {
      setDraftDate(selectedDate);
      setDisplayMonth(startOfMonth(selectedDate));
      setPickerMode('day');
    }
  }, [selectedDate, visible]);

  const calendarDays = useMemo(() => buildCalendarDays(displayMonth), [displayMonth]);
  const yearItems = useMemo(() => buildYearRange(displayMonth.getFullYear()), [displayMonth]);

  function applyAndClose() {
    onSubmit(draftDate);
    onClose();
  }

  function changeHeaderMode() {
    setPickerMode((current) => {
      if (current === 'day') {
        return 'month';
      }

      if (current === 'month') {
        return 'year';
      }

      return 'day';
    });
  }

  function changePeriod(offset) {
    if (pickerMode === 'year') {
      const nextYear = displayMonth.getFullYear() + offset * 12;
      setDisplayMonth(new Date(nextYear, displayMonth.getMonth(), 1));
      return;
    }

    const monthOffset = pickerMode === 'month' ? offset * 12 : offset;
    setDisplayMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + monthOffset, 1)
    );
  }

  function selectMonth(monthIndex) {
    const currentDay = draftDate.getDate();
    const nextYear = displayMonth.getFullYear();
    const nextDay = clampDay(nextYear, monthIndex, currentDay);
    const nextDate = new Date(nextYear, monthIndex, nextDay);
    setDraftDate(nextDate);
    setDisplayMonth(new Date(nextYear, monthIndex, 1));
  }

  function selectYear(year) {
    const currentDay = draftDate.getDate();
    const currentMonth = displayMonth.getMonth();
    const nextDay = clampDay(year, currentMonth, currentDay);
    const nextDate = new Date(year, currentMonth, nextDay);
    setDraftDate(nextDate);
    setDisplayMonth(new Date(year, currentMonth, 1));
    setPickerMode('day');
  }

  function renderDayPicker() {
    return (
      <>
        <View style={styles.weekRow}>
          {WEEK_DAYS.map((item) => (
            <Text key={item} style={styles.weekDay}>
              {item}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((dateItem, index) => {
            if (!dateItem) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const isSelected = isSameDay(dateItem, draftDate);
            const isToday = isSameDay(dateItem, new Date());

            return (
              <TouchableOpacity
                key={`${dateItem.getFullYear()}-${dateItem.getMonth()}-${dateItem.getDate()}`}
                activeOpacity={0.85}
                style={[
                  styles.dayCell,
                  styles.dayButton,
                  isSelected ? styles.dayButtonSelected : null,
                  isToday && !isSelected ? styles.dayButtonToday : null,
                ]}
                onPress={() => setDraftDate(dateItem)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected ? styles.dayTextSelected : null,
                    isToday && !isSelected ? styles.dayTextToday : null,
                  ]}
                >
                  {dateItem.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </>
    );
  }

  function renderMonthPicker() {
    return (
      <View style={styles.selectorGrid}>
        {MONTH_LABELS.map((label, index) => {
          const isSelected =
            displayMonth.getMonth() === index &&
            displayMonth.getFullYear() === draftDate.getFullYear();

          return (
            <TouchableOpacity
              key={label}
              activeOpacity={0.85}
              style={[styles.selectorItem, isSelected ? styles.selectorItemSelected : null]}
              onPress={() => selectMonth(index)}
            >
              <Text
                style={[
                  styles.selectorText,
                  isSelected ? styles.selectorTextSelected : null,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderYearPicker() {
    return (
      <View style={styles.selectorGrid}>
        {yearItems.map((year) => {
          const isSelected = draftDate.getFullYear() === year;

          return (
            <TouchableOpacity
              key={year}
              activeOpacity={0.85}
              style={[styles.selectorItem, isSelected ? styles.selectorItemSelected : null]}
              onPress={() => selectYear(year)}
            >
              <Text
                style={[
                  styles.selectorText,
                  isSelected ? styles.selectorTextSelected : null,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Chọn ngày</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose}>
              <Ionicons name="close" size={24} color="#2d241c" />
            </TouchableOpacity>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Ngày đang xem</Text>
            <Text style={styles.previewValue}>{draftDate.toLocaleDateString('vi-VN')}</Text>
          </View>

          <View style={styles.monthHeader}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.monthButton}
              onPress={() => changePeriod(-1)}
            >
              <Ionicons name="chevron-back" size={20} color="#2d241c" />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} style={styles.monthTitleWrap} onPress={changeHeaderMode}>
              <Text style={styles.monthTitle}>
                {`Tháng ${displayMonth.getMonth() + 1} Năm ${displayMonth.getFullYear()}`}
              </Text>
              <Text style={styles.modeHint}>
                {pickerMode === 'day'
                  ? 'Bấm để chọn tháng'
                  : pickerMode === 'month'
                    ? 'Bấm để chọn năm'
                    : 'Bấm để quay lại ngày'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.monthButton}
              onPress={() => changePeriod(1)}
            >
              <Ionicons name="chevron-forward" size={20} color="#2d241c" />
            </TouchableOpacity>
          </View>

          {pickerMode === 'day'
            ? renderDayPicker()
            : pickerMode === 'month'
              ? renderMonthPicker()
              : renderYearPicker()}

          <View style={styles.actionRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={styles.submitButton} onPress={applyAndClose}>
              <Text style={styles.submitText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(25, 18, 10, 0.35)', justifyContent: 'flex-end' },
  backdropPressable: { flex: 1 },
  card: {
    backgroundColor: '#fff9f0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2d241c',
  },
  previewCard: {
    backgroundColor: '#fff3e6',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 13,
    color: '#8a7863',
    marginBottom: 6,
  },
  previewValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ee8e34',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff3e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  monthTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#2d241c',
  },
  modeHint: {
    marginTop: 2,
    fontSize: 12,
    color: '#9b8a79',
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: '#9b8a79',
    fontSize: 13,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  dayCell: {
    width: '14.2857%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dayButton: {
    height: 42,
    borderRadius: 21,
  },
  dayButtonSelected: {
    backgroundColor: '#ee8e34',
  },
  dayButtonToday: {
    backgroundColor: '#fff3e6',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d241c',
  },
  dayTextSelected: {
    color: '#ffffff',
  },
  dayTextToday: {
    color: '#ee8e34',
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  selectorItem: {
    width: '31%',
    backgroundColor: '#fff3e6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  selectorItemSelected: {
    backgroundColor: '#ee8e34',
  },
  selectorText: {
    color: '#2d241c',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  selectorTextSelected: {
    color: '#ffffff',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1e6d8',
  },
  cancelText: {
    color: '#6a5848',
    fontSize: 16,
    fontWeight: '800',
  },
  submitButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ee8e34',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
