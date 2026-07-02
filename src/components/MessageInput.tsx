/**
 * MessageInput — auto-growing text input with a send/stop button.
 * Switches to "Stop" while a completion is streaming.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ViewStyle,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius, fontSize, fontFamily, layout } from '../theme/colors';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, onStop, isGenerating, disabled, placeholder }: Props) {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(layout.inputBarHeight);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isGenerating) inputRef.current?.focus();
  }, [isGenerating]);

  const canSend = text.trim().length > 0 && !disabled && !isGenerating;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
    setInputHeight(layout.inputBarHeight);
  };

  const handleStop = () => {
    onStop();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, { height: Math.max(layout.inputBarHeight, inputHeight) }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder ?? 'Message HandyAi…'}
          placeholderTextColor={colors.textSubtle}
          multiline
          editable={!disabled}
          onContentSizeChange={(e) => {
            const h = e.nativeEvent.contentSize.height + 24;
            setInputHeight(Math.min(Math.max(h, layout.inputBarHeight), 200));
          }}
          submitBehavior="newline"
        />

        {isGenerating ? (
          <TouchableOpacity style={styles.stopButton} onPress={handleStop} activeOpacity={0.7}>
            <Icon name="stop-circle" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            <Icon name="arrow-up" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  } as ViewStyle,
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    maxHeight: 200,
    minHeight: layout.inputBarHeight,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceVariant,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
