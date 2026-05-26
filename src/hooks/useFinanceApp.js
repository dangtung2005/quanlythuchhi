import React from 'react';
import { financeApi } from '../api/financeApi';

export function useFinanceApp() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const nextData = await financeApi.getDashboard();
      setData(nextData);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const addTransaction = React.useCallback(async (transaction) => {
    setSaving(true);
    try {
      const nextData = await financeApi.addTransaction(transaction);
      setData(nextData);
      return nextData;
    } finally {
      setSaving(false);
    }
  }, []);

  const addBudget = React.useCallback(async (budget) => {
    setSaving(true);
    try {
      const nextData = await financeApi.addBudget(budget);
      setData(nextData);
      return nextData;
    } finally {
      setSaving(false);
    }
  }, []);

  const resetDemo = React.useCallback(async () => {
    setSaving(true);
    try {
      const nextData = await financeApi.reset();
      setData(nextData);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateTransaction = React.useCallback(async (transactionId, updates) => {
    setSaving(true);
    try {
      const nextData = await financeApi.updateTransaction(transactionId, updates);
      setData(nextData);
      return nextData;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateWallet = React.useCallback(async (walletId, updates) => {
    setSaving(true);
    try {
      const nextData = await financeApi.updateWallet(walletId, updates);
      setData(nextData);
      return nextData;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteTransaction = React.useCallback(async (transactionId) => {
    setSaving(true);
    try {
      const nextData = await financeApi.deleteTransaction(transactionId);
      setData(nextData);
      return nextData;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateBudget = React.useCallback(async (budgetId, updates) => {
    setSaving(true);
    try {
      const nextData = await financeApi.updateBudget(budgetId, updates);
      setData(nextData);
      return nextData;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteBudget = React.useCallback(async (budgetId) => {
    setSaving(true);
    try {
      const nextData = await financeApi.deleteBudget(budgetId);
      setData(nextData);
      return nextData;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateSettings = React.useCallback(async (updates) => {
    setSaving(true);
    try {
      const nextData = await financeApi.updateSettings(updates);
      setData(nextData);
      return nextData;
    } finally {
      setSaving(false);
    }
  }, []);

  const replaceData = React.useCallback(async (nextData) => {
    setSaving(true);
    try {
      const savedData = await financeApi.replaceData(nextData);
      setData(savedData);
      return savedData;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    data,
    loading,
    saving,
    addBudget,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateWallet,
    updateBudget,
    deleteBudget,
    updateSettings,
    replaceData,
    resetDemo,
  };
}
