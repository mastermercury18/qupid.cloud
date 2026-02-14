#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$ROOT_DIR/.venv"
TEST_SCRIPT="$ROOT_DIR/anthropic_test.py"
REQUIREMENTS_FILE="$ROOT_DIR/backend/requirements.txt"

echo "== Anthropic test: setup venv =="

if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR"
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

python3 -m pip install --upgrade pip
python3 -m pip install -r "$REQUIREMENTS_FILE"

echo "== Anthropic test: running anthropic_test.py =="

python3 "$TEST_SCRIPT"

echo "== Anthropic test: done =="
