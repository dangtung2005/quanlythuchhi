import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AddTransactionModal from './src/components/AddTransactionModal';
import DateFilterModal from './src/components/DateFilterModal';
import EditBudgetModal from './src/components/EditBudgetModal';
import EditWalletModal from './src/components/EditWalletModal';
import TransactionGroupModal from './src/components/TransactionGroupModal';
import HomeScreen from './src/screens/HomeScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SmartScreen from './src/screens/SmartScreen';
import WalletsScreen from './src/screens/WalletsScreen';
import { useFinanceApp } from './src/hooks/useFinanceApp';
import { exportFinanceDataToCsv, importFinanceDataFromCsv } from './src/utils/csvPortability';
import { getVietnamDateParts } from './src/utils/dateTime';
import { analyzeFinance, getTransactionsForMonth } from './src/utils/smartInsights';
import { formatCurrency, formatDateBadge, setAppPreferences, t } from './src/utils/formatters';
import { resolveTheme } from './src/styles/theme';

export default function App() {
  const systemScheme = useColorScheme();
  const {
    data,
    loading,
    saving,
    addBudget,
    addWallet,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteWallet,
    updateWallet,
    updateBudget,
    deleteBudget,
    updateSettings,
    replaceData,
    resetDemo,
  } = useFinanceApp();

  const [activeTab, setActiveTab] = useState('home');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [transactionGroupVisible, setTransactionGroupVisible] = useState(false);
  const [transactionGroupConfig, setTransactionGroupConfig] = useState({
    title: '',
    transactions: [],
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setAppPreferences(data.settings);
    }
  }, [data?.settings]);

  const theme = resolveTheme(data?.settings?.appearance, systemScheme);
  const styles = createStyles(theme);

  const tabs = [
    { key: 'home', label: t('tab_home'), icon: 'home' },
    { key: 'reports', label: t('tab_reports'), icon: 'pie-chart-outline' },
    { key: 'smart', label: 'Thông minh', icon: 'sparkles-outline', isCenter: true },
    { key: 'wallets', label: t('tab_wallets'), icon: 'wallet-outline' },
    { key: 'profile', label: t('tab_profile'), icon: 'person-outline' },
  ];

  async function handleExportCsv() {
    if (!data) {
      return;
    }

    try {
      const csvContent = exportFinanceDataToCsv(data);
      const fileUri = `${FileSystem.cacheDirectory}quanlythuchi-export.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: t('export_csv'),
        });
      } else {
        Alert.alert(t('export_csv'), t('export_csv_success'));
      }
    } catch (error) {
      Alert.alert(t('export_csv'), String(error?.message || error));
    }
  }

  async function handleImportCsv() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'public.comma-separated-values-text'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const csvContent = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const importedData = importFinanceDataFromCsv(csvContent);
      await replaceData(importedData);
      Alert.alert(t('import_csv'), t('import_csv_success'));
    } catch (error) {
      const message =
        error?.message === 'INVALID_FINANCE_CSV'
          ? `${t('import_csv_failed')}\n\nFile cần đúng định dạng CSV đã xuất từ app hoặc CSV giao dịch có cột số tiền và loại giao dịch.`
          : String(error?.message || error || t('import_csv_failed'));
      Alert.alert(t('import_csv'), message);
    }
  }

  function openAddModal(type = 'expense') {
    setEditingTransaction(null);
    setModalType(type);
    setModalVisible(true);
  }

  function openEditModal(transaction) {
    setEditingTransaction(transaction);
    setModalType(transaction.type);
    setModalVisible(true);
  }

  function openEditWalletModal(wallet) {
    setEditingWallet(wallet);
    setWalletModalVisible(true);
  }

  function openCreateWalletModal() {
    setEditingWallet(null);
    setWalletModalVisible(true);
  }

  function openEditBudgetModal(budget) {
    setEditingBudget(budget);
    setBudgetModalVisible(true);
  }

  function openTransactionGroup(config) {
    setTransactionGroupConfig(config);
    setTransactionGroupVisible(true);
  }

  function handleTabChange(tabKey) {
    setShowNotifications(false);
    setActiveTab(tabKey);
  }

  function handleQuickAction(action) {
    if (action.type) {
      openAddModal(action.type);
      return;
    }

    if (action.tab) {
      handleTabChange(action.tab);
    }
  }

  async function handleSubmitTransaction(payload) {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, payload);
      setEditingTransaction(null);
      return;
    }

    await addTransaction(payload);
  }

  function handleReadNotification(notificationId) {
    setReadNotificationIds((current) =>
      current.includes(notificationId) ? current : [...current, notificationId]
    );
  }

  function handleMarkAllNotificationsRead(notificationIds) {
    if (!notificationIds.length) {
      return;
    }

    setReadNotificationIds((current) => [
      ...current,
      ...notificationIds.filter((id) => !current.includes(id)),
    ]);
  }

  function renderScreen() {
    if (!data) {
      return null;
    }

    if (activeTab === 'home') {
      return (
        <HomeScreen
          data={data}
          theme={theme}
          onQuickAction={handleQuickAction}
          onOpenReports={() => handleTabChange('reports')}
          onEditTransaction={openEditModal}
          onOpenTransactionGroup={openTransactionGroup}
          selectedDate={selectedDate}
          onOpenDateFilter={() => setDateModalVisible(true)}
          onOpenNotifications={() => setShowNotifications(true)}
          notificationCount={notificationCount}
        />
      );
    }

    if (activeTab === 'reports') {
      return (
        <ReportsScreen
          data={data}
          theme={theme}
          selectedDate={selectedDate}
          onEditBudget={openEditBudgetModal}
          onEditTransaction={openEditModal}
          onDeleteBudget={deleteBudget}
          onChangeMonth={handleChangeMonth}
          onOpenDateFilter={() => setDateModalVisible(true)}
          onOpenTransactionGroup={openTransactionGroup}
        />
      );
    }

    if (activeTab === 'smart') {
      return (
        <SmartScreen
          data={data}
          theme={theme}
          selectedDate={selectedDate}
          onOpenDateFilter={() => setDateModalVisible(true)}
          onOpenReports={() => handleTabChange('reports')}
          onOpenTransactionGroup={openTransactionGroup}
        />
      );
    }

    if (activeTab === 'wallets') {
      return (
        <WalletsScreen
          data={data}
          theme={theme}
          onEditWallet={openEditWalletModal}
          onAddWallet={openCreateWalletModal}
        />
      );
    }

    return (
      <ProfileScreen
        data={data}
        theme={theme}
        saving={saving}
        onUpdateSettings={updateSettings}
        onExportCsv={handleExportCsv}
        onImportCsv={handleImportCsv}
        onReset={resetDemo}
        onBack={() => setActiveTab('home')}
      />
    );
  }

  const walletMap = data
    ? Object.fromEntries(data.wallets.map((wallet) => [wallet.id, wallet.name]))
    : {};

  function buildNotifications() {
    if (!data) return [];
    const insights = analyzeFinance(data, selectedDate);
    const transactions = data.transactions;
    const items = [];
    const latestTransaction = transactions[0];

    if (insights.overspentBudgets.length > 0) {
      items.push({
        id: `budget-over-${insights.overspentBudgets[0].id}`,
        title: t('notification_budget_over', { category: insights.overspentBudgets[0].category }),
        message: t('notification_budget_over_desc'),
        timeLabel: t('monthly_budget_map'),
        category: 'Budget',
        tone: 'alert',
        defaultUnread: true,
      });
    } else if (insights.warningBudgets.length > 0) {
      items.push({
        id: `budget-warning-${insights.warningBudgets[0].id}`,
        title: t('notification_budget_near', { category: insights.warningBudgets[0].category }),
        message: t('notification_budget_near_desc'),
        timeLabel: t('monthly_budget_map'),
        category: 'Budget',
        tone: 'warning',
        defaultUnread: true,
      });
    }

    if (insights.forecast.status === 'risk') {
      items.push({
        id: 'forecast-risk',
        title: t('notification_forecast_risk'),
        message: t('notification_forecast_risk_desc', {
          amount: formatCurrency(Math.abs(insights.projectedSavings)),
        }),
        timeLabel: t('forecast'),
        category: 'Forecast',
        tone: 'alert',
        defaultUnread: true,
      });
    }

    if (insights.anomaly && insights.anomaly.type === 'alert') {
      items.push({
        id: 'anomaly-spike',
        title: insights.anomaly.title,
        message: insights.anomaly.message,
        timeLabel: t('notification_pattern_scan'),
        category: t('notification_insight'),
        tone: 'warning',
        defaultUnread: true,
      });
    }

    if (insights.dayTransactions.length === 0) {
      items.push({
        id: 'daily-reminder',
        title: t('notification_no_transaction'),
        message: t('notification_no_transaction_desc', {
          date: formatDateBadge(selectedDate),
        }),
        timeLabel: formatDateBadge(selectedDate),
        category: t('notification_reminder'),
        tone: 'info',
        defaultUnread: true,
      });
    }

    if (latestTransaction) {
      items.push({
        id: `latest-${latestTransaction.id}`,
        title:
          latestTransaction.type === 'income'
            ? t('notification_income_captured', { title: latestTransaction.title })
            : t('notification_expense_captured', { title: latestTransaction.title }),
        message: t('notification_captured_desc', {
          amount: formatCurrency(latestTransaction.amount),
        }),
        timeLabel: formatDateBadge(new Date(latestTransaction.createdAt)),
        category: latestTransaction.type === 'income' ? t('category_income') : t('category_expense'),
        tone: latestTransaction.type === 'income' ? 'success' : 'info',
        defaultUnread: false,
      });
    }

    return items.slice(0, 5).map((item) => ({
      ...item,
      isUnread: item.defaultUnread && !readNotificationIds.includes(item.id),
    }));
  }

  const notifications = data ? buildNotifications() : [];
  const unreadNotificationIds = notifications
    .filter((item) => item.isUnread)
    .map((item) => item.id);
  const notificationCount = unreadNotificationIds.length;

  function handleOpenNotification(notification) {
    if (!notification.isUnread) return;
    handleReadNotification(notification.id);
  }

  function handleMarkAllNotificationsReadFromScreen() {
    handleMarkAllNotificationsRead(unreadNotificationIds);
  }

  function handleChangeMonth(delta) {
    setSelectedDate((current) => {
      const parts = getVietnamDateParts(current);
      return new Date(parts.year, parts.month + delta, 1);
    });
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />

        <View style={styles.container}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={styles.loadingText}>{t('loading_data')}</Text>
            </View>
          ) : showNotifications && data ? (
            <NotificationScreen
              notifications={notifications}
              onSelectNotification={handleOpenNotification}
              onMarkAllAsRead={handleMarkAllNotificationsReadFromScreen}
              onBack={() => setShowNotifications(false)}
              theme={theme}
            />
          ) : (
            renderScreen()
          )}

          {data ? (
            <AddTransactionModal
              visible={modalVisible}
              onClose={() => {
                setModalVisible(false);
                setEditingTransaction(null);
              }}
              onSubmit={handleSubmitTransaction}
              wallets={data.wallets}
              saving={saving}
              defaultType={modalType}
              initialTransaction={editingTransaction}
            />
          ) : null}

          <EditWalletModal
            visible={walletModalVisible}
            onClose={() => {
              setWalletModalVisible(false);
              setEditingWallet(null);
            }}
            onSubmit={editingWallet ? updateWallet : addWallet}
            onDelete={deleteWallet}
            wallet={editingWallet}
            saving={saving}
            isCreateMode={!editingWallet}
          />

          <EditBudgetModal
            visible={budgetModalVisible}
            onClose={() => {
              setBudgetModalVisible(false);
              setEditingBudget(null);
            }}
            onSubmit={editingBudget ? updateBudget : addBudget}
            budget={editingBudget}
            saving={saving}
            isCreateMode={!editingBudget}
          />

          <DateFilterModal
            visible={dateModalVisible}
            selectedDate={selectedDate}
            onClose={() => setDateModalVisible(false)}
            onSubmit={setSelectedDate}
          />

          <TransactionGroupModal
            visible={transactionGroupVisible}
            onClose={() => setTransactionGroupVisible(false)}
            title={transactionGroupConfig.title}
            transactions={transactionGroupConfig.transactions}
            walletMap={walletMap}
            onSelectTransaction={openEditModal}
            onDeleteTransaction={deleteTransaction}
          />

          <View style={styles.bottomBar}>
            <View style={styles.bottomRow}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.85}
                  style={[
                    styles.bottomItem,
                    tab.isCenter && styles.bottomItemCenter,
                    isActive && styles.bottomItemActive,
                  ]}
                  onPress={() => handleTabChange(tab.key)}
                >
                  <View
                    style={[
                      styles.bottomIconWrap,
                      isActive && styles.bottomIconWrapActive,
                      tab.isCenter && styles.bottomIconWrapCenter,
                    ]}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={tab.isCenter ? 21 : 20}
                      color={isActive ? theme.accent : theme.bottomInactive}
                    />
                  </View>
                  <Text
                    style={[
                      styles.bottomText,
                      tab.isCenter && styles.bottomTextCenter,
                      isActive && styles.bottomTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
                );
              })}
            </View>

            <View pointerEvents="box-none" style={styles.addButtonWrap}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.addButton}
                onPress={() => openAddModal()}
              >
                <Ionicons name="add" size={30} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1 },
    safeArea: { flex: 1, backgroundColor: theme.background },
    container: { flex: 1, backgroundColor: theme.background },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    loadingText: { marginTop: 14, fontSize: 15, color: theme.textMuted },
    bottomBar: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 18,
      backgroundColor: theme.bottomBar,
      borderRadius: 30,
      paddingHorizontal: 10,
      paddingTop: 34,
      paddingBottom: 12,
      borderWidth: 1,
      borderColor: theme.bottomBarBorder,
      shadowColor: theme.mode === 'dark' ? '#000000' : '#0e3a2b',
      shadowOpacity: theme.mode === 'dark' ? 0.24 : 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
      overflow: 'visible',
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bottomItem: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 2,
      borderRadius: 18,
    },
    bottomItemCenter: {
      paddingTop: 20,
    },
    bottomItemActive: {
      backgroundColor: theme.surfaceAlt,
    },
    bottomIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomIconWrapActive: {
      backgroundColor: theme.accentSoft,
    },
    bottomIconWrapCenter: {
      marginTop: 4,
    },
    bottomText: {
      marginTop: 4,
      fontSize: 10,
      lineHeight: 12,
      color: theme.bottomInactive,
      fontWeight: '700',
      textAlign: 'center',
    },
    bottomTextCenter: {
      fontSize: 9,
    },
    bottomTextActive: { color: theme.accentStrong },
    addButtonWrap: {
      position: 'absolute',
      top: -24,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 2,
    },
    addButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 5,
      borderColor: theme.bottomBar,
      shadowColor: theme.mode === 'dark' ? '#000000' : '#0e5b3d',
      shadowOpacity: 0.22,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
  });
}
