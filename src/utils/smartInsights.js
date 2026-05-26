import { formatCurrency, t } from './formatters';
import {
  getVietnamDateParts,
  getVietnamDayKey,
  getVietnamDaysInMonth,
  isSameVietnamDay,
  isSameVietnamMonth,
} from './dateTime';
import { getBudgetCategoryKey, getTransactionCategoryKey } from './categories';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

export function startOfMonth(date) {
  const parts = getVietnamDateParts(date);
  return new Date(parts.year, parts.month, 1);
}

export function endOfMonth(date) {
  const parts = getVietnamDateParts(date);
  return new Date(parts.year, parts.month + 1, 0);
}

export function isSameMonth(left, right) {
  return isSameVietnamMonth(left, right);
}

export function getTransactionsForDay(transactions, selectedDate) {
  return transactions.filter((item) => isSameVietnamDay(toDate(item.createdAt), selectedDate));
}

export function getTransactionsForMonth(transactions, selectedDate) {
  return transactions.filter((item) =>
    isSameMonth(toDate(item.createdAt), selectedDate)
  );
}

function sumTransactions(transactions, type) {
  return transactions
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + item.amount, 0);
}

function groupExpenseByCategory(transactions) {
  return transactions
    .filter((item) => item.type === 'expense')
    .reduce((accumulator, item) => {
      accumulator[item.category] = (accumulator[item.category] || 0) + item.amount;
      return accumulator;
    }, {});
}

function groupExpenseByBudgetCategory(transactions) {
  return transactions
    .filter((item) => item.type === 'expense')
    .reduce((accumulator, item) => {
      const categoryKey = getTransactionCategoryKey(item);
      accumulator[categoryKey] = (accumulator[categoryKey] || 0) + item.amount;
      return accumulator;
    }, {});
}

function getDistinctDayCount(transactions) {
  return new Set(transactions.map((item) => getVietnamDayKey(item.createdAt))).size;
}

function getScoreLabel(score) {
  if (score >= 85) {
    return t('score_excellent');
  }

  if (score >= 70) {
    return t('score_healthy');
  }

  if (score >= 55) {
    return t('score_tuning');
  }

  return t('score_risk');
}

function getScoreTone(score) {
  if (score >= 85) {
    return 'success';
  }

  if (score >= 70) {
    return 'info';
  }

  if (score >= 55) {
    return 'warning';
  }

  return 'alert';
}

function buildAnomaly(expenseTransactions, averageExpense) {
  if (expenseTransactions.length === 0) {
    return null;
  }

  const sortedExpenses = [...expenseTransactions].sort((left, right) => right.amount - left.amount);
  const largestExpense = sortedExpenses[0];

  if (
    expenseTransactions.length >= 3 &&
    largestExpense.amount >= averageExpense * 1.8
  ) {
    return {
      title: t('spike_detected'),
      message: t('spike_detected_desc', { title: largestExpense.title }),
      accent: largestExpense.tint,
      type: 'alert',
    };
  }

  return {
    title: t('no_major_anomaly'),
    message: t('no_major_anomaly_desc'),
    accent: '#1d9c63',
    type: 'success',
  };
}

export function buildMonthlyBudgetSnapshot(data, selectedDate) {
  const monthTransactions = getTransactionsForMonth(data.transactions, selectedDate);
  const groupedExpenses = groupExpenseByBudgetCategory(monthTransactions);

  return data.budgets.map((budget) => {
    const spent = groupedExpenses[getBudgetCategoryKey(budget)] || 0;
    const progress = budget.limit > 0 ? spent / budget.limit : 0;

    return {
      ...budget,
      spent,
      progress,
      remaining: Math.max(budget.limit - spent, 0),
      isOverLimit: spent > budget.limit,
      isNearLimit: spent >= budget.limit * 0.85,
    };
  });
}

