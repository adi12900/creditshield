#!/usr/bin/env bash
# Render build script with pre-build configuration

set -o errexit

# Upgrade pip and install build tools
pip install --upgrade pip setuptools wheel

# Install dependencies without building from source where possible
pip install --prefer-binary --no-cache-dir -r requirements.txt
