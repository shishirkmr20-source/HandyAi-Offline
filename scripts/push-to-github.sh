#!/usr/bin/env bash
#
# HandyAi — push source to GitHub and trigger CI APK build
#
# Usage (run on your dev machine, NEVER share your token):
#   cd HandyAi
#   export GH_TOKEN='your-new-personal-access-token-here'
#   ./scripts/push-to-github.sh
#
# This script:
#   1. Authenticates GitHub CLI with $GH_TOKEN (never written to any file)
#   2. Initializes git locally if needed
#   3. Creates the public repo github.com/shishirkmr20-source/HandyAi
#   4. Commits and pushes all source files to main
#   5. Tags v1.0.0 and pushes the tag (triggers the release-APK build)
#
# After ~15-25 minutes, your APK will be downloadable at:
#   https://github.com/shishirkmr20-source/HandyAi/releases/latest/download/handyai.apk
#
set -euo pipefail

# ----- Config ----------------------------------------------------------------
GITHUB_USER="shishirkmr20-source"
REPO_NAME="HandyAi"
REPO_DESC="HandyAi — Run LLMs fully offline on Android. Inspired by PocketPal AI."
RELEASE_TAG="v1.0.0"
DEFAULT_BRANCH="main"

# ----- Pre-flight checks -----------------------------------------------------
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ -z "${GH_TOKEN:-}" ]; then
  echo "ERROR: GH_TOKEN environment variable is not set."
  echo ""
  echo "Generate a new Personal Access Token at:"
  echo "  https://github.com/settings/tokens  (scope: repo)"
  echo ""
  echo "Then run:"
  echo "  export GH_TOKEN='your-new-token-here'"
  echo "  ./scripts/push-to-github.sh"
  exit 1
fi

# Check for gh CLI
if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) is not installed."
  echo "Install it from: https://cli.github.com/"
  exit 1
fi

# Check for git
if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is not installed."
  exit 1
fi

echo "================================================"
echo "  HandyAi — Push to GitHub"
echo "================================================"
echo "  User:       $GITHUB_USER"
echo "  Repo:       $REPO_NAME"
echo "  Visibility: public"
echo "  Tag:        $RELEASE_TAG"
echo "  Project:    $PROJECT_ROOT"
echo "================================================"
echo ""

# ----- Authenticate GitHub CLI ----------------------------------------------
echo ">> Authenticating GitHub CLI…"
echo "$GH_TOKEN" | gh auth login --with-token --hostname github.com 2>&1 | sed 's/^/   /'
gh auth status 2>&1 | sed 's/^/   /' || true

# ----- Initialize git --------------------------------------------------------
if [ ! -d "$PROJECT_ROOT/.git" ]; then
  echo ">> Initializing git repository…"
  git init -q
  git branch -M "$DEFAULT_BRANCH" 2>/dev/null || git checkout -b "$DEFAULT_BRANCH"
else
  echo ">> Git repository already exists."
fi

# Configure local git identity if not set
if ! git config user.email >/dev/null 2>&1; then
  git config user.email "$GITHUB_USER@users.noreply.github.com"
  echo "   git user.email set to $GITHUB_USER@users.noreply.github.com"
fi
if ! git config user.name >/dev/null 2>&1; then
  git config user.name "$GITHUB_USER"
  echo "   git user.name set to $GITHUB_USER"
fi

# ----- Create remote repo ----------------------------------------------------
echo ">> Checking for existing repository $GITHUB_USER/$REPO_NAME …"
if gh repo view "$GITHUB_USER/$REPO_NAME" >/dev/null 2>&1; then
  echo "   Repository already exists — reusing it."
else
  echo ">> Creating public repository $GITHUB_USER/$REPO_NAME …"
  gh repo create "$GITHUB_USER/$REPO_NAME" \
    --public \
    --description "$REPO_DESC" \
    --confirm=false 2>&1 | sed 's/^/   /' || \
  gh repo create "$GITHUB_USER/$REPO_NAME" --public --description "$REPO_DESC" 2>&1 | sed 's/^/   /'
fi

# ----- Set up remote ---------------------------------------------------------
REMOTE_URL="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"

if git remote get-url origin >/dev/null 2>&1; then
  echo ">> Updating origin remote URL…"
  git remote set-url origin "$REMOTE_URL"
else
  echo ">> Adding origin remote…"
  git remote add origin "$REMOTE_URL"
fi

# ----- Stage, commit, push ---------------------------------------------------
echo ">> Staging files…"
git add -A
# Don't fail if there's nothing to commit (re-runs)
if git diff --cached --quiet; then
  echo "   No changes to commit (already up to date)."
else
  echo ">> Committing…"
  git commit -m "Initial commit: HandyAi v1.0.0

- React Native 0.75 bare workflow + TypeScript
- llama.cpp via react-native-llama (fully offline inference)
- 4 screens: Chat / History / Models / Settings
- 5 preset GGUF models (Llama 3.2, Qwen 2.5, Phi-3.5, SmolLM2, TinyLlama)
- Dark-minimal UI, MMKV persistence, sideload .gguf support
- GitHub Actions workflow to build APK on every release tag"
fi

echo ">> Pushing to origin/$DEFAULT_BRANCH …"
git push -u origin "$DEFAULT_BRANCH" --force-with-lease 2>&1 | sed 's/^/   /'

# ----- Tag the release -------------------------------------------------------
echo ">> Tagging release $RELEASE_TAG …"
if git rev-parse "$RELEASE_TAG" >/dev/null 2>&1; then
  echo "   Tag $RELEASE_TAG already exists — pushing it."
  git push origin "$RELEASE_TAG" 2>&1 | sed 's/^/   /' || true
else
  git tag -a "$RELEASE_TAG" -m "HandyAi v1.0.0 — initial release"
  git push origin "$RELEASE_TAG" 2>&1 | sed 's/^/   /'
fi

# ----- Done ------------------------------------------------------------------
echo ""
echo "================================================"
echo "  ✓ Pushed successfully!"
echo "================================================"
echo ""
echo "Repo:"
echo "  https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "Watch the APK build (GitHub Actions):"
echo "  https://github.com/$GITHUB_USER/$REPO_NAME/actions"
echo ""
echo "Once the build finishes (~15-25 min), download the APK:"
echo "  https://github.com/$GITHUB_USER/$REPO_NAME/releases/latest/download/handyai.apk"
echo ""
echo "Direct install via adb (after build completes):"
echo "  curl -L -o handyai.apk https://github.com/$GITHUB_USER/$REPO_NAME/releases/latest/download/handyai.apk"
echo "  adb install -r handyai.apk"
echo ""
echo "Done!"
