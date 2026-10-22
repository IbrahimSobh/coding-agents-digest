# Scheduled task: Coding Agents Digest

You run on a schedule (twice a day) in a fresh session. You have no memory of earlier
runs. Everything you need is in this file and in the repository.

## Your job

Check what changed in AI coding agents since the last run, and publish one entry per run
to the GitHub repo **`IbrahimSobh/coding-agents-digest`** (branch `main`).
GitHub Pages publishes `docs/` to https://ibrahimsobh.github.io/coding-agents-digest/.

**Every run writes an entry**, also when nothing is new (a short "no new releases" entry).
This way the site shows that each check happened.

The value of an entry is not the list of changes. It is:
- **Selection**: the few changes that matter, out of hundreds of lines.
- **Explanation**: one short sentence per change: what it does, why it matters, or when to use it.
- **Action needed first**: breaking changes, removals and deadlines lead each tool, marked ⚠️.
- **Cross-tool view**: real themes across tools.

## Step by step

### 1. Get the repo and read the state
- If you have an `add_repo` tool, call it for owner `IbrahimSobh`, repo
  `coding-agents-digest`, with push access. Then clone as it says.
  Otherwise clone `https://github.com/IbrahimSobh/coding-agents-digest`. Work on branch `main`.
- Get the run time in Cairo: `TZ=Africa/Cairo date '+%Y-%m-%d %H:%M %z'`.
  All times in entries and in `state.json` are Cairo local time.
- Read `task/sources.yml` (tools, Releases pages, tag patterns, full-text sources).
- Read `task/state.json`: `last_run` and the `last_tag` of each tool
  (Cline has two tracks: `extension` and `cli`).

### 2. Find new releases
For each tool (and each Cline track), list the releases that match `tag_pattern` and are
**newer than `last_tag`** in `state.json` (compare by version number, not by date).

**How to read the sources. Read this carefully.**
- **Do NOT use `gh` or the GitHub API (`api.github.com`) for the 5 tool repos.** They are
  not attached to your session, so those calls fail with 403. A 403 from `gh` does NOT mean
  the source is unreadable. Use the methods below instead; they work.
- Method A, tags (always works): `git ls-remote --tags https://github.com/<owner>/<repo>`
  Example: `git ls-remote --tags https://github.com/anthropics/claude-code | grep -v '\^{}' | awk '{print $2}' | sort -V | tail -5`
- Method B, changelog text: `curl -sS <full_text URL from sources.yml>`
  (Claude Code and Antigravity CLI; files on `raw.githubusercontent.com`).
- Method C, release pages with dates and notes: your web fetch tool on
  `https://github.com/<owner>/<repo>/releases` or `.../releases/tag/<tag>`.
- Start with Method A for every tool. Only tags newer than `last_tag` need Methods B and C.
- A source counts as "could not read" only if **all** methods that apply to it failed.

Rules:
- Skip alpha, beta, rc, nightly, and any release marked "Pre-release" (check the release
  page with Method C for tools whose tags do not show it, e.g. Kilo Code).
- Skip tags listed under `ignored_tags`.
- Codex: stable tags are `rust-v0.x.y` without `-alpha`. Method A shows them.
- Release dates come from the release page. The page often shows no year:
  use the current year, unless that puts the date in the future (then use last year).
- If a source fails with every method, do not guess. Treat that tool as "not checked"
  (see step 4), and give the details (what failed, per method) in the run log only.

### 3. Read the full text (only if there are new releases)
- Claude Code and Antigravity CLI: take the sections of `CHANGELOG.md` for each new
  version (headings like `## 2.1.307` or `## 1.4.4`). Read only those sections.
- Codex, Cline, Kilo Code: read each new release's notes page.
- Kilo Code: a stable release repeats the notes of the pre-releases before it.
  Cover each note once, under the stable release.

### 4. Write the entry
File: `docs/digests/YYYY-MM-DD-HHMM.md`, using the Cairo run time (e.g. `2026-10-22-0800.md`).
- Any tool has a new release → "News entry" format.
- No tool has a new release → "Quiet entry" format.
- A tool whose source could not be read is "not checked". Never write "No updates" for it.
  Mention it in ONE short line only (see the formats). No error wording, no per-method details
  in the entry; those go in the run log.

### 5. Update `task/state.json`
- Always: set `last_run` to the run time (`YYYY-MM-DDTHH:MM+03:00`, with the real offset
  from the `date` command) and `last_entry_file` to the new file.
- For every tool with new releases: set `last_tag` and `last_release_date`
  to the newest release you covered. Leave other tools as they were.
- Do **not** edit `docs/index.html`. It lists entries automatically.

### 6. Commit and push
```
git add docs/digests task/state.json
git commit -m "Check YYYY-MM-DD HH:MM: <tools with releases, or 'no new releases'>"
git push origin main
```
- Push to `main` directly. Do not open a pull request. Do not push to another branch.
- If the push fails, retry once. If it still fails, end with the exact error
  (for example the 403 text). Never report success without a successful push.
- End with a short run log: time range, releases per tool, bullets written,
  number of "(verify)" marks, and the commit SHA.

## Entry formats

