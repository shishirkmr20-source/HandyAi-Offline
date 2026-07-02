/**
 * settingsStore — persisted user preferences.
 *
 * Persisted via MMKV (synchronous, fast — no AsyncStorage boot delay).
 */
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_MODEL_ID } from '../models/catalog';
import { DEFAULT_PROMPT_ID } from '../models/prompts';

const mmkv = new MMKV({ id: 'handyai-settings' });

export type ThemeMode = 'dark' | 'light' | 'system';

export interface SettingsState {
  activeModelId: string | null;
  activePromptId: string;
  customSystemPrompt: string | null;

  temperature: number;
  topP: number;
  maxTokens: number;
  contextLength: number;
  gpuLayers: number;

  themeMode: ThemeMode;
  hapticsEnabled: boolean;
  streamingEnabled: boolean;
  autoScroll: boolean;

  setActiveModel: (id: string | null) => void;
  setPromptId: (id: string) => void;
  setCustomSystemPrompt: (text: string | null) => void;
  setTemperature: (t: number) => void;
  setTopP: (p: number) => void;
  setMaxTokens: (n: number) => void;
  setContextLength: (n: number) => void;
  setGpuLayers: (n: number) => void;
  setThemeMode: (m: ThemeMode) => void;
  setHaptics: (b: boolean) => void;
  setStreaming: (b: boolean) => void;
  setAutoScroll: (b: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      activeModelId: DEFAULT_MODEL_ID,
      activePromptId: DEFAULT_PROMPT_ID,
      customSystemPrompt: null,

      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1024,
      contextLength: 4096,
      gpuLayers: 0,

      themeMode: 'dark',
      hapticsEnabled: true,
      streamingEnabled: true,
      autoScroll: true,

      setActiveModel: (id) => set({ activeModelId: id }),
      setPromptId: (id) => set({ activePromptId: id }),
      setCustomSystemPrompt: (text) => set({ customSystemPrompt: text }),
      setTemperature: (t) => set({ temperature: t }),
      setTopP: (p) => set({ topP: p }),
      setMaxTokens: (n) => set({ maxTokens: n }),
      setContextLength: (n) => set({ contextLength: n }),
      setGpuLayers: (n) => set({ gpuLayers: n }),
      setThemeMode: (m) => set({ themeMode: m }),
      setHaptics: (b) => set({ hapticsEnabled: b }),
      setStreaming: (b) => set({ streamingEnabled: b }),
      setAutoScroll: (b) => set({ autoScroll: b }),
    }),
    {
      name: 'handyai-settings',
      storage: createJSONStorage(() => ({
        setItem: (k, v) => mmkv.set(k, v),
        getItem: (k) => mmkv.getString(k) ?? null,
        removeItem: (k) => mmkv.delete(k),
      })),
    },
  ),
);
