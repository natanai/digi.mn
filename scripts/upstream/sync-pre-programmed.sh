#!/usr/bin/env bash
# Integrate pre-programmed's shared engine changes without replacing digi.mn-specific work.
# Designed for the upstream-engine GitHub Action; can be run manually in a clean clone.
set -euo pipefail

UPSTREAM_REPO="${UPSTREAM_REPO:-https://github.com/natanai/pre-programmed.git}"
STATE_FILE="docs/source-snapshot.txt"
PATCH_FILE="${RUNNER_TEMP:-/tmp}/digi-upstream.patch"

if [[ ! -f "$STATE_FILE" ]]; then
  echo "::error::Missing $STATE_FILE (the authoritative upstream commit pin)."
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "::error::Refusing upstream synchronization with uncommitted changes."
  exit 1
fi

base_sha="$(sed -n 's/^last_integrated_commit: *//p' "$STATE_FILE" | head -n1)"
if [[ -z "$base_sha" ]]; then
  base_sha="$(sed -n 's/^source_commit: *//p' "$STATE_FILE" | head -n1)"
fi
if [[ ! "$base_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "::error::Invalid base commit in $STATE_FILE"
  exit 1
fi

if ! git remote get-url pre-programmed >/dev/null 2>&1; then
  git remote add pre-programmed "$UPSTREAM_REPO"
fi
git fetch --no-tags pre-programmed main
head_sha="$(git rev-parse refs/remotes/pre-programmed/main)"
if ! git cat-file -e "$base_sha^{commit}" 2>/dev/null; then
  git fetch --no-tags pre-programmed "$base_sha"
fi
if ! git merge-base --is-ancestor "$base_sha" "$head_sha"; then
  echo "::error::Upstream main no longer descends from the pinned base. Manual reconciliation required."
  exit 1
fi

echo "Previous imported/reviewed upstream: $base_sha"
echo "Current pre-programmed main:        $head_sha"

if [[ "$base_sha" == "$head_sha" ]]; then
  echo "Upstream already reviewed. No changes to propose."
  echo "UPSTREAM_CHANGED=false" >> "${GITHUB_ENV:-/dev/null}"
  exit 0
fi

# Only these exclusions are digi.mn-owned or pre-programmed-only.
# All other upstream paths (including new engine modules, Worker schema,
# package manifests, and application files) are reviewed through a three-way
# patch against the last successfully integrated upstream SHA.
#
# In particular, do not copy pre-programmed's Author UX audit: it remains
# canonical in the upstream repo rather than gaining a competing copy here.
git diff --binary --full-index "$base_sha" "$head_sha" -- . \
  ':(exclude)audit' \
  ':(exclude)docs' \
  ':(exclude).github' \
  ':(exclude)README.md' \
  ':(exclude)scripts/author-flow' > "$PATCH_FILE"

echo "Upstream changed files:"
git diff --name-status "$base_sha" "$head_sha" -- . \
  ':(exclude)audit' \
  ':(exclude)docs' \
  ':(exclude).github' \
  ':(exclude)README.md' \
  ':(exclude)scripts/author-flow'

if [[ -s "$PATCH_FILE" ]]; then
  # The recorded upstream SHA supplies the common ancestor even though the
  # repositories have independent Git histories. --3way uses patch blob IDs
  # instead of applying upstream's whole files on top of digi.mn.
  if ! git apply --3way --index "$PATCH_FILE"; then
    echo "::error::Shared-engine changes overlap digi.mn edits. Resolve manually; no conflicted code will be committed or pushed."
    git status --short
    exit 2
  fi
else
  echo "Only upstream-only audit/docs/workflow files changed; runtime already matches."
fi

if grep -q '^last_integrated_commit:' "$STATE_FILE"; then
  sed -i "s/^last_integrated_commit: .*/last_integrated_commit: $head_sha/" "$STATE_FILE"
else
  printf 'last_integrated_commit: %s\n' "$head_sha" >> "$STATE_FILE"
fi
git add "$STATE_FILE"

if git diff --cached --quiet; then
  echo "::error::Expected an upstream pin advance, but the Git index is unchanged."
  exit 1
fi
git -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
  commit -m "chore: integrate pre-programmed through ${head_sha:0:12}"
echo "UPSTREAM_CHANGED=true" >> "${GITHUB_ENV:-/dev/null}"
echo "UPSTREAM_BASE=$base_sha" >> "${GITHUB_ENV:-/dev/null}"
echo "UPSTREAM_HEAD=$head_sha" >> "${GITHUB_ENV:-/dev/null}"
echo "Upstream reconciliation committed locally; verify tests before proposing a PR."
