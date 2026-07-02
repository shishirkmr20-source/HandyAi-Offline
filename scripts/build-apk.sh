#!/usr/bin/env bash
# HandyAi — APK build helper
#
# Run this on your dev machine (Linux/macOS/WSL) to produce app-release.apk.
# Prerequisites:
#   - Node.js 18+   (https://nodejs.org)
#   - JDK 17         (sdk install java | brew install openjdk@17)
#   - Android SDK    (cmdline-tools + platforms;android-34 + build-tools;34.0.0 + ndk;26.1.10909125)
#   - ANDROID_HOME   environment variable pointing to the SDK
#
# Usage:
#   ./scripts/build-apk.sh           # debug + release
#   ./scripts/build-apk.sh release   # release only
#   ./scripts/build-apk.sh keystore  # generate upload keystore only
#
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

MODE="${1:-release}"

gen_keystore() {
  local ks="$PROJECT_ROOT/android/app/upload-keystore.jks"
  if [ -f "$ks" ]; then
    echo ">> Keystore already exists at $ks — skipping."
    return
  fi
  echo ">> Generating upload keystore (password: handyai)"
  keytool -genkeypair \
    -v \
    -storetype PKCS12 \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias handyai \
    -keystore "$ks" \
    -storepass handyai \
    -keypass handyai \
    -dname "CN=HandyAi, OU=App, O=HandyAi, L=City, ST=State, C=US"

  cat > "$PROJECT_ROOT/android/app/upload-keystore.properties" <<EOF
HANDYAI_UPLOAD_STORE_FILE=upload-keystore.jks
HANDYAI_UPLOAD_STORE_PASSWORD=handyai
HANDYAI_UPLOAD_KEY_ALIAS=handyai
HANDYAI_UPLOAD_KEY_PASSWORD=handyai
EOF

  echo ">> Keystore written to $ks"
  echo ">> Properties written to android/app/upload-keystore.properties"
}

install_deps() {
  if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo ">> Installing npm dependencies…"
    npm install
  fi
}

build_debug() {
  echo ">> Building debug APK…"
  cd "$PROJECT_ROOT/android"
  ./gradlew assembleDebug
  cd "$PROJECT_ROOT"
  local apk="$PROJECT_ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
  echo "✓ Debug APK ready: $apk"
}

build_release() {
  gen_keystore
  install_deps
  echo ">> Building release APK…"
  cd "$PROJECT_ROOT/android"
  ./gradlew assembleRelease --no-daemon
  cd "$PROJECT_ROOT"
  local apk="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-release.apk"
  echo "✓ Release APK ready: $apk"
  echo ""
  echo "Install on a connected device with:"
  echo "  adb install -r $apk"
}

case "$MODE" in
  keystore) gen_keystore ;;
  debug)    install_deps; build_debug ;;
  release)  build_release ;;
  *)        build_release ;;
esac
