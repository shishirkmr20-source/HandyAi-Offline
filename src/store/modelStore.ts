/**
 * modelStore — tracks which GGUFs the user has downloaded locally,
 * plus the download-in-flight progress for each.
 *
 * Active model selection lives in settingsStore (it is persisted separately
 * because settings can change independent of downloads).
 */
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { persist, createJSONStorage } from 'zustand/middleware';
import { listDownloadedModels, ensureDirectories } from '../services/storageService';
import { downloadModel, cancelDownload, DownloadHandle } from '../services/downloadService';
import { initContext, releaseActiveContext, hasActiveContext } from '../services/llamaService';
import { findPreset } from '../models/catalog';

const mmkv = new MMKV({ id: 'handyai-models' });

export interface DownloadProgress {
  percent: number;
  downloadedMB: number;
  totalMB: number;
}

interface ModelState {
  /** Filenames physically present in MODELS_DIR. */
  downloaded: string[];

  /** Map of presetId -> active DownloadProgress (or null = not downloading). */
  progress: Record<string, DownloadProgress | undefined>;

  /** In-flight RNFS job ids, for cancellation. */
  jobIds: Record<string, number | undefined>;

  /** Path of the currently loaded model (null = none loaded). */
  loadedModelPath: string | null;

  /** True while we are loading a model into memory. */
  isLoadingModel: boolean;

  /** Last error from download or load. */
  lastError: string | null;

  refreshDownloaded: () => Promise<void>;
  startDownload: (presetId: string) => Promise<void>;
  cancelDownload: (presetId: string) => Promise<void>;
  removeDownload: (presetId: string) => Promise<void>;
  activateModel: (presetId: string) => Promise<void>;
  unloadModel: () => Promise<void>;
  clearError: () => void;
}

function presetToFilename(presetId: string): string {
  return `${presetId}.gguf`;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      downloaded: [],
      progress: {},
      jobIds: {},
      loadedModelPath: null,
      isLoadingModel: false,
      lastError: null,

      refreshDownloaded: async () => {
        await ensureDirectories();
        const files = await listDownloadedModels();
        set({ downloaded: files });
      },

      startDownload: async (presetId: string) => {
        const preset = findPreset(presetId);
        if (!preset) {
          set({ lastError: `Unknown model preset: ${presetId}` });
          return;
        }
        const filename = presetToFilename(presetId);

        set((s) => ({
          progress: { ...s.progress, [presetId]: { percent: 0, downloadedMB: 0, totalMB: preset.sizeMB } },
          lastError: null,
        }));

        const handle: DownloadHandle = downloadModel(preset.url, filename, {
          onProgress: (_written, total, percent) => {
            set((s) => ({
              progress: {
                ...s.progress,
                [presetId]: {
                  percent,
                  downloadedMB: Math.floor((percent / 100) * preset.sizeMB),
                  totalMB: preset.sizeMB,
                },
              },
            }));
          },
          onComplete: () => {
            set((s) => {
              const nextProgress = { ...s.progress };
              delete nextProgress[presetId];
              const nextJobIds = { ...s.jobIds };
              delete nextJobIds[presetId];
              return {
                downloaded: [...new Set([...s.downloaded, filename])],
                progress: nextProgress,
                jobIds: nextJobIds,
              };
            });
          },
          onError: (err) => {
            set((s) => {
              const nextProgress = { ...s.progress };
              delete nextProgress[presetId];
              const nextJobIds = { ...s.jobIds };
              delete nextJobIds[presetId];
              return {
                progress: nextProgress,
                jobIds: nextJobIds,
                lastError: err.message,
              };
            });
          },
        });

        set((s) => ({ jobIds: { ...s.jobIds, [presetId]: handle.jobId } }));
      },

      cancelDownload: async (presetId: string) => {
        const jobId = get().jobIds[presetId];
        if (jobId !== undefined) {
          await cancelDownload(jobId);
        }
        set((s) => {
          const nextProgress = { ...s.progress };
          delete nextProgress[presetId];
          const nextJobIds = { ...s.jobIds };
          delete nextJobIds[presetId];
          return { progress: nextProgress, jobIds: nextJobIds };
        });
      },

      removeDownload: async (presetId: string) => {
        const preset = findPreset(presetId);
        if (!preset) return;
        const filename = presetToFilename(presetId);
        // If this is the active model, unload first
        if (get().loadedModelPath && get().loadedModelPath?.endsWith(filename)) {
          await releaseActiveContext();
        }
        const { deleteModel } = await import('../services/storageService');
        await deleteModel(filename);
        set((s) => ({ downloaded: s.downloaded.filter((f) => f !== filename), loadedModelPath: null }));
      },

      activateModel: async (presetId: string) => {
        const preset = findPreset(presetId);
        if (!preset) {
          set({ lastError: `Unknown model preset: ${presetId}` });
          return;
        }
        const filename = presetToFilename(presetId);
        if (!get().downloaded.includes(filename)) {
          set({ lastError: `Model not downloaded yet: ${preset.name}` });
          return;
        }

        set({ isLoadingModel: true, lastError: null });
        try {
          const { modelPath } = await import('../services/storageService');
          const path = await modelPath(filename);
          await initContext(path, preset.context, 0);
          set({ loadedModelPath: path, isLoadingModel: false });
        } catch (err) {
          set({
            isLoadingModel: false,
            lastError: err instanceof Error ? err.message : String(err),
          });
        }
      },

      unloadModel: async () => {
        await releaseActiveContext();
        set({ loadedModelPath: null });
      },

      clearError: () => set({ lastError: null }),
    }),
    {
      name: 'handyai-models',
      storage: createJSONStorage(() => ({
        setItem: (k, v) => mmkv.set(k, v),
        getItem: (k) => mmkv.getString(k) ?? null,
        removeItem: (k) => mmkv.delete(k),
      })),
      // We persist only the list of downloaded files — progress / loadedModelPath are runtime-only.
      partialize: (s) => ({ downloaded: s.downloaded }) as ModelState,
    },
  ),
);

export function isModelLoaded(): boolean {
  return hasActiveContext();
}
