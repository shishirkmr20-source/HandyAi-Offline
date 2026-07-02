/**
 * SettingsScreen — generation parameters, persona, theme, data management.
 *
 * All values are persisted via the settingsStore (MMKV-backed zustand).
 */
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Switch,
  Modal,
  Pressable,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useSettingsStore, type ThemeMode } from '../store/settingsStore';
import { useModelStore } from '../store/modelStore';
import { SYSTEM_PROMPT_PRESETS } from '../models/prompts';
import { colors, spacing, radius, fontSize, fontFamily } from '../theme/colors';

export function SettingsScreen() {
  const s = useSettingsStore();
  const refreshDownloaded = useModelStore((st) => st.refreshDownloaded);
  const [promptModalVisible, setPromptModalVisible] = useState(false);

  const activePreset = SYSTEM_PROMPT_PRESETS.find((p) => p.id === s.activePromptId);

  const handleClearAll = () => {
    Alert.alert(
      'Clear all data',
      'Remove all chats, models, and reset settings? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: async () => {
            const { MMKV } = await import('react-native-mmkv');
            ['handyai-settings', 'handyai-models', 'handyai-chats'].forEach((id) => {
              try { new MMKV({ id }).clearAll(); } catch {}
            });
            Alert.alert('Cleared', 'Restart the app to see the changes.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Generation parameters */}
      <Section title="Generation">
        <SliderRow
          label="Temperature"
          value={s.temperature}
          min={0}
          max={1.5}
          step={0.05}
          onValueChange={s.setTemperature}
          hint="Higher = more creative, lower = more deterministic"
        />
        <SliderRow
          label="Top-P"
          value={s.topP}
          min={0.1}
          max={1}
          step={0.05}
          onValueChange={s.setTopP}
          hint="Nucleus sampling threshold"
        />
        <SliderRow
          label="Max tokens"
          value={s.maxTokens}
          min={64}
          max={4096}
          step={64}
          onValueChange={s.setMaxTokens}
          hint="Maximum reply length"
          integer
        />
        <SliderRow
          label="Context length"
          value={s.contextLength}
          min={512}
          max={8192}
          step={512}
          onValueChange={s.setContextLength}
          hint="How much history to keep in RAM (larger = more memory)"
          integer
        />
        <SliderRow
          label="GPU layers"
          value={s.gpuLayers}
          min={0}
          max={99}
          step={1}
          onValueChange={s.setGpuLayers}
          hint="0 = CPU only. Higher offloads layers to GPU if supported."
          integer
        />
      </Section>

      {/* Persona / system prompt */}
      <Section title="Persona">
        <TouchableOpacity style={styles.row} onPress={() => setPromptModalVisible(true)}>
          <View style={styles.rowLeft}>
            <Text style={styles.emoji}>{activePreset?.emoji}</Text>
            <View>
              <Text style={styles.rowLabel}>{activePreset?.label ?? 'Custom'}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{activePreset?.description}</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textSubtle} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            Alert.prompt?.(
              'Custom system prompt',
              'Override the persona with your own text. Leave empty to use the persona.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Save', onPress: (text) => s.setCustomSystemPrompt(text?.trim() || null) },
              ],
              'default',
              s.customSystemPrompt ?? '',
            ) ?? Alert.alert('Custom prompt', 'Edit prompts.ts to add a preset, or use the persona selector above.');
          }}
        >
          <View style={styles.rowLeft}>
            <Icon name="pencil" size={20} color={colors.accent} />
            <View>
              <Text style={styles.rowLabel}>Custom system prompt</Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {s.customSystemPrompt ? s.customSystemPrompt.slice(0, 50) + '…' : 'Not set — using persona'}
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textSubtle} />
        </TouchableOpacity>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Icon name="theme-light-dark" size={20} color={colors.accent} />
            <Text style={styles.rowLabel}>Theme</Text>
          </View>
          <View style={styles.segmented}>
            {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.segment, s.themeMode === mode && styles.segmentActive]}
                onPress={() => s.setThemeMode(mode)}
              >
                <Text style={[styles.segmentText, s.themeMode === mode && styles.segmentTextActive]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ToggleRow
          icon="vibrate"
          label="Haptic feedback"
          value={s.hapticsEnabled}
          onValueChange={s.setHaptics}
        />
        <ToggleRow
          icon="ray-start-arrow"
          label="Stream responses"
          value={s.streamingEnabled}
          onValueChange={s.setStreaming}
        />
        <ToggleRow
          icon="arrow-collapse-down"
          label="Auto-scroll to bottom"
          value={s.autoScroll}
          onValueChange={s.setAutoScroll}
        />
      </Section>

      {/* Data */}
      <Section title="Data">
        <TouchableOpacity style={styles.row} onPress={() => refreshDownloaded()}>
          <View style={styles.rowLeft}>
            <Icon name="refresh" size={20} color={colors.accent} />
            <Text style={styles.rowLabel}>Rescan model directory</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, styles.dangerRow]} onPress={handleClearAll}>
          <View style={styles.rowLeft}>
            <Icon name="trash-can-outline" size={20} color={colors.danger} />
            <Text style={[styles.rowLabel, { color: colors.danger }]}>Clear all data</Text>
          </View>
        </TouchableOpacity>
      </Section>

      <View style={styles.about}>
        <Text style={styles.aboutTitle}>HandyAi v1.0.0</Text>
        <Text style={styles.aboutText}>
          Runs LLMs fully offline on your Android device using llama.cpp. Inspired by PocketPal AI.
        </Text>
      </View>

      {/* Persona picker modal */}
      <Modal visible={promptModalVisible} transparent animationType="slide" onRequestClose={() => setPromptModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPromptModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose a persona</Text>
            {SYSTEM_PROMPT_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.presetRow, s.activePromptId === p.id && styles.presetRowActive]}
                onPress={() => { s.setPromptId(p.id); s.setCustomSystemPrompt(null); setPromptModalVisible(false); }}
              >
                <Text style={styles.presetEmoji}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.presetLabel}>{p.label}</Text>
                  <Text style={styles.presetDesc}>{p.description}</Text>
                </View>
                {s.activePromptId === p.id && <Icon name="check" size={18} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// ---- subcomponents ----

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SliderRow({
  label, value, min, max, step, onValueChange, hint, integer,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (v: number) => void;
  hint?: string;
  integer?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.sliderHeader}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{integer ? Math.round(value) : value.toFixed(2)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.surfaceVariant}
        thumbTintColor={colors.accent}
      />
      {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
    </View>
  );
}

function ToggleRow({
  icon, label, value, onValueChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon name={icon} size={20} color={colors.accent} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceVariant, true: colors.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rowLabel: { color: colors.text, fontSize: fontSize.md, fontFamily: fontFamily.body },
  rowSub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  rowHint: { color: colors.textSubtle, fontSize: fontSize.xs, marginTop: spacing.xs },
  emoji: { fontSize: fontSize.lg, width: 24, textAlign: 'center' },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  slider: { width: '100%', height: 32, marginTop: spacing.xs },
  sliderValue: { color: colors.accent, fontSize: fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '600' },
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceVariant, borderRadius: radius.md, padding: 2 },
  segment: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '500' },
  segmentTextActive: { color: '#FFFFFF', fontSize: fontSize.xs, fontWeight: '600' },
  dangerRow: { borderBottomWidth: 0 },
  about: { marginTop: spacing.xl, paddingHorizontal: spacing.md },
  aboutTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', textAlign: 'center' },
  aboutText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.xs, lineHeight: fontSize.sm * 1.5 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  modalTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.md, textAlign: 'center' },
  presetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
  presetRowActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  presetEmoji: { fontSize: fontSize.xl, width: 28, textAlign: 'center' },
  presetLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  presetDesc: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
});
