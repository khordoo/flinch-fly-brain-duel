#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
repo="candidates/fly-brain-minecraft"
commit="6cfa30175003ef25da68a237d5eda958f8047b82"
if [ ! -d "$repo/.git" ]; then
  git clone https://github.com/blendi-remade/fly-brain-minecraft.git "$repo"
fi
git -C "$repo" fetch origin "$commit"
git -C "$repo" checkout --detach "$commit"
if ! rg -q 'setOutputSilenced' "$repo/src/main/java/com/fruitfly/brain/LifNetwork.java"; then
  git -C "$repo" apply ../../patches/fly-brain-minecraft-output-silencing.patch
fi
JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk}" PATH="${JAVA_HOME:-/opt/homebrew/opt/openjdk}/bin:$PATH" sh "$repo/gradlew" -p "$repo" test --console=plain
