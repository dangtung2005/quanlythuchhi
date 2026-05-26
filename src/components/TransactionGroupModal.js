import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TransactionItem from './TransactionItem';

export default function TransactionGroupModal({
  visible,
  title,
  transactions,
  walletMap,
  onClose,
  onSelectTransaction,
  onDeleteTransaction,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose}>
              <Ionicons name="close" size={24} color="#2d241c" />
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có giao dịch trong nhóm này.</Text>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              bounces={false}
              directionalLockEnabled
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TransactionItem
                  item={item}
                  walletName={walletMap[item.walletId]}
                  onPress={() => {
                    onSelectTransaction(item);
                    onClose();
                  }}
                  onDelete={() => onDeleteTransaction(item.id)}
                />
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(25, 18, 10, 0.35)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff9f0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 34,
    maxHeight: '78%',
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
  emptyText: {
    fontSize: 15,
    color: '#8a7863',
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 6,
  },
});
