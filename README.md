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

1. Reads `task/state.json` (last digest date, last tag per tool).
2. Checks the Releases pages in `task/sources.yml` for newer stable releases.
3. Writes one entry `docs/digests/YYYY-MM-DD-HHMM.md`: a short news list, or "No new releases".
4. Updates `task/state.json` and pushes to `main`.

GitHub Pages builds `docs/` with Jekyll. `docs/index.html` shows the latest 14 checks
(one box per tool) and lists older ones automatically.

## Files

| Path | Purpose |
|---|---|
| `task/PROMPT.md` | The scheduled task's instructions (source of truth) |
| `task/sources.yml` | Tools, Releases pages, tag patterns |
| `task/state.json` | Last run time and last tag seen per tool |
| `docs/digests/` | One Markdown file per check |
| `docs/_layouts/`, `docs/assets/style.css` | Site layout and style |
| `DESIGN.md` | Design notes and decisions (not published) |

## Change the schedule

Edit only the scheduled task's schedule. Each run covers everything since the
last digest, so the prompt does not change.

## Preview locally

```
gem install jekyll kramdown-parser-gfm webrick
cd docs && jekyll serve
```
