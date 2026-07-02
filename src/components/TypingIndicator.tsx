/**
 * TypingIndicator — three pulsing dots shown when waiting for the first token.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { colors, spacing, radius } from '../theme/colors';

export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const make = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
      );

    const a1 = make(dot1, 0);
    const a2 = make(dot2, 200);
    const a3 = make(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  dot: {
    width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.textMuted,
  },
});
