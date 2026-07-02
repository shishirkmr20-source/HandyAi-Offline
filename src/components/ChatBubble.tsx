/**
 * ChatBubble — renders a single message.
 * User messages get the indigo bubble on the right; assistant messages
 * get a markdown-rendered left bubble.
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { colors, spacing, radius, fontSize, fontFamily } from '../theme/colors';
import type { Message } from '../store/chatStore';

interface Props {
  message: Message;
  isLast: boolean;
}

function ChatBubbleComponent({ message, isLast }: Props) {
  const isUser = message.role === 'user';

  if (message.role === 'system') return null;

  const containerStyle: ViewStyle = isUser ? styles.userContainer : styles.assistantContainer;
  const bubbleStyle: ViewStyle = isUser ? styles.userBubble : styles.assistantBubble;

  return (
    <View style={[styles.row, isUser && styles.rowReverse]}>
      <View style={containerStyle}>
        <View style={bubbleStyle}>
          {isUser ? (
            <Text style={styles.userText}>{message.content}</Text>
          ) : (
            <>
              {message.content.length === 0 && message.pending ? (
                <Text style={styles.placeholder}>…</Text>
              ) : (
                <Markdown style={markdownStyles}>{message.content}</Markdown>
              )}
              {message.error ? (
                <Text style={styles.errorText}>⚠ {message.error}</Text>
              ) : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

export const ChatBubble = memo(ChatBubbleComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  rowReverse: {
    justifyContent: 'flex-end',
  },
  userContainer: {
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  assistantContainer: {
    maxWidth: '92%',
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: colors.userBubble,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.xs,
  },
  assistantBubble: {
    backgroundColor: colors.assistantBubble,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.4,
    fontFamily: fontFamily.body,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontStyle: 'italic',
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});

const markdownStyles = {
  body: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.45,
    fontFamily: fontFamily.body,
  },
  code_inline: {
    backgroundColor: colors.surfaceVariant,
    color: '#E5E7EB',
    padding: 2,
    borderRadius: 4,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
  },
  code_block: {
    backgroundColor: colors.surfaceVariant,
    color: '#E5E7EB',
    padding: spacing.md,
    borderRadius: radius.md,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    marginVertical: spacing.sm,
  },
  fence: {
    backgroundColor: colors.surfaceVariant,
    color: '#E5E7EB',
    padding: spacing.md,
    borderRadius: radius.md,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    marginVertical: spacing.sm,
  },
  heading1: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' as const, marginTop: spacing.md },
  heading2: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' as const, marginTop: spacing.md },
  heading3: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' as const, marginTop: spacing.sm },
  bullet_list: { color: colors.text, marginVertical: spacing.xs },
  ordered_list: { color: colors.text, marginVertical: spacing.xs },
  list_item: { color: colors.text, marginVertical: 2 },
  strong: { color: colors.text, fontWeight: '700' as const },
  em: { color: colors.text, fontStyle: 'italic' as const },
  link: { color: colors.accent, textDecorationLine: 'underline' as const },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: spacing.md,
    color: colors.textMuted,
    marginVertical: spacing.sm,
  },
};
