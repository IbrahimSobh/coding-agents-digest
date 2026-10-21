# Coding Agents Weekly

A digest of what changed in AI coding agents, selected and explained.
Site: https://ibrahimsobh.github.io/coding-agents-weekly/

Tracked: Claude Code, Antigravity CLI (`agy`), OpenAI Codex CLI, Cline, Kilo Code.

Not a list of changelogs. Each digest picks the changes that matter, explains
What / Why it matters / When to use / Example, puts breaking changes first, and
notes themes across tools.

## How it works

A Claude scheduled task runs daily (later: twice a week). Each run:

1. Reads `task/state.json` (last digest date, last tag per tool).
2. Checks the Releases pages in `task/sources.yml` for newer stable releases.
3. If nothing is new: no commit.
4. Otherwise writes `docs/digests/YYYY-MM-DD.md`, updates `task/state.json`, and pushes to `main`.

GitHub Pages builds `docs/` with Jekyll. `docs/index.html` shows the latest digest
and lists all digests automatically.

## Files

| Path | Purpose |
|---|---|
| `task/PROMPT.md` | The scheduled task's instructions (source of truth) |
| `task/sources.yml` | Tools, Releases pages, tag patterns |
| `task/state.json` | Last digest date and last tag seen per tool |
| `docs/digests/` | One Markdown file per digest |
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
