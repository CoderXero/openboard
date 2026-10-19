#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
default_package="$script_dir/../dist/OpenBoard-0.1.0-amd64.deb"
package_path="${1:-$default_package}"

if [[ ! -f "$package_path" ]]; then
  printf 'Package not found: %s\n' "$package_path" >&2
  printf 'Usage: bash scripts/install-linux.sh [path/to/OpenBoard-*.deb]\n' >&2
  exit 1
fi

sudo apt install --reinstall "$package_path"

if [[ ! -e /opt/OpenBoard/chrome-sandbox ]]; then
  printf 'Installation completed, but /opt/OpenBoard/chrome-sandbox was not found.\n' >&2
  exit 1
fi

sandbox_mode="$(stat -c '%a' /opt/OpenBoard/chrome-sandbox)"
sandbox_owner="$(stat -c '%U:%G' /opt/OpenBoard/chrome-sandbox)"
if [[ "$sandbox_mode" != "4755" || "$sandbox_owner" != "root:root" ]]; then
  printf 'Invalid Electron sandbox permissions: mode=%s owner=%s (expected 4755 root:root)\n' "$sandbox_mode" "$sandbox_owner" >&2
  exit 1
fi

printf 'OpenBoard installed successfully. If Electron environment variables are set, launch with:\n'
printf '  env -u ELECTRON_RUN_AS_NODE -u ELECTRON_NO_ATTACH_CONSOLE openboard --disable-gpu\n'
