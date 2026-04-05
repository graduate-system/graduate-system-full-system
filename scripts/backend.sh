#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

solution="backend/graduate-system-worker.sln"

DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet restore "$solution" --disable-build-servers -m:1
DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet build "$solution" --disable-build-servers -m:1
DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet test "$solution" --disable-build-servers -m:1
