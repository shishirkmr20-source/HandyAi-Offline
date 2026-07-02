/**
 * HistoryScreen — list of past chats.
 *
 * Tap to open, long-press for rename / pin / delete.
 * Newest first; pinned chats float to the top.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useChatStore, type Chat } from '../store/chatStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, radius, fontSize, fontFamily } from '../theme/colors';
import { EmptyState } from '../components/EmptyState';
import { HeaderButton } from '../components/HeaderButton';

type NavProp = NativeStackNavigationProp<any>;

export function HistoryScreen() {
  const navigation = useNavigation<NavProp>();
  const chats = useChatStore((s) => s.chats);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const renameChat = useChatStore((s) => s.renameChat);
  const togglePin = useChatStore((s) => s.togglePin);
  const newChat = useChatStore((s) => s.newChat);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [chats]);

  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        headerRight: () => (
          <HeaderButton icon="plus" onPress={() => { newChat(); navigation.navigate('Chat' as never); }} testID="history-new-chat" />
        ),
      });
    }, [navigation, newChat]),
  );

  const openChat = (id: string) => {
    setActiveChat(id);
    navigation.navigate('Chat' as never);
  };

  const showActions = (chat: Chat) => {
    Alert.alert(chat.title, undefined, [
      { text: chat.pinned ? 'Unpin' : 'Pin', onPress: () => togglePin(chat.id) },
      { text: 'Rename', onPress: () => { setRenamingId(chat.id); setRenameText(chat.title); } },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChat(chat.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderItem = ({ item }: { item: Chat }) => {
    const lastMessage = item.messages[item.messages.length - 1];
    return (
      <TouchableOpacity style={styles.row} onPress={() => openChat(item.id)} onLongPress={() => showActions(item)} delayLongPress={400}>
        <View style={styles.rowContent}>
          <View style={styles.rowHeader}>
            {item.pinned && <Icon name="pin" size={14} color={colors.accent} />}
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {lastMessage ? lastMessage.content : 'No messages yet'}
          </Text>
          <View style={styles.rowFooter}>
            <Text style={styles.meta}>{new Date(item.updatedAt).toLocaleString()}</Text>
            <Text style={styles.meta}>· {item.messages.length} msgs</Text>
          </View>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textSubtle} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {sortedChats.length === 0 ? (
        <EmptyState
          icon="chat-processing-outline"
          title="No chats yet"
          subtitle="Tap the + button to start a new conversation."
        />
      ) : (
        <FlatList
          data={sortedChats}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Rename modal */}
      <Modal visible={renamingId !== null} transparent animationType="fade" onRequestClose={() => setRenamingId(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRenamingId(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename chat</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              placeholder="Chat title"
              placeholderTextColor={colors.textSubtle}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setRenamingId(null)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (renamingId && renameText.trim()) {
                    renameChat(renamingId, renameText.trim());
                  }
                  setRenamingId(null);
                }}
              >
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  rowContent: { flex: 1, marginRight: spacing.md },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', fontFamily: fontFamily.body, flexShrink: 1 },
  preview: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  rowFooter: { flexDirection: 'row', gap: 4, marginTop: spacing.xs },
  meta: { color: colors.textSubtle, fontSize: fontSize.xs },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, width: '100%', maxWidth: 360 },
  modalTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.md },
  modalInput: {
    backgroundColor: colors.surfaceVariant,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.md },
  modalCancel: { color: colors.textMuted, fontSize: fontSize.md, paddingVertical: spacing.sm },
  modalSave: { color: colors.accent, fontSize: fontSize.md, fontWeight: '600', paddingVertical: spacing.sm },
});
