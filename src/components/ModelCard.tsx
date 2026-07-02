/**
 * ModelCard — a single row in the Models screen.
 * Shows preset metadata, download progress, and activate/remove buttons.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius, fontSize, fontFamily } from '../theme/colors';
import type { ModelPreset } from '../models/catalog';
import type { DownloadProgress } from '../store/modelStore';

interface Props {
  preset: ModelPreset;
  isDownloaded: boolean;
  isActive: boolean;
  isLoading: boolean;
  progress?: DownloadProgress;
  onDownload: () => void;
  onCancel: () => void;
  onActivate: () => void;
  onRemove: () => void;
}

export function ModelCard({
  preset,
  isDownloaded,
  isActive,
  isLoading,
  progress,
  onDownload,
  onCancel,
  onActivate,
  onRemove,
}: Props) {
  const isDownloading = !!progress;

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {preset.name}
            </Text>
            {preset.recommended && <View style={styles.badge}><Text style={styles.badgeText}>RECOMMENDED</Text></View>}
          </View>
          <Text style={styles.author}>by {preset.author}</Text>
        </View>
        {isActive && (
          <View style={styles.activeBadge}>
            <Icon name="check-circle" size={14} color={colors.success} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
      </View>

      <Text style={styles.description}>{preset.description}</Text>

      <View style={styles.statsRow}>
        <Stat icon="memory" label={`${preset.sizeMB} MB`} />
        <Stat icon="cpu-64-bit" label={`≥ ${preset.ramRequiredMB} MB RAM`} />
        <Stat icon="format-text-wrapping-wrap" label={`${preset.context} ctx`} />
      </View>

      <View style={styles.tagsRow}>
        {preset.tags.map((t) => (
          <View key={t} style={styles.tag}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>

      {isDownloading && progress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress.percent.toFixed(1)}% · {progress.downloadedMB} / {progress.totalMB} MB
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionRow}>
        {!isDownloaded && !isDownloading && (
          <TouchableOpacity style={styles.primaryButton} onPress={onDownload} activeOpacity={0.7}>
            <Icon name="download" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Download</Text>
          </TouchableOpacity>
        )}

        {isDownloaded && !isActive && (
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={onActivate}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="play" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Activate</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isDownloaded && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onRemove} activeOpacity={0.7}>
            <Icon name="trash-can-outline" size={18} color={colors.danger} />
            <Text style={styles.secondaryButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Stat({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Icon name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleBlock: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', fontFamily: fontFamily.body },
  author: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  activeText: { color: colors.success, fontSize: fontSize.xs, fontWeight: '600' },
  description: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.5, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: colors.textMuted, fontSize: fontSize.xs },
  tagsRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.md },
  tag: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagText: { color: colors.textMuted, fontSize: fontSize.xs },
  progressContainer: { marginBottom: spacing.md },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  progressText: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs, textAlign: 'center' },
  cancelButton: { alignSelf: 'center', marginTop: spacing.sm },
  cancelText: { color: colors.danger, fontSize: fontSize.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: fontSize.md },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  secondaryButtonText: { color: colors.danger, fontSize: fontSize.md, fontWeight: '500' },
});
