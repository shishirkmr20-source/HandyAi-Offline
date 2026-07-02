/**
 * chatStore — chat sessions, messages, and the streaming state machine.
 *
 * Chat history is persisted to MMKV. Each chat is a self-contained object
 * (messages + metadata) so we can list them cheaply on the History screen.
 */
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sendCompletion } from '../services/llamaService';
import { useSettingsStore } from './settingsStore';
import { SYSTEM_PROMPT_PRESETS, findPreset as findPromptPreset } from '../models/prompts';

const mmkv = new MMKV({ id: 'handyai-chats' });

export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  /** True while the assistant is streaming this message. */
  pending?: boolean;
  /** Set if generation failed. */
  error?: string;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  presetId: string;
  systemPrompt: string;
  messages: Message[];
  pinned?: boolean;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  isGenerating: boolean;

  newChat: () => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  setActiveChat: (id: string | null) => void;

  /** Append a user message and trigger the assistant reply. */
  sendUserMessage: (content: string) => Promise<void>;

  /** Cancel the in-flight completion (best-effort). */
  stopGeneration: () => void;

  /** Clear all messages in a chat (keeps the chat itself). */
  clearMessages: (chatId: string) => void;

  /** Edit an existing user message and regenerate the reply from that point. */
  editUserMessage: (messageId: string, newContent: string) => Promise<void>;

  /** Regenerate the last assistant reply. */
  regenerateLast: () => Promise<void>;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function deriveTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed || 'New chat';
}

