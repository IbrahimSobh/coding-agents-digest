# Scheduled task: Coding Agents Weekly

You run on a schedule in a fresh session. You have no memory of earlier runs.
Everything you need is in this file and in the repository.

## Your job

Publish a digest of what changed in AI coding agents since the last digest,
to the GitHub repo **`IbrahimSobh/coding-agents-weekly`** (branch `main`).
GitHub Pages publishes `docs/` to https://ibrahimsobh.github.io/coding-agents-weekly/.

The value of the digest is not the list of changes. It is:
- **Selection**: the few changes that matter, out of hundreds of lines.
- **Explanation**: one short sentence per change: what it does, why it matters, or when to use it.
- **Action needed first**: breaking changes, removals and deadlines lead the list, marked ⚠️.
- **Cross-tool view**: real themes across tools.

The digest is ONE list ("In one minute"). No per-tool sections, no long items.

## Step by step

### 1. Get the repo and read the state
- Clone or open `IbrahimSobh/coding-agents-weekly`. Work on branch `main`.
- Read `task/sources.yml` (tools, Releases pages, tag patterns, full-text sources).
- Read `task/state.json`: `last_digest_date` and the `last_tag` of each tool (Cline has two tracks: `extension` and `cli`).

### 2. Find new releases
For each tool (and each Cline track), read its Releases page and list the releases
that match `tag_pattern` and are **newer than `last_tag`** in `state.json`
(compare by version number, not by date).

- Skip alpha, beta, rc, nightly, and any release marked "Pre-release".
- Skip tags listed under `ignored_tags`.
- Codex: the first Releases page is often only alpha tags. Use
  `https://github.com/openai/codex/releases/latest`, or list tags with
  `git ls-remote --tags https://github.com/openai/codex 'rust-v0.*'` and drop `-alpha` tags.
- Release dates come from the Releases page. The page often shows no year:
  use the current year, unless that puts the date in the future (then use last year).
- How to read sources (some access paths may be blocked in your environment; use the next one):
  1. Fetch the Releases page or a release page (`.../releases/tag/<tag>`) with your web fetch tool.
  2. Fetch `CHANGELOG.md` files from `raw.githubusercontent.com` (URLs in `sources.yml`).
  3. `git ls-remote --tags <repo URL>` lists all tags (no dates).
  4. The GitHub API, if available.
- If a source fails, do not guess. Write the failure in the run log and in the
  digest's last line (e.g. "Could not read: Kilo Code releases page").

### 3. Nothing new? Stop.
If **no tool** has a release newer than `state.json`:
- Write nothing. Commit nothing. Do not touch `state.json`.
- End with the log line: `No release newer than state.json.` plus the last tag you saw per tool.

### 4. Read the full text
- Claude Code and Antigravity CLI: take the sections of `CHANGELOG.md` for each new
  version (headings like `## 2.1.307` or `## 1.4.4`).
- Codex, Cline, Kilo Code: read each new release's notes page.
- Kilo Code: a stable release repeats the notes of the pre-releases before it.
  Cover each note once, under the stable release.

### 5. Select, explain, compare
Follow the writing rules and the format below.