export function analyzeFinance(data, selectedDate) {
  const monthTransactions = getTransactionsForMonth(data.transactions, selectedDate);
  const dayTransactions = getTransactionsForDay(data.transactions, selectedDate);
  const monthIncome = sumTransactions(monthTransactions, 'income');
  const monthExpense = sumTransactions(monthTransactions, 'expense');
  const totalBalance = data.wallets.reduce((sum, wallet) => sum + wallet.amount, 0);
  const expenseTransactions = monthTransactions.filter((item) => item.type === 'expense');
  const distinctActiveDays = getDistinctDayCount(monthTransactions);
  const daysInMonth = getVietnamDaysInMonth(selectedDate);
  const observedDays = clamp(getVietnamDateParts(selectedDate).day, 1, daysInMonth);
  const averageDailyExpense = monthExpense / observedDays;
  const projectedExpense = Math.round(averageDailyExpense * daysInMonth);
  const projectedSavings = monthIncome - projectedExpense;
  const budgetSnapshot = buildMonthlyBudgetSnapshot(data, selectedDate);
  const totalBudget = budgetSnapshot.reduce((sum, budget) => sum + budget.limit, 0);
  const groupedExpenses = groupExpenseByCategory(monthTransactions);
  const topCategoryEntry = Object.entries(groupedExpenses).sort((left, right) => right[1] - left[1])[0];
  const topCategory = topCategoryEntry
    ? {
        category: topCategoryEntry[0],
        amount: topCategoryEntry[1],
        share: monthExpense > 0 ? topCategoryEntry[1] / monthExpense : 0,
      }
    : null;
  const averageExpense =
    expenseTransactions.length > 0
      ? expenseTransactions.reduce((sum, item) => sum + item.amount, 0) / expenseTransactions.length
      : 0;
  const anomaly = buildAnomaly(expenseTransactions, averageExpense || 1);
  const overspentBudgets = budgetSnapshot.filter((budget) => budget.isOverLimit);
  const warningBudgets = budgetSnapshot.filter(
    (budget) => !budget.isOverLimit && budget.isNearLimit
  );
  const savingsRate = monthIncome > 0 ? (monthIncome - monthExpense) / monthIncome : 0;
  const loggingConsistency = distinctActiveDays / observedDays;

  let score = 58;
  score += clamp(Math.round(savingsRate * 35), -18, 24);
  score += clamp(Math.round(loggingConsistency * 18), 0, 18);
  score -= overspentBudgets.length * 8;
  score -= warningBudgets.length * 4;

  if (projectedExpense > monthIncome && monthIncome > 0) {
    score -= 10;
  } else if (projectedSavings > 0 && monthIncome > 0) {
    score += 6;
  }

  score = clamp(score, 0, 99);

  const smartTips = [];

  if (topCategory && topCategory.share >= 0.35) {
    const potentialSavings = Math.round(topCategory.amount * 0.15);
    smartTips.push(
      t('tip_cutting', {
        category: topCategory.category,
        amount: formatCurrency(potentialSavings),
      })
    );
  }

  if (projectedExpense > monthExpense && observedDays < daysInMonth) {
    const dailyCap = Math.max(Math.round((projectedExpense - monthExpense) / (daysInMonth - observedDays || 1)), 0);
    smartTips.push(
      t('tip_daily_cap', {
        amount: formatCurrency(dailyCap),
      })
    );
  }

  if (overspentBudgets.length > 0) {
    smartTips.push(
      t('tip_budget_pressure', { category: overspentBudgets[0].category })
    );
  } else if (warningBudgets.length > 0) {
    smartTips.push(
      t('tip_budget_close', { category: warningBudgets[0].category })
    );
  } else if (monthIncome > monthExpense && monthIncome > 0) {
    smartTips.push(t('tip_surplus'));
  }

  return {
    selectedDate,
    dayTransactions,
    monthTransactions,
    monthIncome,
    monthExpense,
    totalBalance,
    projectedExpense,
    projectedSavings,
    averageDailyExpense: Math.round(averageDailyExpense),
    observedDays,
    daysInMonth,
    totalBudget,
    topCategory,
    anomaly,
    budgetSnapshot,
    overspentBudgets,
    warningBudgets,
    score: {
      value: score,
      label: getScoreLabel(score),
      tone: getScoreTone(score),
    },
    smartTips: smartTips.slice(0, 3),
    forecast: {
      status:
        projectedExpense > monthIncome && monthIncome > 0
          ? 'risk'
          : totalBudget > 0 && projectedExpense > totalBudget
            ? 'budget-risk'
            : 'stable',
      projectedExpense,
      projectedSavings,
      averageDailyExpense: Math.round(averageDailyExpense),
      remainingDays: Math.max(daysInMonth - observedDays, 0),
    },
  };
}
