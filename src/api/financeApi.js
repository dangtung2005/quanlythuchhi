import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORY_PRESETS, DEFAULT_DATA } from '../data/seedData';
import {
  getBudgetCategoryKey,
  getTransactionCategoryKey,
  resolveCategoryKey,
} from '../utils/categories';
import { serializeVietnamDateTime } from '../utils/dateTime';

const STORAGE_KEY = 'quanlythuchi.finance.data.v2';
const LEGACY_TEXT_MAP = {
  'VÃ­ tiá»n máº·t': 'Ví tiền mặt',
  'TÃ i khoáº£n ngÃ¢n hÃ ng': 'Tài khoản ngân hàng',
  'Quá»¹ tiáº¿t kiá»‡m': 'Quỹ tiết kiệm',
  'Ä‚n uá»‘ng': 'Ăn uống',
  'Di chuyá»ƒn': 'Di chuyển',
  'Mua sáº¯m': 'Mua sắm',
  'Giáº£i trÃ­': 'Giải trí',
  'Há»c táº­p': 'Học tập',
  'HÃ³a Ä‘Æ¡n': 'Hóa đơn',
  'Thu nháº­p': 'Thu nhập',
  'ThÆ°á»Ÿng': 'Thưởng',
  'Mua sáº¯m quáº§n Ã¡o': 'Mua sắm quần áo',
  'Ä‚n tá»‘i láº©u Kichi': 'Ăn tối lẩu Kichi',
  'Tiá»n Grab Ä‘i lÃ m': 'Tiền Grab đi làm',
  'Mua giÃ y sneaker': 'Mua giày sneaker',
  'GiÃ y cháº¡y bá»™ má»›i': 'Giày chạy bộ mới',
  'ThÆ°á»Ÿng dá»± Ã¡n A': 'Thưởng dự án A',
  'HoÃ n thÃ nh milestone 1': 'Hoàn thành milestone 1',
  'Tiá»n Ä‘iá»‡n thÃ¡ng 4': 'Tiền điện tháng 4',
  'Ä‚n trÆ°a Buffet': 'Ăn trưa Buffet',
  'VÃ© xem phim IMAX': 'Vé xem phim IMAX',
  'Mua sÃ¡ch ká»¹ nÄƒng': 'Mua sách kỹ năng',
  'ÄÄƒng kÃ½ Netflix': 'Đăng ký Netflix',
  'Ä‚n trÆ°a vÄƒn phÃ²ng': 'Ăn trưa văn phòng',
  'LÆ°Æ¡ng thÃ¡ng 4': 'Lương tháng 4',
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function repairLegacyText(value) {
  if (typeof value === 'string') {
    return LEGACY_TEXT_MAP[value] || value;
  }

  if (Array.isArray(value)) {
    return value.map(repairLegacyText);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, repairLegacyText(item)])
    );
  }

  return value;
}

function normalizeWallet(wallet) {
  return {
    ...wallet,
    name: repairLegacyText(wallet.name),
  };
}

function normalizeTransaction(transaction) {
  const category = repairLegacyText(transaction.category);

  return {
    ...transaction,
    title: repairLegacyText(transaction.title),
    note: repairLegacyText(transaction.note || ''),
    category,
    categoryKey:
      transaction.categoryKey || resolveCategoryKey(category, CATEGORY_PRESETS),
  };
}

function recalculateBudgets(budgets, transactions) {
  const spendMap = transactions.reduce((accumulator, transaction) => {
    if (transaction.type !== 'expense') {
      return accumulator;
    }

    const categoryKey = getTransactionCategoryKey(transaction);
    accumulator[categoryKey] = (accumulator[categoryKey] || 0) + transaction.amount;
    return accumulator;
  }, {});

  return budgets.map((budget) => {
    const category = repairLegacyText(budget.category);
    const categoryKey =
      budget.categoryKey || resolveCategoryKey(category, CATEGORY_PRESETS);

    return {
      ...budget,
      category,
      categoryKey,
      spent: spendMap[categoryKey] || 0,
    };
  });
}

function prepareFinanceData(data) {
  const repaired = repairLegacyText(data);
  const { securityMode, ...storedSettings } = repaired.settings || {};
  const settings = {
    ...DEFAULT_DATA.settings,
    ...storedSettings,
  };
  const wallets = (repaired.wallets || DEFAULT_DATA.wallets).map(normalizeWallet);
  const transactions = (repaired.transactions || DEFAULT_DATA.transactions).map(normalizeTransaction);
  const budgets = recalculateBudgets(repaired.budgets || DEFAULT_DATA.budgets, transactions);

  return {
    ...DEFAULT_DATA,
    ...repaired,
    settings,
    wallets,
    transactions,
    budgets,
  };
}

