/**
 * ChatScreen — the main chat interface.
 *
 * Reads the active chat from chatStore, streams tokens in via onToken,
 * shows a typing indicator before the first token arrives, and offers
 * regenerate / edit / clear-chat via a long-press context.
 *
 * If no model is loaded, it nudges the user to the Models tab.
 */
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import type { ListRenderItem } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useChatStore, type Message } from '../store/chatStore';
import { useModelStore } from '../store/modelStore';
import { useSettingsStore } from '../store/settingsStore';

import { ChatBubble } from '../components/ChatBubble';
import { MessageInput } from '../components/MessageInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { EmptyState } from '../components/EmptyState';
import { HeaderButton } from '../components/HeaderButton';

import { colors, spacing, fontSize, fontFamily } from '../theme/colors';
import { findPreset } from '../models/catalog';

type NavProp = NativeStackNavigationProp<any>;

export function ChatScreen() {
  const navigation = useNavigation<NavProp>();
  const listRef = useRef<FlatList<Message>>(null);

  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const sendUserMessage = useChatStore((s) => s.sendUserMessage);
  const stopGeneration = useChatStore((s) => s.stopGeneration);
  const newChat = useChatStore((s) => s.newChat);
  const clearMessages = useChatStore((s) => s.clearMessages);

  const loadedModelPath = useModelStore((s) => s.loadedModelPath);
  const refreshDownloaded = useModelStore((s) => s.refreshDownloaded);
  const activeModelId = useSettingsStore((s) => s.activeModelId);
  const autoScroll = useSettingsStore((s) => s.autoScroll);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId],
  );

  // On first mount, ensure we have at least one chat open.
  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      useChatStore.getState().setActiveChat(chats[0].id);
    } else if (!activeChatId) {
      newChat();
    }
    refreshDownloaded();
  }, []);

  // Update header title and actions when the active chat changes.
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        title: activeChat?.title ?? 'HandyAi',
        headerRight: () => (
          <View style={{ flexDirection: 'row' }}>
            <HeaderButton
              icon="new-message"
              onPress={() => newChat()}
              testID="new-chat-btn"
            />
            <HeaderButton
              icon="broom"
              onPress={() => {
                if (!activeChat) return;
                Alert.alert(
                  'Clear chat',
                  'Remove all messages in this conversation?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => clearMessages(activeChat.id) },
                  ],
                );
              }}
            />
          </View>
        ),
      });
    }, [navigation, activeChat, newChat, clearMessages]),
  );

  // Auto-scroll to bottom when a new message arrives.
  useEffect(() => {
    if (autoScroll && activeChat && activeChat.messages.length > 0) {
      const t = setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [activeChat?.messages, autoScroll]);

  const handleSend = (text: string) => {
    if (!loadedModelPath) {
      Alert.alert(
        'No model loaded',
        'Download and activate a model first. The Models tab lets you do this.',
        [
          { text: 'Open Models', onPress: () => navigation.navigate('Models' as never) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    sendUserMessage(text);
  };

  const renderItem: ListRenderItem<Message> = ({ item, index }) => (
    <ChatBubble message={item} isLast={index === (activeChat?.messages.length ?? 0) - 1} />
  );

  const showEmpty = !activeChat || activeChat.messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {/* Status strip showing the active model */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {loadedModelPath
              ? `🟢 ${findPreset(activeModelId ?? '')?.name ?? 'Model'} loaded`
              : '🔴 No model — tap Models tab'}
          </Text>
        </View>

        {showEmpty ? (
          <EmptyState
            icon="hand-pointing-right"
            title="Say hi to HandyAi"
            subtitle="Your messages stay on this device. Pick a model in the Models tab to start chatting."
          />
        ) : (
          <FlatList
            ref={listRef}
            data={activeChat!.messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isGenerating ? <TypingIndicator /> : null}
          />
        )}

        <MessageInput
          onSend={handleSend}
          onStop={stopGeneration}
          isGenerating={isGenerating}
          disabled={!loadedModelPath && !isGenerating}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  statusBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.mono,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: spacing.md,
    paddingBottom: 80,
  },
});
