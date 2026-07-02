/**
 * EmptyState — placeholder shown when there is no chat or no model.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, fontSize, fontFamily } from '../theme/colors';

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={56} color={colors.textSubtle} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600', fontFamily: fontFamily.body, marginTop: spacing.md, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center', maxWidth: 280, lineHeight: fontSize.sm * 1.5 },
});
