#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p public/godot
godot --headless --path godot --editor --import
godot --headless --path godot --export-release Web ../public/godot/index.html
