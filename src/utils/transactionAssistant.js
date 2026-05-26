const EXPENSE_RULES = [
  { keywords: ['com', 'bun', 'pho', 'tra sua', 'ca phe', 'cafe', 'do an', 'an vat'], categoryKey: 'food' },
  { keywords: ['xang', 'grab', 'taxi', 'xe buyt', 'gui xe', 'di chuyen'], categoryKey: 'travel' },
  { keywords: ['ao', 'quan', 'giay', 'shopping', 'mua sam', 'son'], categoryKey: 'shopping' },
  { keywords: ['sach', 'khoa hoc', 'hoc phi', 'course', 'udemy'], categoryKey: 'study' },
];

const INCOME_RULES = [
  { keywords: ['luong', 'salary', 'thuong', 'bonus', 'freelance', 'project'], categoryKey: 'income' },
  { keywords: ['qua tang', 'gift', 'ho tro'], categoryKey: 'bonus' },
];

const CATEGORY_MATCHERS = {
  food: ['an uong'],
  travel: ['di chuyen'],
  shopping: ['mua sam'],
  entertainment: ['giai tri'],
  study: ['hoc tap'],
  bills: ['hoa don'],
  income: ['thu nhap'],
  bonus: ['thuong'],
};

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function suggestCategoryKeyFromTitle(title, type) {
  const normalizedTitle = normalizeText(title || '');

  if (!normalizedTitle.trim()) {
    return null;
  }

  const rules = type === 'income' ? INCOME_RULES : EXPENSE_RULES;
  const match = rules.find((rule) =>
    rule.keywords.some((keyword) => normalizedTitle.includes(keyword))
  );

  return match ? match.categoryKey : null;
}

export function resolveSuggestedCategory(presets, categoryKey) {
  if (!categoryKey) {
    return null;
  }

  const matchers = CATEGORY_MATCHERS[categoryKey] || [];

  const preset = presets.find((item) => {
    const normalizedLabel = normalizeText(item.label);
    return matchers.some((matcher) => normalizedLabel.includes(matcher));
  });

  return preset ? preset.label : null;
}
