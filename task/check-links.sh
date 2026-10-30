#!/bin/sh
# Checks the links from one entry (or snapshot) to other entries. Run from anywhere: sh task/check-links.sh
# Why: the same entry text is shown on its own page (docs/digests/), on the home page and in the
# Atom feed. A short link such as 2026-10-24-0811.html only works on the entry's own page and gives
# a 404 on the home page, so every link to an entry must use the full address
# https://ibrahimsobh.github.io/coding-agents-digest/digests/YYYY-MM-DD-HHMM.html and the entry must exist.
# It also checks the brief: a release link in brief.json must be a release in releases.json (the site
# makes a chip and a week map square from it), unless its link text says pre-release.
# Exit code 0 = fine, 1 = a link must be fixed.
cd "$(dirname "$0")/.." || exit 2
FULL='https://ibrahimsobh.github.io/coding-agents-digest/digests/'
bad=0

# 1. A link to an entry file name that is not the full address (short, ../ or root-relative)
short=$(grep -nE '\]\([^)]*[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{4}\.html' docs/digests/*.md docs/briefs/*.md docs/_data/*.json 2>/dev/null | grep -vF "]($FULL")
if [ -n "$short" ]; then
  echo "$short"
  echo "^ Use the full address: ${FULL}YYYY-MM-DD-HHMM.html"
  bad=1
fi

# 2. A full link must point to an entry that exists in docs/digests/
for u in $(grep -ohE "${FULL}[0-9-]+\.html" docs/digests/*.md docs/briefs/*.md docs/_data/*.json 2>/dev/null | sort -u); do
  f="docs/digests/$(basename "$u" .html).md"
  if [ ! -f "$f" ]; then
    echo "No such entry: $u (expected the file $f)"
    bad=1
  fi
done

# 3. A release link in the brief must be in releases.json, or say pre-release in its link text
tmp="${TMPDIR:-/tmp}/brief-links.$$"
grep -oE '\[[^]]*\]\(https://github\.com/[^)]*/releases/tag/[^)]*\)' docs/_data/brief.json | sort -u > "$tmp"
while IFS= read -r l; do
  case "$l" in *pre-release*) continue ;; esac
  t=${l##*/releases/tag/}; t=${t%)}
  if ! grep -qE "\"tag\": *\"$t\"" docs/_data/releases.json; then
    echo "brief.json links $t, which is not in releases.json: use a stable release, or write [pre-release $t](...)"
    bad=1
  fi
done < "$tmp"
rm -f "$tmp"

[ "$bad" = 0 ] && echo "links ok"
exit "$bad"
