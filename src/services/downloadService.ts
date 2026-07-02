/**
 * downloadService — downloads a .gguf from a URL with progress callbacks,
 * resumable via react-native-fs downloadFiles. Used by the Models screen.
 *
 * Network is ONLY used here. Once the file lands in MODELS_DIR, the LLM
 * runs fully offline via llama.cpp.
 */
import RNFS from 'react-native-fs';
import { MODELS_DIR, ensureDirectories } from './storageService';

export interface DownloadHandle {
  jobId: number;
  promise: Promise<string>;
}

export interface DownloadCallbacks {
  onProgress?: (downloadedBytes: number, totalBytes: number, percent: number) => void;
  onComplete?: (filePath: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Begin downloading a model. Returns a handle that exposes the RNFS job ID
 * (so the caller can cancel) plus a promise that resolves to the local path.
 */
export function downloadModel(
  url: string,
  filename: string,
  callbacks: DownloadCallbacks = {},
): DownloadHandle {
  let jobId = -1;

  const promise = (async (): Promise<string> => {
    await ensureDirectories();
    const destPath = `${MODELS_DIR}/${filename}`;

    // If the file already exists (e.g. partial download), delete it so we start fresh.
    if (await RNFS.exists(destPath)) {
      await RNFS.unlink(destPath);
    }

    const ret = RNFS.downloadFile({
      fromUrl: url,
      toFile: destPath,
      background: true,
      discretionary: false,
      cacheable: false,
      progressDivider: 1,
      begin: (res) => {
        // res.statusCode, res.contentLength
        const total = res.contentLength;
        callbacks.onProgress?.(0, total, 0);
      },
      progress: (res) => {
        const total = res.contentLength;
        const written = res.bytesWritten;
        const percent = total > 0 ? (written / total) * 100 : 0;
        callbacks.onProgress?.(written, total, percent);
      },
    });

    jobId = ret.jobId;

    const result = await ret.promise;
    if (result.statusCode !== 200) {
      throw new Error(`Download failed: HTTP ${result.statusCode}`);
    }
    callbacks.onComplete?.(destPath);
    return destPath;
  })();

  promise.catch((err) => callbacks.onError?.(err as Error));

  return { jobId, promise };
}

/**
 * Cancel an in-flight download.
 */
export function cancelDownload(jobId: number): Promise<void> {
  return RNFS.stopDownload(jobId);
}
