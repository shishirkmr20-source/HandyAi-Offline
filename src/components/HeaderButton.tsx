/**
 * HeaderButton — small reusable header action button.
 */
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius } from '../theme/colors';

interface Props {
  icon: string;
  onPress: () => void;
  color?: string;
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

export function HeaderButton({ icon, onPress, color = colors.text, size = 24, style, testID }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.6}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      testID={testID}
    >
      <Icon name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
});
