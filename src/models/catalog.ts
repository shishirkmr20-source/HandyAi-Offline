/**
 * Model catalog — known-good GGUF models that work offline with llama.cpp.
 *
 * Sizes are approximate Q4_K_M quantized sizes.
 * `url` points to the HuggingFace raw .gguf download.
 *
 * IMPORTANT: When you add a new model, also verify:
 *   1. It fits the target device's RAM (model size × 1.4 = RAM footprint).
 *   2. Context length (`context`) is supported by the GGUF.
 *   3. Chat template (`chatTemplate`) matches what the model was trained on.
 */

export interface ModelPreset {
  id: string;
  name: string;
  author: string;
  description: string;
  url: string;
  sizeMB: number;
  ramRequiredMB: number;
  context: number;
  defaultTemperature: number;
  defaultTopP: number;
  defaultMaxTokens: number;
  recommended?: boolean;
  tags: string[];
}

export const MODEL_CATALOG: ModelPreset[] = [
  {
    id: 'llama-3.2-1b-instruct-q4_k_m',
    name: 'Llama 3.2 1B Instruct',
    author: 'Meta',
    description:
      'Smallest of the Llama 3.2 family. Great general-purpose chat model that fits on phones with 2GB+ RAM. Recommended for first-time users.',
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    sizeMB: 700,
    ramRequiredMB: 1500,
    context: 4096,
    defaultTemperature: 0.7,
    defaultTopP: 0.9,
    defaultMaxTokens: 1024,
    recommended: true,
    tags: ['general', 'chat', 'english'],
  },
  {
    id: 'qwen2.5-1.5b-instruct-q4_k_m',
    name: 'Qwen2.5 1.5B Instruct',
    author: 'Alibaba',
    description:
      'Stronger multilingual (Chinese + English) and coding performance than Llama 3.2 1B. Needs ~1.5GB free RAM.',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    sizeMB: 990,
    ramRequiredMB: 1800,
    context: 32768,
    defaultTemperature: 0.7,
    defaultTopP: 0.9,
    defaultMaxTokens: 1024,
    tags: ['multilingual', 'coding', 'chinese'],
  },
  {
    id: 'phi-3.5-mini-instruct-q4_k_m',
    name: 'Phi-3.5 mini (3.8B)',
    author: 'Microsoft',
    description:
      'Best reasoning quality in this catalog. Needs a phone with 4GB+ free RAM. Slower but smarter answers.',
    url: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf',
    sizeMB: 2200,
    ramRequiredMB: 4000,
    context: 4096,
    defaultTemperature: 0.7,
    defaultTopP: 0.9,
    defaultMaxTokens: 1024,
    tags: ['reasoning', 'english'],
  },
  {
    id: 'smollm2-360m-instruct-q8_0',
    name: 'SmolLM2 360M',
    author: 'HuggingFace',
    description:
      'Tiny model that runs on virtually any phone, including low-end devices. Weaker answers but works everywhere.',
    url: 'https://huggingface.co/huggingface-internal/SmolLM2-360M-Instruct-GGUF/resolve/main/smollm2-360m-instruct-q8_0.gguf',
    sizeMB: 390,
    ramRequiredMB: 700,
    context: 2048,
    defaultTemperature: 0.7,
    defaultTopP: 0.9,
    defaultMaxTokens: 512,
    tags: ['tiny', 'low-end'],
  },
  {
    id: 'tinyllama-1.1b-chat-q4_k_m',
    name: 'TinyLlama 1.1B Chat',
    author: 'TinyLlama',
    description:
      'Lightweight chat model trained on the Llama 2 architecture. Decent general chat quality at ~660MB.',
    url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    sizeMB: 660,
    ramRequiredMB: 1300,
    context: 2048,
    defaultTemperature: 0.7,
    defaultTopP: 0.9,
    defaultMaxTokens: 512,
    tags: ['lightweight', 'chat'],
  },
];

export const DEFAULT_MODEL_ID = 'llama-3.2-1b-instruct-q4_k_m';

export function findPreset(id: string): ModelPreset | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}