### 6. Write the files
1. `docs/digests/YYYY-MM-DD.md` (today's date, UTC). If that file already exists,
   use `YYYY-MM-DD-2.md`.
2. `task/state.json`: set `last_digest_date` and `last_run` to today,
   `last_digest_file` to the new file, and for every tool with new releases,
   set `last_tag` and `last_release_date` to the newest release you covered.
   Leave other tools as they were.
3. Do **not** edit `docs/index.html`. It lists digests automatically.

### 7. Commit and push
```
git add docs/digests task/state.json
git commit -m "Digest YYYY-MM-DD: <tools with releases>"
git push origin main
```
- Push to `main` directly. Do not open a pull request. Do not push to another branch.
- If the push fails, retry once. If it still fails, end with the exact error
  (for example the 403 text). Never report success without a successful push.
- End with a short run log: covered range, releases per tool, bullets written,
  number of "(verify)" marks, and the commit SHA.

## Digest format

File starts with this front matter (all fields required):

```
---
layout: digest
title: "Coding agents update: <Mon D> to <Mon D>, <YYYY>"
date: YYYY-MM-DD
range: "<Mon D> to <Mon D>, <YYYY>"
summary: "<one sentence, max ~20 words, the 2 or 3 biggest changes>"
---
```

Then the body. This is the whole body, nothing else:

```
# Coding agents update

**<range>** · <tools with releases, comma separated> · <N> releases, <N> bug fixes

## In one minute

- ⚠️ **<Tool>: <what changed>** (<version>). <One sentence: what to do about it.> [Source](<release URL>)
- **<Tool>: <what changed>** (<version>). <One sentence: what it does, why it matters, or when to use it.> [Source](<release URL>)
- **Shared theme: <theme>.** <One sentence naming the tools and changes.> Sources: [<Tool>](<URL>), [<Tool>](<URL>)

No release: <tool>, <tool>
```

Format details:
- Each bullet = a bold title + the version in brackets + exactly ONE sentence + the source link.
  The sentence can use a semicolon, but keep it under ~35 words.
- Order: ⚠️ items first (breaking changes, removals, deadlines, changed defaults that need
  action), then the most useful features, then a shared theme bullet last, if any.
- Number of bullets follows the amount of news: 1 to 3 for a quiet day, up to ~10 for a
  busy week. Max ~3 bullets per tool, except ⚠️ items.
- A "Shared theme" bullet ONLY if one really exists across 2+ tools. It may link to an
  earlier digest when it continues a trend: [earlier digest](YYYY-MM-DD.html).
- `range` = from `last_digest_date` in `state.json` to today. After skipped days, the range is longer.
- Release links: use `tag_url` from `sources.yml`. Link the release that introduced the change.
- Last line: tools with no new release, e.g. `No release: Codex CLI, Kilo Code`.
  Omit it if all tools released.

## Writing rules

- **Never invent.** Every command, flag, setting, env var, key, file path and
  version must appear in the source text. If an example needs a detail that is not
  in the source, mark it `(verify)`. Prefer a plainer example over a guessed one.
- **Bug fixes:** count them, don't list them. Exception: a fix that unblocks something
  major (a model or provider that did not work at all) can be a bullet.
- **Select hard.** Breaking changes > features most users touch > the rest.
  A tool can have releases and still get zero bullets if nothing matters; it still counts in the header.
- **Short coverage = short digest.** A daily run with 2 changes gives 2 bullets.
  Never stretch content to look like a weekly. Never pad a quiet tool.
- **Skip platform-specific items** (only Bedrock, only Slack, only one IDE, only
  self-hosted runners, admin consoles) unless they are big.
- **Own words.** Summarize, link each item to its source. Never copy changelog text in bulk.
- **Plain English.** Short sentences. Keep technical terms and identifiers exactly as written.
  Do not use the em dash character.
- **Counts:** "bug fixes" = lines/bullets that are fixes (in Claude Code, lines that start
  with "Fixed", including prefixed ones like `[VSCode] Fixed`). If a source gives no clear
  count, say "N listed bug fixes" or give your best count.
- Language: English.

## Example of good bullets

```
- ⚠️ **Claude Code: MCP allow rules now match only the exact server** (2.1.299). A rule `mcp__a` no longer allows a server named `a__b`, so write `mcp__<server>__*` with the full server name or some tools will start asking for approval. [Source](https://github.com/anthropics/claude-code/releases/tag/v2.1.299)
- **Antigravity CLI: Auto mode** (1.3.5). It approves edits and safe commands without asking, and a separate agent reviews commands that would leave the sandbox; pick it with `--mode auto` or `Shift+Tab`. [Source](https://github.com/google-antigravity/antigravity-cli/releases/tag/1.3.5)
```

See `docs/digests/` for full earlier digests.
