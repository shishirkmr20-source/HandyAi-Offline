/**
 * llamaService — single source of truth for llama.cpp interaction.
 *
 * Wraps `react-native-llama` (which wraps llama.cpp via JNI). All inference
 * happens on-device; no network calls are made from this module.
 *
 * Lifecycle:
 *   1. initContext(modelPath, params) — load the GGUF, returns contextId
 *  2. sendCompletion(contextId, prompt, params) — async generator yielding tokens
 *   3. releaseContext(contextId) — free memory
 *
 * The store layer (modelStore) is the only caller of these functions.
 */
import {
  initLlama,
  llamaChatCompletion,
  releaseAllLlama,
  LlamaContext,
  LlamaChatMessage,
  LlamaContextParams,
} from 'react-native-llama';

export interface CompletionParams {
  temperature: number;
  topP: number;
  maxTokens: number;
  stop?: string[];
}

export interface StreamingCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError?: (error: Error) => void;
}

let activeContext: LlamaContext | null = null;
let activeModelPath: string | null = null;

/**
 * Load a .gguf model into memory and return a context handle.
 * Throws if the model file does not exist or the GGUF is invalid.
 */
export async function initContext(
  modelPath: string,
  contextLength: number = 4096,
  gpuLayers: number = 0,
): Promise<LlamaContext> {
  // If we already have a context for the same path, reuse it.
  if (activeContext && activeModelPath === modelPath) {
    return activeContext;
  }

  // Otherwise release the previous one first to free RAM.
  if (activeContext) {
    try {
      await activeContext.release();
    } catch (e) {
      // best-effort cleanup
    }
    activeContext = null;
    activeModelPath = null;
  }

  const params: LlamaContextParams = {
    n_ctx: contextLength,
    n_gpu_layers: gpuLayers, // 0 = CPU-only; raise on devices with stable GPU drivers
    n_threads: 4,
    embedding: false,
    n_batch: 512,
  };

  try {
    const ctx = await initLlama(modelPath, params);
    activeContext = ctx;
    activeModelPath = modelPath;
    return ctx;
  } catch (err) {
    throw new Error(
      `Failed to load model: ${err instanceof Error ? err.message : String(err)}. ` +
        `Ensure the .gguf file is intact and your device has enough free RAM.`,
    );
  }
}

/**
 * Run a single chat completion with streaming tokens.
 *
 * `messages` should include the system prompt as the first item.
 */
export async function sendCompletion(
  messages: LlamaChatMessage[],
  params: CompletionParams,
  callbacks: StreamingCallbacks,
): Promise<void> {
  if (!activeContext) {
    callbacks.onError?.(new Error('No model is loaded. Activate a model first.'));
    return;
  }

  let fullText = '';

  try {
    const result = await llamaChatCompletion(activeContext, {
      messages,
      temperature: params.temperature,
      top_p: params.topP,
      n_predict: params.maxTokens,
      stop: params.stop,
      stream: true,
    });

    for await (const chunk of result) {
      const token = chunk.token ?? '';
      if (token) {
        fullText += token;
        callbacks.onToken(token);
      }
      if (chunk.stop) {
        break;
      }
    }

    callbacks.onComplete(fullText);
  } catch (err) {
    callbacks.onError?.(
      err instanceof Error ? err : new Error(String(err)),
    );
  }
}

/**
 * Force-unload the active model. Called when the user switches models or
 * the app is backgrounded under memory pressure.
 */
export async function releaseActiveContext(): Promise<void> {
  if (activeContext) {
    try {
      await activeContext.release();
    } catch {
      // ignore
    }
  }
  activeContext = null;
  activeModelPath = null;
}

/**
 * Release ALL contexts — call on app shutdown.
 */
export async function releaseAll(): Promise<void> {
  try {
    await releaseAllLlama();
  } catch {
    // ignore
  }
  activeContext = null;
  activeModelPath = null;
}

/**
 * Quick check: is a model currently loaded?
 */
export function hasActiveContext(): boolean {
  return activeContext !== null;
}

export function getActiveModelPath(): string | null {
  return activeModelPath;
}
