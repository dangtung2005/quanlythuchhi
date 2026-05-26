import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { createAppStyles } from '../styles/appStyles';

export default function SectionHeader({ title, actionText, onActionPress, theme }) {
  const appStyles = createAppStyles(theme);

  return (
    <View style={appStyles.sectionHeader}>
      <Text style={appStyles.sectionTitle}>{title}</Text>
      {actionText ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onActionPress}>
          <Text style={appStyles.sectionLink}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