async function readFinanceData() {
  await delay(250);
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  }

  const parsed = JSON.parse(raw);
  const nextData = prepareFinanceData(parsed);

  if (JSON.stringify(nextData) !== JSON.stringify(parsed)) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
  }

  return nextData;
}

async function saveFinanceData(data) {
  await delay(150);
  const normalizedData = prepareFinanceData(data);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData));
  return normalizedData;
}

export const financeApi = {
  async getDashboard() {
    return readFinanceData();
  },

  async addBudget(budget) {
    const data = await readFinanceData();
    const budgets = [
      {
        id: `b${Date.now()}`,
        category: budget.category.trim(),
        categoryKey: resolveCategoryKey(budget.category, CATEGORY_PRESETS),
        limit: budget.limit,
        spent: 0,
      },
      ...data.budgets,
    ];

    return saveFinanceData({ ...data, budgets });
  },

  async addTransaction(transaction) {
    const data = await readFinanceData();

    const transactions = [
      {
        id: `t${Date.now()}`,
        ...transaction,
        categoryKey:
          transaction.categoryKey ||
          resolveCategoryKey(transaction.category, CATEGORY_PRESETS),
        createdAt: serializeVietnamDateTime(new Date()),
      },
      ...data.transactions,
    ];

    const wallets = data.wallets.map((wallet) => {
      if (wallet.id !== transaction.walletId) {
        return wallet;
      }

      const delta =
        transaction.type === 'income' ? transaction.amount : -transaction.amount;

      return { ...wallet, amount: wallet.amount + delta };
    });

    return saveFinanceData({ ...data, transactions, wallets });
  },

  async updateTransaction(transactionId, updates) {
    const data = await readFinanceData();
    const currentTransaction = data.transactions.find(
      (item) => item.id === transactionId
    );

    if (!currentTransaction) {
      return data;
    }

    const nextTransaction = {
      ...currentTransaction,
      ...updates,
      categoryKey:
        updates.categoryKey ||
        currentTransaction.categoryKey ||
        resolveCategoryKey(updates.category || currentTransaction.category, CATEGORY_PRESETS),
    };

    const transactions = data.transactions.map((item) =>
      item.id === transactionId ? nextTransaction : item
    );

    const wallets = data.wallets.map((wallet) => {
      let nextAmount = wallet.amount;

      if (wallet.id === currentTransaction.walletId) {
        nextAmount +=
          currentTransaction.type === 'income'
            ? -currentTransaction.amount
            : currentTransaction.amount;
      }

      if (wallet.id === nextTransaction.walletId) {
        nextAmount +=
          nextTransaction.type === 'income'
            ? nextTransaction.amount
            : -nextTransaction.amount;
      }

      return { ...wallet, amount: nextAmount };
    });

    return saveFinanceData({ ...data, transactions, wallets });
  },

  async deleteTransaction(transactionId) {
    const data = await readFinanceData();
    const currentTransaction = data.transactions.find(
      (item) => item.id === transactionId
    );

    if (!currentTransaction) {
      return data;
    }

    const transactions = data.transactions.filter((item) => item.id !== transactionId);

    const wallets = data.wallets.map((wallet) => {
      if (wallet.id !== currentTransaction.walletId) {
        return wallet;
      }

      return {
        ...wallet,
        amount:
          wallet.amount +
          (currentTransaction.type === 'income'
            ? -currentTransaction.amount
            : currentTransaction.amount),
      };
    });

    return saveFinanceData({ ...data, transactions, wallets });
  },

  async updateWallet(walletId, updates) {
    const data = await readFinanceData();
    const wallets = data.wallets.map((wallet) =>
      wallet.id === walletId ? { ...wallet, ...updates } : wallet
    );

    return saveFinanceData({ ...data, wallets });
  },

  async updateBudget(budgetId, updates) {
    const data = await readFinanceData();
    const budgets = data.budgets.map((budget) =>
      budget.id === budgetId
        ? {
            ...budget,
            ...updates,
            category: updates.category.trim(),
            categoryKey: getBudgetCategoryKey(budget),
          }
        : budget
    );

    return saveFinanceData({ ...data, budgets });
  },

  async deleteBudget(budgetId) {
    const data = await readFinanceData();
    const budgets = data.budgets.filter((budget) => budget.id !== budgetId);
    return saveFinanceData({ ...data, budgets });
  },

  async updateSettings(updates) {
    const data = await readFinanceData();
    return saveFinanceData({
      ...data,
      settings: {
        ...data.settings,
        ...updates,
      },
    });
  },

  async replaceData(nextData) {
    return saveFinanceData(nextData);
  },

  async reset() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  },
};
