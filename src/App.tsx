/**
 * HandyAi — App entry.
 *
 * Boots navigation, ensures storage dirs exist, loads persisted state from MMKV,
 * and preloads the active model if one is already downloaded.
 */
import React, { useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import { AppNavigator } from './navigation/AppNavigator';
import { useSettingsStore } from './store/settingsStore';
import { useModelStore } from './store/modelStore';
import { ensureDirectories } from './services/storageService';
import { releaseAll } from './services/llamaService';
import { colors } from './theme/colors';

function AppInner() {
  const [booted, setBooted] = React.useState(false);

  useEffect(() => {
    (async () => {
      await ensureDirectories();
      await useModelStore.getState().refreshDownloaded();

      // Optionally preload the active model if it's already on disk.
      const settings = useSettingsStore.getState();
      const modelStore = useModelStore.getState();
      if (settings.activeModelId) {
        const filename = `${settings.activeModelId}.gguf`;
        if (modelStore.downloaded.includes(filename)) {
          // Preload silently — non-blocking.
          modelStore.activateModel(settings.activeModelId).catch(() => {
            // ignore preload errors; user can retry from Models tab
          });
        }
      }
      setBooted(true);
    })();

    return () => {
      // Release llama.cpp context on unmount (app shutdown)
      releaseAll().catch(() => {});
    };
  }, []);

  if (!booted) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <AppInner />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
