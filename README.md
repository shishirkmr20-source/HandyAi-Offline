# HandyAi

[![Build APK](https://github.com/shishirkmr20-source/HandyAi/actions/workflows/build-apk.yml/badge.svg)](https://github.com/shishirkmr20-source/HandyAi/actions/workflows/build-apk.yml)
[![Release](https://img.shields.io/github/v/release/shishirkmr20-source/HandyAi?include_prereleases)](https://github.com/shishirkmr20-source/HandyAi/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Run LLMs **fully offline** on Android. Inspired by [PocketPal AI](https://github.com/pocketpal-ai/pocketpal-ai).

**📥 Download APK:** [latest release](https://github.com/shishirkmr20-source/HandyAi/releases/latest) · [direct APK link](https://github.com/shishirkmr20-source/HandyAi/releases/latest/download/handyai.apk)

HandyAi bundles [llama.cpp](https://github.com/ggerganov/llama.cpp) via [`react-native-llama`](https://github.com/mybigday/react-native-llama) and runs quantized GGUF models directly on your phone's CPU/GPU. Once a model is downloaded, **no internet connection is required** for inference — your prompts, completions, and chat history never leave the device.

---

## 📲 Install the APK (no build required)

1. On your Android phone, open the [latest release page](https://github.com/shishirkmr20-source/HandyAi/releases/latest) or tap this direct link: **[download handyai.apk](https://github.com/shishirkmr20-source/HandyAi/releases/latest/download/handyai.apk)**.
2. Allow "Install from unknown sources" when prompted (Android shows this the first time).
3. Open HandyAi → **Models** tab → download a model (e.g. Llama 3.2 1B) → **Activate**.
4. Switch to **Chat** and start talking. Disable Wi-Fi/mobile data — chat still works.

> The APK is signed with a CI-generated self-signed certificate. Android will warn "Play Protect doesn't recognise this app's developer" — this is expected; tap **Install anyway**.

---

## ⚡ What's in this repo

A complete, buildable **React Native (bare workflow)** project, ready to compile to a real `.apk` file.

| Layer | Tech |
|------|------|
| UI | React Native 0.75 + TypeScript + React Navigation |
| Theme | Dark minimal (ChatGPT-inspired), Material-ish |
| State | Zustand + MMKV (synchronous persistence) |
| LLM inference | `react-native-llama` (llama.cpp JNI bindings) |
| Filesystem | `react-native-fs` (downloads, model cache) |
| Markdown | `react-native-markdown-display` (renders assistant replies) |
| Sideload | `react-native-document-picker` (import your own `.gguf`) |
| Target | Android 9+ (API 28+), `arm64-v8a` |

### Screens

- **Chat** — streaming tokens, multi-turn, regenerate, edit & resend, stop generation
- **History** — list / rename / pin / delete past conversations
- **Models** — browse catalog, download with progress bar, activate, remove, sideload custom `.gguf`
- **Settings** — temperature / top-p / max tokens / context length / GPU layers, persona presets, theme, haptics, data reset

### Default model catalog

| Model | Size | RAM | Best for |
|-------|------|-----|----------|
| Llama 3.2 1B Instruct (Q4_K_M) | 700 MB | 1.5 GB | General chat (recommended) |
| Qwen2.5 1.5B Instruct (Q4_K_M) | 990 MB | 1.8 GB | Multilingual + coding |
| Phi-3.5 mini (Q4_K_M) | 2.2 GB | 4 GB | Best reasoning |
| SmolLM2 360M (Q8_0) | 390 MB | 700 MB | Low-end phones |
| TinyLlama 1.1B Chat (Q4_K_M) | 660 MB | 1.3 GB | Lightweight chat |

Edit `src/models/catalog.ts` to add your own.

---

## 🛠 Prerequisites (one-time setup on your dev machine)

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| JDK | 17 | `sdk install java 17.0.10-open` / `brew install openjdk@17` |
| Android SDK | API 34 + build-tools 34.0.0 + NDK 26.1.10909125 | Android Studio SDK Manager |
| CMake | 3.22.1 | Android Studio SDK Manager (under SDK Tools) |

Then set environment variables (add to `~/.bashrc` / `~/.zshrc`):

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Verify:

```bash
node --version          # v18+
java -version           # 17.x
adb devices             # should list your connected phone
```

---

## 🚀 Build the APK

### Option A — one-shot script

```bash
cd HandyAi
./scripts/build-apk.sh release
```

The script will:
1. Generate an upload keystore at `android/app/upload-keystore.jks` (password: `handyai`)
2. `npm install`
3. `cd android && ./gradlew assembleRelease`
4. Print the path to the finished APK

### Option B — manual

```bash
# 1. Install JS deps
npm install

# 2. Generate a release keystore (one-time)
cd android/app
keytool -genkeypair -v \
  -storetype PKCS12 -keyalg RSA -keysize 2048 -validity 10000 \
  -alias handyai -keystore upload-keystore.jks \
  -storepass handyai -keypass handyai \
  -dname "CN=HandyAi, OU=App, O=HandyAi, L=City, ST=State, C=US"

cat > upload-keystore.properties <<EOF
HANDYAI_UPLOAD_STORE_FILE=upload-keystore.jks
HANDYAI_UPLOAD_STORE_PASSWORD=handyai
HANDYAI_UPLOAD_KEY_ALIAS=handyai
HANDYAI_UPLOAD_KEY_PASSWORD=handyai
EOF
cd ../..

# 3. Build the release APK
cd android && ./gradlew assembleRelease
```

### Output

```
android/app/build/outputs/apk/release/app-release.apk
```

### Install on a phone

```bash
# Enable USB debugging on the phone first, then:
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Or copy the APK to your phone's downloads and tap to install.

---

## 📱 Using the app

1. **First launch** — HandyAi opens to the **Chat** tab. The status strip at the top says "🔴 No model". Tap the **Models** tab.
2. **Download a model** — Pick **Llama 3.2 1B Instruct** (recommended). The download uses your Wi-Fi connection and shows a progress bar. Sizes are quantized Q4_K_M (smaller, faster).
3. **Activate** — Tap **Activate** to load the model into RAM. This takes ~5–15 seconds depending on the model size and your phone.
4. **Chat** — Switch back to the Chat tab and type. The first token may take a few seconds; subsequent tokens stream at 5–40 tokens/sec on modern phones.
5. **Go offline** — Disable Wi-Fi and mobile data. Chat will keep working — that's the whole point of HandyAi.
6. **Switch models** — Models tab → Activate a different model. The previous one is automatically unloaded to free RAM.
7. **Sideload** — Models tab → **Sideload .gguf** to import any GGUF file you transferred to your phone.

---

## 🏗 Project structure

```
HandyAi/
├── android/                          # Gradle project (compiles to APK)
│   ├── app/
│   │   ├── build.gradle              # minSdk 28, arm64-v8a, signing config
│   │   ├── proguard-rules.pro        # keeps llama.cpp JNI symbols
│   │   └── src/main/
│   │       ├── AndroidManifest.xml   # permissions: INTERNET (downloads only), VIBRATE, WAKE_LOCK
│   │       ├── java/com/handyai/     # MainActivity + MainApplication
│   │       └── res/                  # dark theme, strings, colors
│   ├── build.gradle                  # NDK 26, Kotlin 1.9.24
│   ├── settings.gradle               # autolinks react-native-llama + others
│   └── gradle.properties             # hermesEnabled, arm64-v8a only
├── src/
│   ├── App.tsx                       # boot — dirs, MMKV, preload active model
│   ├── navigation/AppNavigator.tsx   # bottom-tab nav
│   ├── screens/
│   │   ├── ChatScreen.tsx            # streaming chat + auto-scroll
│   │   ├── HistoryScreen.tsx         # chat list, rename/pin/delete
│   │   ├── ModelsScreen.tsx          # catalog, download/activate/sideload
│   │   └── SettingsScreen.tsx        # generation params, persona, theme
│   ├── components/
│   │   ├── ChatBubble.tsx            # markdown render for assistant
│   │   ├── MessageInput.tsx          # auto-grow input + send/stop
│   │   ├── ModelCard.tsx             # preset row with progress + actions
│   │   ├── TypingIndicator.tsx       # pulsing dots before first token
│   │   ├── EmptyState.tsx
│   │   └── HeaderButton.tsx
│   ├── store/
│   │   ├── chatStore.ts              # chats + messages + streaming state
│   │   ├── modelStore.ts             # downloaded models + download progress
│   │   └── settingsStore.ts          # persisted prefs
│   ├── services/
│   │   ├── llamaService.ts           # initContext / sendCompletion / release
│   │   ├── downloadService.ts        # RNFS downloadFile with progress
│   │   └── storageService.ts         # MODELS_DIR + helpers
│   ├── models/
│   │   ├── catalog.ts                # preset GGUFs (edit to add your own)
│   │   └── prompts.ts                # persona presets
│   └── theme/colors.ts               # dark palette + spacing + radius
├── scripts/build-apk.sh              # one-shot build helper
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── app.json
└── index.js
```

---

## 🔧 Customizing

### Add a new model to the catalog

Edit `src/models/catalog.ts`:

```ts
{
  id: 'my-custom-model-q4',
  name: 'My Custom Model',
  author: 'Your Org',
  description: '…',
  url: 'https://huggingface.co/your-org/your-model-gguf/resolve/main/your-model-q4_k_m.gguf',
  sizeMB: 850,
  ramRequiredMB: 1700,
  context: 4096,
  defaultTemperature: 0.7,
  defaultTopP: 0.9,
  defaultMaxTokens: 1024,
  tags: ['custom'],
}
```

### Add a persona

Edit `src/models/prompts.ts` and append a new entry to `SYSTEM_PROMPT_PRESETS`.

### Change the theme

Edit `src/theme/colors.ts`. All screens read from this single source.

### Build for x86_64 (emulator testing)

Edit `android/gradle.properties`:

```properties
reactNativeArchitectures=arm64-v8a,x86_64
```

And add `x86_64` to the `abiFilters` in `android/app/build.gradle`.

---

## ❓ Troubleshooting

| Symptom | Fix |
|---------|-----|
| `llama.cpp` build fails with CMake error | Make sure NDK 26.1.10909125 is installed via SDK Manager → SDK Tools → NDK (Side by side). |
| `OutOfMemoryError` during Gradle build | Edit `android/gradle.properties` → increase `org.gradle.jvmargs=-Xmx8192m`. |
| App crashes on launch | Check `adb logcat \| grep -i handyai`. Most likely the GGUF file is corrupt — re-download. |
| `Model not downloaded yet` alert | The download didn't finish. Models tab → Cancel → re-download over stable Wi-Fi. |
| Very slow token generation | Try a smaller model, lower `context length` in Settings, or raise `GPU layers`. |
| App killed by OS when backgrounded | Disable battery optimization for HandyAi in Android Settings → Apps. |
| `Keystore file not set for release config` | You forgot to run `./scripts/build-apk.sh keystore` (or generate it manually per Option B above). |

---

## 🔒 Privacy

- **No analytics, no telemetry, no crash reporting.**
- The `INTERNET` permission is used **only** to download model files from HuggingFace. Once a model is on disk, all inference is local.
- Chat history is stored in MMKV (encrypted device storage, never uploaded).
- No model weights, prompts, or completions ever leave the device.

---

## 🤖 Continuous Integration (GitHub Actions)

This repo includes a workflow at [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) that:

1. Triggers automatically on every push to `main` and on every `v*` tag.
2. Sets up JDK 17, Node 18, Android SDK 34, NDK 26, CMake 3.22.1.
3. Generates a CI-only signing keystore (self-signed).
4. Runs `./gradlew assembleRelease` — this also compiles `llama.cpp` from native sources via the NDK (first build is ~15-25 min, cached after).
5. Uploads the APK as a build artifact (90-day retention).
6. **On tag push:** creates a GitHub Release with `handyai.apk` as a downloadable asset.

To cut a new release locally:

```bash
git tag -a v1.1.0 -m "HandyAi v1.1.0"
git push origin v1.1.0
```

~15 minutes later the APK will be live at:

```
https://github.com/shishirkmr20-source/HandyAi/releases/latest/download/handyai.apk
```

You can also trigger a build manually from the **Actions** tab → **Build APK** → **Run workflow**.

---

## 📜 License

MIT — same as PocketPal AI. See `LICENSE`.

---

## 🙏 Acknowledgements

- [PocketPal AI](https://github.com/pocketpal-ai/pocketpal-ai) — original inspiration, similar architecture
- [llama.cpp](https://github.com/ggerganov/llama.cpp) — Georgi Gerganov's incredible inference engine
- [react-native-llama](https://github.com/mybigday/react-native-llama) — RN bindings for llama.cpp
- [Meta Llama 3.2](https://llama.com), [Qwen 2.5](https://qwenlm.github.io), [Microsoft Phi-3.5](https://huggingface.co/microsoft/Phi-3.5-mini-instruct), [HuggingFace SmolLM2](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct)
