#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
python3 tools/prepare_traces.py
python3 tools/evaluate_feasibility.py