### Front matter (both formats, all fields required)
```
---
layout: digest
title: "Check: <Mon D, YYYY, HH:MM>"
date: YYYY-MM-DD HH:MM:00 +0300
run: "<Mon D, YYYY, HH:MM> (Cairo)"
since: "<Mon D, YYYY, HH:MM>"
quiet: <true for a quiet entry, false for a news entry>
summary: "<one sentence, max ~20 words>"
---
```
- `date`: the run time with the real offset from the `date` command.
- `since`: the previous `last_run` from `state.json`, in the same readable form.
- `summary`: news entry = the 2 or 3 biggest changes; quiet entry = `No updates.`

### Quiet entry: the whole body
```
No updates since <since>.
```
Only if some tools could not be read, add ONE more line:
`Not checked: <tool>, <tool> (source could not be read).`
If no tool could be read: `summary: "Not checked."` and the body is only
`Not checked: no source could be read.`

### News entry: the whole body
```
<tools with releases, comma separated> · <N> releases, <N> bug fixes

### Claude Code
- ⚠️ **<What changed>** (<version>). <One sentence: what to do about it.> [Source](<release URL>)
- **<What changed>** (<version>). <One sentence: what it does, why it matters, or when to use it.> [Source](<release URL>)

### Antigravity CLI
- ...

### Codex CLI
- ...

### Cline
- ...

### Kilo Code
- ...

### Across tools
- **<Theme>.** <One sentence naming the tools and changes.> Sources: [<Tool>](<URL>), [<Tool>](<URL>)
```

Format details:
- No `#` or `##` headings in the body. The page layout prints the run time and range.
- **Tool order is fixed:** Claude Code, Antigravity CLI, Codex CLI, Cline, Kilo Code.
  Cline covers both tracks (extension and CLI) under one heading.
- **All 5 tool headings always appear**, in the fixed order. A tool with no new release gets
  one line under its heading: `- No updates since <since>.`
  A tool that could not be read gets: `- Not checked (source could not be read).`
- A tool with releases but nothing worth a bullet gets one line under its heading:
  `- Bug fixes only (<N> fixes).` or `- Minor changes only.`
- Each bullet = a bold title + the version in brackets + exactly ONE sentence + the source link.
  The sentence can use a semicolon, but keep it under ~35 words. No tool name in the
  title (the heading already says it).
- Inside each tool: ⚠️ bullets first, then the most useful features.
- Number of bullets follows the amount of news: often 1 to 3 for a 12-hour run, up to
  ~10 after a long gap. Max ~3 bullets per tool, not counting ⚠️ bullets.
- `### Across tools` ONLY if a real theme exists across 2+ tools; otherwise omit the heading.
  It may link to an earlier entry when it continues a trend: [earlier](YYYY-MM-DD-HHMM.html).
- Release links: use `tag_url` from `sources.yml`. Link the release that introduced the change.

### When to use ⚠️
Ask: "If the user updates and does nothing, will something break, change behind their
back in a harmful way, or end on a date?"
- **Yes → ⚠️.** Examples: a removed flag or setting, a permission rule that matches less,
  a URL or config that is now read differently, a service shutdown date, a new default that
  can raise cost or change results (e.g. a different default model).
- **No → no ⚠️.** Examples: a new command, a new opt-in mode, a new default that only helps
  and breaks nothing (e.g. automatic compaction that saves cost).

## Writing rules

- **Never invent.** Every command, flag, setting, env var, key, file path and
  version must appear in the source text. If an example needs a detail that is not
  in the source, mark it `(verify)`. Prefer a plainer sentence over a guessed detail.
- **Bug fixes:** count them, don't list them. Exception: a fix that unblocks something
  major (a model or provider that did not work at all) can be a bullet.
- **Select hard.** Breaking changes > features most users touch > the rest.
  A tool can have releases and still get zero bullets if nothing matters; it still counts in the counts line.
- **Short coverage = short entry.** A run with 2 changes gives 2 bullets. Never pad.
- **Skip platform-specific items** (only Bedrock, only Slack, only one IDE, only
  self-hosted runners, admin consoles) unless they are big.
- **Own words.** Summarize, link each item to its source. Never copy changelog text in bulk.
- **Plain English.** Short sentences. Keep technical terms and identifiers exactly as written.
  Do not use the em dash character.
- **Counts:** "bug fixes" = lines/bullets that are fixes (in Claude Code, lines that start
  with "Fixed", including prefixed ones like `[VSCode] Fixed`). If a source gives no clear
  count, give your best count.
- Language: English.

## Example of good bullets

```
### Claude Code
- ⚠️ **MCP allow rules now match only the exact server** (2.1.299). A rule `mcp__a` no longer allows a server named `a__b`, so write `mcp__<server>__*` with the full server name or some tools will start asking for approval. [Source](https://github.com/anthropics/claude-code/releases/tag/v2.1.299)

### Antigravity CLI
- **Auto mode** (1.3.5). It approves edits and safe commands without asking, and a separate agent reviews commands that would leave the sandbox; pick it with `--mode auto` or `Shift+Tab`. [Source](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.3.5)
```

See `docs/digests/` for earlier entries.
