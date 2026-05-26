export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

const VIETNAM_OFFSET_MINUTES = 7 * 60;
const MINUTE_IN_MS = 60 * 1000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toTimestamp(value) {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  return new Date(value).getTime();
}

function toVietnamShiftedDate(value) {
  return new Date(toTimestamp(value) + VIETNAM_OFFSET_MINUTES * MINUTE_IN_MS);
}

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

export function getVietnamDateParts(value) {
  const date = toVietnamShiftedDate(value);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    millisecond: date.getUTCMilliseconds(),
  };
}

export function getVietnamDayKey(value) {
  const parts = getVietnamDateParts(value);
  return `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)}`;
}

export function getVietnamDayOrdinal(value) {
  const parts = getVietnamDateParts(value);
  return Math.floor(Date.UTC(parts.year, parts.month, parts.day) / DAY_IN_MS);
}

export function isSameVietnamDay(left, right) {
  return getVietnamDayKey(left) === getVietnamDayKey(right);
}

export function isSameVietnamMonth(left, right) {
  const leftParts = getVietnamDateParts(left);
  const rightParts = getVietnamDateParts(right);

  return leftParts.year === rightParts.year && leftParts.month === rightParts.month;
}

export function getVietnamDaysInMonth(value) {
  const parts = getVietnamDateParts(value);
  return new Date(Date.UTC(parts.year, parts.month + 1, 0)).getUTCDate();
}

export function serializeVietnamDateTime(value = new Date()) {
  const parts = getVietnamDateParts(value);

  return `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}.${pad(parts.millisecond, 3)}+07:00`;
}

export function formatVietnamTime(value, locale) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(toTimestamp(value)));
}

export function formatVietnamMonthYear(value, locale) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: VIETNAM_TIMEZONE,
    month: 'long',
    year: 'numeric',
  }).format(new Date(toTimestamp(value)));
}
