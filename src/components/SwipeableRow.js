import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

export default function SwipeableRow({ children, onDelete }) {
  const swipeableRef = useRef(null);

  function handleDelete() {
    swipeableRef.current?.close();
    onDelete();
  }

  function renderRightActions(progress, dragX) {
    const scale = dragX.interpolate({
      inputRange: [-96, -24, 0],
      outputRange: [1, 0.92, 0.84],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-96, -32, 0],
      outputRange: [1, 0.85, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <RectButton style={styles.deleteAction} onPress={handleDelete}>
        <Animated.View style={{ alignItems: 'center', opacity, transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={22} color="#ffffff" />
          <Text style={styles.deleteText}>Xóa</Text>
        </Animated.View>
      </RectButton>
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={28}
      overshootRight={false}
      friction={1.35}
      overshootFriction={8}
      dragOffsetFromRightEdge={18}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          handleDelete();
        }
      }}
    >
      <View style={styles.content}>{children}</View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    width: 96,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: '#d56539',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    marginTop: 4,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  content: {
    backgroundColor: 'transparent',
  },
});
