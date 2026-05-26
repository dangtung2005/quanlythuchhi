import { CATEGORY_PRESETS, DEFAULT_DATA } from '../data/seedData';
import { resolveCategoryKey } from './categories';
import { serializeVietnamDateTime } from './dateTime';

function escapeCsvValue(value) {
  const normalized = String(value ?? '');

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function buildCsvRow(values) {
  return values.map(escapeCsvValue).join(',');
}

function normalizeCsvText(text) {
  return String(text || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

function detectDelimiter(text) {
  const sampleLines = normalizeCsvText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  const delimiters = [',', ';', '\t'];
  const scored = delimiters.map((delimiter) => ({
    delimiter,
    score: sampleLines.reduce((sum, line) => sum + line.split(delimiter).length - 1, 0),
  }));

  scored.sort((left, right) => right.score - left.score);
  return scored[0]?.score > 0 ? scored[0].delimiter : ',';
}

function parseCsv(text, delimiter = detectDelimiter(text)) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;
  const normalizedText = normalizeCsvText(text);

  for (let index = 0; index < normalizedText.length; index += 1) {
    const char = normalizedText[index];
    const nextChar = normalizedText[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(value.trim());
      value = '';
      continue;
    }

    if (char === '\n' && !inQuotes) {
      row.push(value.trim());
      value = '';

      if (row.some((item) => item !== '')) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    value += char;
  }

  row.push(value.trim());

  if (row.some((item) => item !== '')) {
    rows.push(row);
  }

  return rows;
}

function numberOrFallback(value, fallback = 0) {
  const normalized = String(value ?? '')
    .replace(/\s/g, '')
    .replace(/[₫đ]/gi, '')
    .replace(/,(?=\d{3}\b)/g, '')
    .replace(/\.(?=\d{3}\b)/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function parseSettingsValue(rawValue) {
  if (rawValue === 'true' || rawValue === 'false') {
    return rawValue === 'true';
  }

  if (/^-?\d+(\.\d+)?$/.test(rawValue)) {
    return numberOrFallback(rawValue);
  }

  return rawValue;
}

function getPresetByCategory(category, categoryKey, type) {
  const resolvedKey = categoryKey || resolveCategoryKey(category, CATEGORY_PRESETS);
  return (
    CATEGORY_PRESETS.find((item) => item.key === resolvedKey) ||
    CATEGORY_PRESETS.find((item) => item.type === type) ||
    null
  );
}

function parseFinanceSections(rows) {
  if (!rows.length || rows[0][0] !== '__meta__' || rows[0][1] !== 'finance_csv') {
    return null;
  }

  const nextData = {
    ...DEFAULT_DATA,
    settings: { ...DEFAULT_DATA.settings },
    wallets: [],
    budgets: [],
    transactions: [],
  };

  let section = null;
  let headers = [];

  rows.slice(1).forEach((row) => {
    if (!row.length) {
      return;
    }

    if (row[0] === '__section__') {
      section = row[1];
      headers = [];
      return;
    }

    if (!section) {
      return;
    }

    if (!headers.length) {
      headers = row;
      return;
    }

    const entry = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']));

    if (section === 'settings') {
      nextData.settings[entry.key] = parseSettingsValue(entry.value);
      return;
    }

    if (section === 'wallets') {
      nextData.wallets.push({
        id: entry.id,
        name: entry.name,
        amount: numberOrFallback(entry.amount),
        color: entry.color,
      });
      return;
    }

    if (section === 'budgets') {
      nextData.budgets.push({
        id: entry.id,
        category: entry.category,
        categoryKey: entry.categoryKey || resolveCategoryKey(entry.category, CATEGORY_PRESETS),
        limit: numberOrFallback(entry.limit),
        spent: 0,
      });
      return;
    }

    if (section === 'transactions') {
      const preset = getPresetByCategory(entry.category, entry.categoryKey, entry.type);

      nextData.transactions.push({
        id: entry.id,
        title: entry.title,
        category: entry.category,
        categoryKey: entry.categoryKey || resolveCategoryKey(entry.category, CATEGORY_PRESETS),
        type: entry.type,
        amount: numberOrFallback(entry.amount),
        walletId: entry.walletId,
        icon: entry.icon || preset?.icon || 'swap-horizontal-outline',
        tint: entry.tint || preset?.tint || '#16a36a',
        createdAt: entry.createdAt || serializeVietnamDateTime(new Date()),
        note: entry.note || '',
      });
    }
  });

  if (!nextData.wallets.length || !nextData.transactions.length) {
    throw new Error('INVALID_FINANCE_CSV');
  }

  return nextData;
}

function parseFlexibleDate(value) {
  const raw = String(value || '').trim();

  if (!raw) {
    return serializeVietnamDateTime(new Date());
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.includes('T') ? raw : `${raw}T00:00:00.000+07:00`;
  }

  const slashMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (slashMatch) {
    const [, left, middle, year] = slashMatch;
    const first = Number(left);
    const second = Number(middle);
    const day = first > 12 ? first : second;
    const month = first > 12 ? second : first;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000+07:00`;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? serializeVietnamDateTime(new Date())
    : serializeVietnamDateTime(parsed);
}

function parseFlatTransactions(rows) {
  if (!rows.length) {
    throw new Error('INVALID_FINANCE_CSV');
  }

  const headerAliases = Object.fromEntries(
    rows[0].map((header, index) => [normalizeHeader(header), index])
  );

  const amountIndex = headerAliases.amount ?? headerAliases.sotien ?? headerAliases.money;
  const typeIndex = headerAliases.type ?? headerAliases.loaigd ?? headerAliases.loaigiaodich;
  const titleIndex = headerAliases.title ?? headerAliases.ten ?? headerAliases.tengiaodich ?? headerAliases.name;
  const categoryIndex = headerAliases.category ?? headerAliases.danhmuc;
  const walletIndex = headerAliases.wallet ?? headerAliases.vi ?? headerAliases.walletname;
  const dateIndex = headerAliases.createdat ?? headerAliases.date ?? headerAliases.ngay;
  const noteIndex = headerAliases.note ?? headerAliases.ghichu ?? headerAliases.description;

  if (amountIndex == null || typeIndex == null) {
    throw new Error('INVALID_FINANCE_CSV');
  }

  const walletMap = new Map();
  const transactions = [];

  rows.slice(1).forEach((row, index) => {
    if (!row.some((value) => String(value || '').trim() !== '')) {
      return;
    }

    const rawType = String(row[typeIndex] || '').trim().toLowerCase();
    const type = rawType.includes('thu') || rawType.includes('income') ? 'income' : 'expense';
    const category = String(row[categoryIndex] || (type === 'income' ? 'Thu nhập' : 'Chi tiêu')).trim();
    const categoryKey = resolveCategoryKey(category, CATEGORY_PRESETS);
    const preset = getPresetByCategory(category, categoryKey, type);
    const walletName = String(row[walletIndex] || DEFAULT_DATA.wallets[0].name).trim();
    const walletId = walletMap.get(walletName) || `w_import_${walletMap.size + 1}`;

    if (!walletMap.has(walletName)) {
      walletMap.set(walletName, walletId);
    }

    transactions.push({
      id: `t_import_${index + 1}`,
      title: String(row[titleIndex] || category || `Giao dịch ${index + 1}`).trim(),
      category,
      categoryKey,
      type,
      amount: numberOrFallback(row[amountIndex]),
      walletId,
      icon: preset?.icon || 'swap-horizontal-outline',
      tint: preset?.tint || '#16a36a',
      createdAt: parseFlexibleDate(row[dateIndex]),
      note: String(row[noteIndex] || '').trim(),
    });
  });

  const wallets = [...walletMap.entries()].map(([name, id], index) => ({
    id,
    name,
    amount: transactions
      .filter((item) => item.walletId === id)
      .reduce(
        (sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount),
        0
      ),
    color: DEFAULT_DATA.wallets[index % DEFAULT_DATA.wallets.length]?.color || '#16a36a',
  }));

  if (!transactions.length || !wallets.length) {
    throw new Error('INVALID_FINANCE_CSV');
  }

  return {
    ...DEFAULT_DATA,
    settings: { ...DEFAULT_DATA.settings },
    wallets,
    budgets: [],
    transactions,
  };
}

export function exportFinanceDataToCsv(data) {
  const lines = [
    buildCsvRow(['__meta__', 'finance_csv', 'v1']),
    '',
    buildCsvRow(['__section__', 'settings']),
    buildCsvRow(['key', 'value']),
    ...Object.entries(data.settings || {}).map(([key, value]) => buildCsvRow([key, value])),
    '',
    buildCsvRow(['__section__', 'wallets']),
    buildCsvRow(['id', 'name', 'amount', 'color']),
    ...(data.wallets || []).map((wallet) =>
      buildCsvRow([wallet.id, wallet.name, wallet.amount, wallet.color])
    ),
    '',
    buildCsvRow(['__section__', 'budgets']),
    buildCsvRow(['id', 'category', 'categoryKey', 'limit']),
    ...(data.budgets || []).map((budget) =>
      buildCsvRow([budget.id, budget.category, budget.categoryKey, budget.limit])
    ),
    '',
    buildCsvRow(['__section__', 'transactions']),
    buildCsvRow([
      'id',
      'title',
      'category',
      'categoryKey',
      'type',
      'amount',
      'walletId',
      'icon',
      'tint',
      'createdAt',
      'note',
    ]),
    ...(data.transactions || []).map((transaction) =>
      buildCsvRow([
        transaction.id,
        transaction.title,
        transaction.category,
        transaction.categoryKey,
        transaction.type,
        transaction.amount,
        transaction.walletId,
        transaction.icon,
        transaction.tint,
        transaction.createdAt,
        transaction.note || '',
      ])
    ),
  ];

  return lines.join('\n');
}

export function importFinanceDataFromCsv(text) {
  const rows = parseCsv(text);
  return parseFinanceSections(rows) || parseFlatTransactions(rows);
}