function getSystemPrompt(): string {
  const s = useSettingsStore.getState();
  if (s.customSystemPrompt && s.customSystemPrompt.trim().length > 0) {
    return s.customSystemPrompt;
  }
  const preset = findPromptPreset(s.activePromptId);
  return preset?.text ?? SYSTEM_PROMPT_PRESETS[0].text;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      // Internal flag — true when the user requested a stop.
      let stopRequested = false;

      return {
        chats: [],
        activeChatId: null,
        isGenerating: false,

        newChat: () => {
          const settings = useSettingsStore.getState();
          const id = uid();
          const now = Date.now();
          const presetId = settings.activePromptId;
          const preset = findPromptPreset(presetId);
          const chat: Chat = {
            id,
            title: 'New chat',
            createdAt: now,
            updatedAt: now,
            presetId,
            systemPrompt: preset?.text ?? getSystemPrompt(),
            messages: [],
          };
          set((s) => ({ chats: [chat, ...s.chats], activeChatId: id }));
          return id;
        },

        deleteChat: (id) =>
          set((s) => ({
            chats: s.chats.filter((c) => c.id !== id),
            activeChatId: s.activeChatId === id ? null : s.activeChatId,
          })),

        renameChat: (id, title) =>
          set((s) => ({
            chats: s.chats.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c)),
          })),

        togglePin: (id) =>
          set((s) => ({
            chats: s.chats.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
          })),

        setActiveChat: (id) => set({ activeChatId: id }),

        sendUserMessage: async (content) => {
          const state = get();
          let chatId = state.activeChatId;
          if (!chatId) {
            chatId = get().newChat();
          }

          const userMsg: Message = {
            id: uid(),
            role: 'user',
            content,
            createdAt: Date.now(),
          };

          const assistantMsg: Message = {
            id: uid(),
            role: 'assistant',
            content: '',
            createdAt: Date.now(),
            pending: true,
          };

          set((s) => ({
            chats: s.chats.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    title: c.messages.length === 0 ? deriveTitle(content) : c.title,
                    messages: [...c.messages, userMsg, assistantMsg],
                    updatedAt: Date.now(),
                  }
                : c,
            ),
            isGenerating: true,
          }));

          await runCompletion(chatId!, assistantMsg.id);

          // Auto-rename if this was the first message
          const updated = get().chats.find((c) => c.id === chatId);
          if (updated && updated.messages.length === 2 && updated.title === 'New chat') {
            get().renameChat(chatId!, deriveTitle(content));
          }
        },

        stopGeneration: () => {
          stopRequested = true;
        },

        clearMessages: (chatId) =>
          set((s) => ({
            chats: s.chats.map((c) =>
              c.id === chatId ? { ...c, messages: [], title: 'New chat', updatedAt: Date.now() } : c,
            ),
          })),

        editUserMessage: async (messageId, newContent) => {
          const state = get();
          const chat = state.chats.find((c) => c.id === state.activeChatId);
          if (!chat) return;
          const idx = chat.messages.findIndex((m) => m.id === messageId);
          if (idx === -1) return;

          // Truncate everything after the edited user message
          const newMessages = chat.messages.slice(0, idx);
          const userMsg: Message = {
            id: uid(),
            role: 'user',
            content: newContent,
            createdAt: Date.now(),
          };
          const assistantMsg: Message = {
            id: uid(),
            role: 'assistant',
            content: '',
            createdAt: Date.now(),
            pending: true,
          };

          set((s) => ({
            chats: s.chats.map((c) =>
              c.id === chat.id ? { ...c, messages: [...newMessages, userMsg, assistantMsg] } : c,
            ),
            isGenerating: true,
          }));

          await runCompletion(chat.id, assistantMsg.id);
        },

        regenerateLast: async () => {
          const state = get();
          const chat = state.chats.find((c) => c.id === state.activeChatId);
          if (!chat) return;
          // Find last assistant message
          let lastAssistantIdx = -1;
          for (let i = chat.messages.length - 1; i >= 0; i--) {
            if (chat.messages[i].role === 'assistant') {
              lastAssistantIdx = i;
              break;
            }
          }
          if (lastAssistantIdx === -1) return;

          const newAssistantId = uid();
          const truncated = chat.messages.slice(0, lastAssistantIdx);
          const assistantMsg: Message = {
            id: newAssistantId,
            role: 'assistant',
            content: '',
            createdAt: Date.now(),
            pending: true,
          };

          set((s) => ({
            chats: s.chats.map((c) =>
              c.id === chat.id ? { ...c, messages: [...truncated, assistantMsg] } : c,
            ),
            isGenerating: true,
          }));

          await runCompletion(chat.id, newAssistantId);
        },
      };

      /**
       * Internal — runs the LLM completion against the active model and streams
       * tokens into the chat identified by `chatId`, message `assistantId`.
       */
      async function runCompletion(chatId: string, assistantId: string): Promise<void> {
        stopRequested = false;

        const state = get();
        const chat = state.chats.find((c) => c.id === chatId);
        if (!chat) return;

        const settings = useSettingsStore.getState();

        // Build the message array for llama.cpp (system + all messages except the pending assistant placeholder)
        const messagesForLlama = [
          { role: 'system' as const, content: chat.systemPrompt || getSystemPrompt() },
          ...chat.messages
            .filter((m) => m.id !== assistantId && m.role !== 'system')
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ];

        await sendCompletion(
          messagesForLlama,
          {
            temperature: settings.temperature,
            topP: settings.topP,
            maxTokens: settings.maxTokens,
          },
          {
            onToken: (token) => {
              if (stopRequested) return;
              set((s) => ({
                chats: s.chats.map((c) =>
                  c.id === chatId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantId ? { ...m, content: m.content + token } : m,
                        ),
                      }
                    : c,
                ),
              }));
            },
            onComplete: () => {
              set((s) => ({
                chats: s.chats.map((c) =>
                  c.id === chatId
                    ? {
                        ...c,
                        updatedAt: Date.now(),
                        messages: c.messages.map((m) =>
                          m.id === assistantId ? { ...m, pending: false } : m,
                        ),
                      }
                    : c,
                ),
                isGenerating: false,
              }));
            },
            onError: (err) => {
              set((s) => ({
                chats: s.chats.map((c) =>
                  c.id === chatId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantId
                            ? { ...m, pending: false, error: err.message, content: m.content || `⚠️ ${err.message}` }
                            : m,
                        ),
                      }
                    : c,
                ),
                isGenerating: false,
              }));
            },
          },
        );

        // If stop was requested, finalize the message
        if (stopRequested) {
          set((s) => ({
            chats: s.chats.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantId ? { ...m, pending: false } : m,
                    ),
                  }
                : c,
            ),
            isGenerating: false,
          }));
        }
      }
    },
    {
      name: 'handyai-chats',
      storage: createJSONStorage(() => ({
        setItem: (k, v) => mmkv.set(k, v),
        getItem: (k) => mmkv.getString(k) ?? null,
        removeItem: (k) => mmkv.delete(k),
      })),
    },
  ),
);
