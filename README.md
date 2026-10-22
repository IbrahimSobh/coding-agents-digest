# Coding Agents Digest

A digest of what changed in AI coding agents, selected and explained.

Site: https://ibrahimsobh.github.io/coding-agents-digest/

RSS (Atom): https://ibrahimsobh.github.io/coding-agents-digest/feed.xml

Tracked: Claude Code, Antigravity CLI (`agy`), OpenAI Codex CLI, Kilo Code, OpenCode.

Not a list of changelogs. Each digest is one short list ("In one minute"): the
changes that matter, one sentence each with a source link, breaking changes first
(marked ⚠️), and themes across tools.

## How it works

A Claude scheduled task runs twice a day (08:00 and 20:00 Cairo). Each run:

1. Reads `task/state.json` (last run, last tag per tool, last snapshot date).
2. Checks the sources in `task/sources.yml` for newer stable releases.
3. Writes one entry `docs/digests/YYYY-MM-DD-HHMM.md`: a short news list, or "No updates since ...".
4. Appends new releases to `docs/_data/releases.json` and each ⚠️ item to `docs/_data/actions.json`.
5. Rebuilds the 7-day brief `docs/_data/brief.json` (every run, quiet runs too).
6. If the last archived brief is 7+ days old, saves a snapshot in `docs/briefs/`.
7. Updates `task/state.json` and pushes to `main`.

GitHub Pages builds `docs/` with Jekyll. The home page shows the 7-day brief, the action
board, and a daily timeline of all checks. Release bars and the action board are computed
by the site from the data files, not by the model.

## Files

| Path | Purpose |
|---|---|
| `task/PROMPT.md` | The scheduled task's instructions (source of truth) |
| `task/sources.yml` | Tools, Releases pages, tag patterns |
| `task/state.json` | Last run, last tag per tool, last snapshot date |
| `docs/digests/` | One Markdown file per check |
| `docs/_data/brief.json` | The live 7-day brief |
| `docs/_data/actions.json` | Action board items (set `dismissed: true` to hide one) |
| `docs/_data/releases.json` | Every covered release (for the bars) |
| `docs/_data/tools.yml` | Tool names and colors |
| `docs/briefs/` | Weekly snapshots (archive, also in RSS) |
| `docs/_layouts/`, `docs/_includes/`, `docs/assets/style.css` | Site layout and style |
| `DESIGN.md` | Design notes and decisions (not published) |

## Change the schedule

Edit only the scheduled task's schedule. Each run covers everything since the
last digest, so the prompt does not change.

## Preview locally

```
gem install jekyll kramdown-parser-gfm webrick
cd docs && jekyll serve
```
