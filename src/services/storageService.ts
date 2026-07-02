/**
 * storageService — thin wrapper around react-native-fs for the model directory.
 *
 * All .gguf model files live under DocumentDirectoryPath/HandyAi/models/.
 * Chat history & settings use MMKV (see src/store/*).
 */
import RNFS from 'react-native-fs';

export const MODELS_DIR = `${RNFS.DocumentDirectoryPath}/HandyAi/models`;
export const CHATS_DIR = `${RNFS.DocumentDirectoryPath}/HandyAi/chats`;

export async function ensureDirectories(): Promise<void> {
  await RNFS.mkdir(MODELS_DIR, { NSURLIsExcludedFromBackupKey: false }).catch(() => {});
  await RNFS.mkdir(CHATS_DIR, { NSURLIsExcludedFromBackupKey: false }).catch(() => {});
}

export async function listDownloadedModels(): Promise<string[]> {
  await ensureDirectories();
  const items = await RNFS.readDir(MODELS_DIR);
  return items.filter((i) => i.isFile() && i.name.endsWith('.gguf')).map((i) => i.name);
}

export async function modelExists(filename: string): Promise<boolean> {
  const path = `${MODELS_DIR}/${filename}`;
  return RNFS.exists(path);
}

export async function modelPath(filename: string): Promise<string> {
  await ensureDirectories();
  return `${MODELS_DIR}/${filename}`;
}

export async function deleteModel(filename: string): Promise<void> {
  const path = `${MODELS_DIR}/${filename}`;
  if (await RNFS.exists(path)) {
    await RNFS.unlink(path);
  }
}

export async function freeSpaceMB(): Promise<number> {
  // getFSInfo returns bytes free
  const info = await RNFS.getFSInfo();
  return Math.floor((info.freeSpace as number) / (1024 * 1024));
}

/**
 * Copy a user-side-loaded .gguf (picked via DocumentPicker) into our models dir.
 * Returns the filename inside our managed directory.
 */
export async function importSideLoadedFile(sourceUri: string, filename: string): Promise<string> {
  await ensureDirectories();
  const dest = `${MODELS_DIR}/${filename}`;
  await RNFS.copyFile(sourceUri, dest);
  return dest;
}
