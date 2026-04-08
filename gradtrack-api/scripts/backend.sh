#!/usr/bin/env bash
set -euo pipefail

# Run from anywhere — resolves to gradtrack-api/ root
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

solution="gradtrack-api.sln"

DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet restore "$solution" --disable-build-servers -m:1
DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet build   "$solution" --disable-build-servers -m:1
DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet test    "$solution" --disable-build-servers -m:1
