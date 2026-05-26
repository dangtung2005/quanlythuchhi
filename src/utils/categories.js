export function normalizeCategoryKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resolveCategoryKey(label, presets = []) {
  const normalizedLabel = normalizeCategoryKey(label);
  const preset = presets.find(
    (item) =>
      item.key === normalizedLabel ||
      normalizeCategoryKey(item.label) === normalizedLabel
  );

  return preset?.key || normalizedLabel;
}

export function getTransactionCategoryKey(transaction) {
  return transaction.categoryKey || resolveCategoryKey(transaction.category);
}

export function getBudgetCategoryKey(budget) {
  return budget.categoryKey || resolveCategoryKey(budget.category);
}
