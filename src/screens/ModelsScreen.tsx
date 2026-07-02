/**
 * ModelsScreen — model catalog + active-model indicator.
 *
 * Lets the user:
 *  - browse preset GGUFs (with size, RAM, context info)
 *  - download (with progress bar)
 *  - cancel an in-flight download
 *  - activate a downloaded model (loads into RAM via llama.cpp)
 *  - remove a downloaded model (frees disk)
 *  - sideload a custom .gguf via DocumentPicker
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { MODEL_CATALOG } from '../models/catalog';
import { useModelStore } from '../store/modelStore';
import { useSettingsStore } from '../store/settingsStore';
import { ModelCard } from '../components/ModelCard';
import { HeaderButton } from '../components/HeaderButton';
import { EmptyState } from '../components/EmptyState';

import { colors, spacing, fontSize, fontFamily } from '../theme/colors';
import { freeSpaceMB, importSideLoadedFile } from '../services/storageService';

export function ModelsScreen() {
  const downloaded = useModelStore((s) => s.downloaded);
  const progress = useModelStore((s) => s.progress);
  const jobIds = useModelStore((s) => s.jobIds);
  const loadedModelPath = useModelStore((s) => s.loadedModelPath);
  const isLoadingModel = useModelStore((s) => s.isLoadingModel);
  const lastError = useModelStore((s) => s.lastError);

  const refreshDownloaded = useModelStore((s) => s.refreshDownloaded);
  const startDownload = useModelStore((s) => s.startDownload);
  const cancelDownload = useModelStore((s) => s.cancelDownload);
  const removeDownload = useModelStore((s) => s.removeDownload);
  const activateModel = useModelStore((s) => s.activateModel);
  const unloadModel = useModelStore((s) => s.unloadModel);
  const clearError = useModelStore((s) => s.clearError);

  const activeModelId = useSettingsStore((s) => s.activeModelId);
  const setActiveModel = useSettingsStore((s) => s.setActiveModel);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshDownloaded();
  }, []);

  useEffect(() => {
    if (lastError) {
      Alert.alert('HandyAi', lastError, [{ text: 'OK', onPress: clearError }]);
    }
  }, [lastError, clearError]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDownloaded();
    setRefreshing(false);
  };

  const handleDownload = async (presetId: string) => {
    const preset = MODEL_CATALOG.find((p) => p.id === presetId);
    if (!preset) return;
    const free = await freeSpaceMB();
    if (free < preset.sizeMB * 1.2) {
      Alert.alert(
        'Not enough space',
        `This model needs ~${preset.sizeMB} MB. Your device has ${free} MB free.`,
      );
      return;
    }
    startDownload(presetId);
  };

  const handleActivate = async (presetId: string) => {
    await activateModel(presetId);
    setActiveModel(presetId);
  };

  const handleRemove = (presetId: string, name: string) => {
    Alert.alert(
      'Remove model',
      `Delete ${name} from your device? You can re-download it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeDownload(presetId) },
      ],
    );
  };

  const handleSideload = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });
      const picked = Array.isArray(res) ? res[0] : res;
      if (!picked) return;

      const filename = picked.name?.endsWith('.gguf')
        ? picked.name!
        : `${picked.name ?? 'custom'}.gguf`;

      await importSideLoadedFile(picked.uri, filename);
      await refreshDownloaded();
      Alert.alert('Imported', `${filename} is ready in your model list.`);
    } catch (err) {
      if (!DocumentPicker.isCancel(err as any)) {
        Alert.alert('Import failed', err instanceof Error ? err.message : String(err));
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Model catalog</Text>
        <TouchableOpacity style={styles.sideloadButton} onPress={handleSideload}>
          <Icon name="file-import" size={16} color={colors.accent} />
          <Text style={styles.sideloadText}>Sideload .gguf</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionSubtitle}>
        Models download once over Wi-Fi, then run fully offline. Pick the smallest one that fits your phone.
      </Text>

      {MODEL_CATALOG.length === 0 ? (
        <EmptyState icon="package-variant" title="No models available" subtitle="Check your internet connection." />
      ) : (
        MODEL_CATALOG.map((preset) => {
          const filename = `${preset.id}.gguf`;
          const isDownloaded = downloaded.includes(filename);
          const isActive = loadedModelPath?.endsWith(filename) ?? false;
          return (
            <ModelCard
              key={preset.id}
              preset={preset}
              isDownloaded={isDownloaded}
              isActive={isActive}
              isLoading={isLoadingModel && activeModelId === preset.id}
              progress={progress[preset.id]}
              onDownload={() => handleDownload(preset.id)}
              onCancel={() => cancelDownload(preset.id)}
              onActivate={() => handleActivate(preset.id)}
              onRemove={() => handleRemove(preset.id, preset.name)}
            />
          );
        })
      )}

      {loadedModelPath && (
        <TouchableOpacity style={styles.unloadButton} onPress={unloadModel}>
          <Icon name="power-plug-off" size={16} color={colors.warning} />
          <Text style={styles.unloadText}>Unload active model (frees RAM)</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>
          Tip: download sizes are Q4_K_M quantized. Larger quantizations improve quality but multiply size ~2×.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', fontFamily: fontFamily.body },
  sideloadButton: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: spacing.xs },
  sideloadText: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '500' },
  sectionSubtitle: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.5, marginBottom: spacing.lg },
  unloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: spacing.md,
    borderRadius: 10,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  unloadText: { color: colors.warning, fontSize: fontSize.md, fontWeight: '500' },
  footerNote: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerText: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: fontSize.xs * 1.6 },
});
