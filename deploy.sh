#!/usr/bin/env bash
#
# deploy.sh — deploy the abdrx portfolio (static site) to abdulrahmanpro.online
#             on Hostinger.
# ---------------------------------------------------------------------------------
# Static site, no build step. Pushes index.html, the résumé PDF, assets/, and
# projects/ to the Hostinger public_html folder over SSH via rsync.
#
# SAFETY:
#   • DRY RUN by default — shows what WOULD change. Pass --go to actually deploy.
#   • Refuses to run unless REMOTE_DIR clearly points at an "abdulrahmanpro" folder.
#   • Additive by default (never deletes remote files); pass --delete to mirror
#     exactly (removes stray files on the server that aren't in the repo).
#   • README.md, .gitattributes, this script, and .github/ are never uploaded.
#   • This repo is PUBLIC — the host, port, and account username are NOT
#     hardcoded here. Every connection detail below is a required secret/env
#     var with no fallback, so nothing about the hosting account leaks into
#     git history. The script hard-fails with a clear message if any are unset.
#
# USAGE:
#   SSH_HOST=x SSH_PORT=x SSH_USER=x ./deploy.sh                # dry run
#   SSH_HOST=x SSH_PORT=x SSH_USER=x ./deploy.sh --go            # deploy for real
#   SSH_HOST=x SSH_PORT=x SSH_USER=x ./deploy.sh --go --delete   # also remove stray remote files
#
# AUTH (set one — SSH key strongly preferred over a password for a public repo's CI):
#   SSH_KEY=~/.ssh/your_key ./deploy.sh --go       # key auth (preferred)
#   SSH_PASS='yourpassword' ./deploy.sh --go       # password auth, needs `sshpass`
#
# REMOTE_DIR defaults to /home/$SSH_USER/domains/abdulrahmanpro.online/public_html;
# override with REMOTE_DIR=/custom/path if hPanel shows a different doc root.
# ---------------------------------------------------------------------------------
set -euo pipefail

: "${SSH_HOST:?ERROR: SSH_HOST is not set. Export it or add it as a GitHub secret — this script intentionally has no hardcoded default since the repo is public.}"
: "${SSH_PORT:?ERROR: SSH_PORT is not set.}"
: "${SSH_USER:?ERROR: SSH_USER is not set.}"
SSH_KEY="${SSH_KEY:-}"
SSH_PASS="${SSH_PASS:-}"
if [ -z "$SSH_KEY" ] && [ -z "$SSH_PASS" ]; then
  echo "ERROR: set either SSH_KEY (preferred) or SSH_PASS for authentication." >&2
  exit 1
fi
PUBLIC_URL="${PUBLIC_URL:-https://abdulrahmanpro.online}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_DIR="${REMOTE_DIR:-/home/${SSH_USER}/domains/abdulrahmanpro.online/public_html}"

DO_GO=0; DO_DELETE=0
for arg in "$@"; do
  case "$arg" in
    --go) DO_GO=1 ;;
    --delete) DO_DELETE=1 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# ---- SAFETY GUARD: only ever sync into the abdulrahmanpro folder. ----
case "$REMOTE_DIR" in
  *abdulrahmanpro*) : ;;
  *) echo "REFUSING: REMOTE_DIR must point at the abdulrahmanpro folder (got: $REMOTE_DIR)" >&2; exit 1 ;;
esac

# ---- transport (bash-3.2-safe; short ControlPath so it works on macOS too) ----
SSH_OPTS=(-p "$SSH_PORT" -o StrictHostKeyChecking=accept-new \
          -o ControlMaster=auto -o ControlPath=/tmp/.abdrx-%C -o ControlPersist=60)
[ -n "$SSH_KEY" ] && SSH_OPTS+=(-i "$SSH_KEY")
if [ -n "$SSH_PASS" ]; then
  command -v sshpass >/dev/null || { echo "ERROR: SSH_PASS set but sshpass not installed." >&2; exit 1; }
  PASS=(sshpass -p "$SSH_PASS")
else
  PASS=()
fi
ssh_cmd() { ${PASS[@]+"${PASS[@]}"} ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "$@"; }
RSH="ssh ${SSH_OPTS[*]}"

# Conservative rsync flags that work on BOTH GNU rsync and macOS openrsync
# (no -z / --human-readable which openrsync may reject; -e + -n are portable).
RSYNC_COMMON=(-rlptv -e "$RSH")
[ $DO_GO -eq 0 ] && RSYNC_COMMON+=(-n)
[ $DO_DELETE -eq 1 ] && RSYNC_COMMON+=(--delete)
rsync_run() { ${PASS[@]+"${PASS[@]}"} rsync "${RSYNC_COMMON[@]}" "$@"; }

EXCLUDES=(--exclude='.DS_Store' --exclude='.git/' --exclude='.github/' \
          --exclude='deploy.sh' --exclude='README.md' --exclude='.gitattributes' \
          --exclude='.gitignore')

echo "=================================================================="
echo " Deploy abdrx portfolio -> abdulrahmanpro.online"
echo "   mode  : $([ $DO_GO -eq 1 ] && echo 'LIVE --go' || echo 'DRY RUN')"
echo "   remote: ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"
echo "   delete: $([ $DO_DELETE -eq 1 ] && echo 'yes (mirrors exactly)' || echo 'no (additive)')"
echo "=================================================================="

echo "[1/2] Checking SSH + remote dir..."
ssh_cmd "test -d '$REMOTE_DIR'" || {
  echo "ERROR: remote doc root not found: $REMOTE_DIR" >&2
  echo "       Verify the domain's document root in hPanel and re-run with" >&2
  echo "       REMOTE_DIR=/correct/path ./deploy.sh  (path must contain 'abdulrahmanpro')." >&2
  exit 1
}

echo "[2/2] Syncing site$([ $DO_GO -eq 0 ] && echo ' [dry run]')..."
rsync_run "${EXCLUDES[@]}" "$ROOT"/ "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"

echo "=================================================================="
if [ $DO_GO -eq 1 ]; then
  echo " DONE — deployed to $PUBLIC_URL"
else
  echo " DRY RUN complete. Nothing written. Re-run with --go to deploy."
fi
echo "=================================================================="
