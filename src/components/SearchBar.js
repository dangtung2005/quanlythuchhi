import React, { useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../utils/formatters';

export default function SearchBar({ value, onChangeText, theme }) {
  const styles = createStyles(theme);
  const inputRef = useRef(null);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const onBlur = () => {
    if (!value) {
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const clearSearch = () => {
    onChangeText('');
    inputRef.current?.blur();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.border, theme.accent],
  });

  return (
    <Animated.View style={[styles.container, { borderColor }]}>
      <Ionicons name="search-outline" size={20} color={theme.textMuted} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={t('search_placeholder')}
        placeholderTextColor={theme.textSoft}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {value ? (
        <TouchableOpacity onPress={clearSearch} style={styles.clear}>
          <Ionicons name="close-circle" size={18} color={theme.textSoft} />
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      height: 52,
      borderWidth: 1,
      marginBottom: 18,
    },
    input: {
      flex: 1,
      marginLeft: 10,
      fontSize: 15,
      color: theme.text,
      paddingVertical: 0,
    },
    clear: {
      padding: 4,
    },
  });
}
