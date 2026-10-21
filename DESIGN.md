# Handoff: Coding Agents Weekly (auto-updated site)

Context from a planning chat with Claude. Continue from here.

## The idea
A public GitHub Pages site with a **weekly digest of what changed in AI coding agents**.
Not a list of changelogs (aggregators already do that). The value is:
- **Selection**: pick the changes that matter out of hundreds of lines.
- **Explanation**: for each change, What / Why it matters / When to use / Example.
- **Action needed**: breaking changes and deadlines, at the top.
- **Cross-tool view**: themes across tools ("both Claude Code and agy added plugin validation this week").

## Tools tracked
| Tool | Dates source (Releases page) | Full text source |
|---|---|---|
| Claude Code | https://github.com/anthropics/claude-code/releases | https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md |
| Antigravity CLI (`agy`) | https://github.com/google-antigravity/antigravity-cli/releases (verify) | https://github.com/google-antigravity/antigravity-cli/blob/main/CHANGELOG.md |
| OpenAI Codex CLI | https://github.com/openai/codex/releases | Release notes (skip alpha tags) |
| Cline | `cline/cline` Releases (verify repo name) | Release notes |
| Kilo Code | https://github.com/Kilo-Org/kilocode/releases | Release notes. Last release seen: v7.5.15, Sep 6 2026. Verify it's still the active source |

Notes:
- Gemini CLI is NOT tracked: it was replaced by Antigravity CLI (`agy`) on June 18, 2026 for unpaid and Google One users, and is not optimized for Gemini 4 Argon.
- `CHANGELOG.md` files have no dates. Dates come from the Releases pages.
- Skip alpha / beta / nightly / pre-release tags.

## Architecture (decided)
**One Claude scheduled task. GitHub = storage + hosting only.**

**Schedule:** daily to start. Later I will switch to twice a week (based on results).
**Coverage rule:** each run covers everything released **since the last digest**, tracked in `task/state.json`. So changing the schedule needs no prompt change: daily runs cover ~1 day, twice-weekly runs cover ~3 to 4 days.

```
Each run (Claude scheduled task, cloud, computer can be off)
  1. Read task/state.json -> last digest date + last version seen per tool
  2. Read the Releases pages of the 5 tools -> versions + dates
  3. Keep only releases newer than state.json
  4. If nothing new for any tool: write nothing, commit nothing, stop
  5. Read CHANGELOG.md / release notes for full text
  6. Select, explain, compare, write the digest (rules below)
  7. Commit docs/digests/YYYY-MM-DD.md + update index + update state.json, push
GitHub Pages publishes docs/ automatically
```

Why Claude and not GitHub Models: the free GitHub Models tier caps input at 8,000 tokens per request. The cross-tool section needs all changes in one view (Claude Code alone had ~190 non-fix lines in one week). Claude also writes better explanations and can check examples against docs. Watch how much of the Pro limit each daily run uses during the first days.

Rejected for now:
- GitHub Actions + GitHub Models only: free, but weak at selection and cross-tool comparison.
- Claude API / Claude Code GitHub Action: no API key (Claude Pro only); OAuth token use in automation has unclear terms.
- Optional later: a daily GitHub Actions collector that saves raw data + "first seen" dates, if the weekly run misses versions.

## Digest format
```
# Coding agents update
<date range covered> · <tools> · counts

## In one minute                (2 to 5 bullets; a shared theme only if one really exists)
## ⚠️ Action needed            (breaking changes, deprecations, deadlines; omit if none)
## <Tool> · <versions> · <N> releases, <N> bug fixes
   ### <Change title> (<version>)
   What / Why it matters / When to use / Example
No release: <tool>, <tool>     (one line at the end, no padding)
```
- Date range = from the last digest's date to today (so after a skipped day, the range is longer).
- A shared theme may link back to an earlier digest when it continues a trend.

## Writing rules (put these in the task prompt)
- Every command, flag, setting, env var, file path must appear in the source text. Never invent one.
- If an example detail is not in the source, mark it "(verify)".
- Bug fixes: count them, don't list them, unless a fix unblocks something major.
- Select max ~7 items per busy tool. Order: breaking > features most users touch > the rest.
- Short coverage (daily runs) gives short digests. Never stretch content to look like a weekly.
- Tools with no new release since the last digest: list them in one line at the end ("No release: Codex CLI, Kilo Code").
- Skip platform-specific items (e.g. only Bedrock, only Slack) unless big.
- Quiet tool = one line "no release". Never pad.
- Summarize in own words, link each item to the source. Never copy changelog text in bulk.
- Language: English first. Arabic version maybe later (decide after seeing quality).

## Expected behavior (simulated examples)
| Day | Situation | Result |
|---|---|---|
| Normal day | 1 or 2 tools released | Short digest published (e.g. 2 items + "No release: ..." line) |
| Quiet day | No new release for any tool | No digest, no commit. The run log says "No release newer than state.json". Site keeps showing the previous digest |
| Busy day / after a quiet day | 3+ tools, maybe breaking changes | Full format: In one minute, Action needed, per-tool sections, shared theme if real. Covers everything since the last digest |

## Daily phase: what to watch (to decide on twice a week)
1. **Push works every run** (the 403 risk).
2. **No invented commands/flags.** Many "(verify)" marks = the prompt needs tightening.
3. **Digest size.** If most daily digests have only 1 or 2 items, switch to twice a week; it will read much better.
4. **Pro limit use per run.** A run reading 5 changelogs is not small; check after the first few runs.
5. **Source health.** A source that fails or returns nothing for weeks (e.g. Kilo Code) gets replaced.

To switch: edit only the scheduled task's schedule. The "since last digest" rule handles the rest.

## Repo layout
```
coding-agents-weekly/
├── docs/                       # GitHub Pages root
│   ├── index.html              # lists digests, newest first
│   ├── assets/style.css
│   └── digests/YYYY-MM-DD.md   # one per week (or .html if not using Jekyll)
├── task/
│   ├── PROMPT.md               # the scheduled-task instructions (source of truth)
│   ├── sources.yml             # tool list above
│   └── state.json              # last digest date + last version seen per tool
└── README.md
```
Keep the task prompt in the repo, so it can be edited and versioned like code.

## Tasks for Claude Code (on my laptop)
1. Verify the source URLs above (Cline repo name, agy Releases page with dates, Kilo still active).
2. Create the repo structure, `index.html` + CSS (clean, readable, mobile-friendly), `task/PROMPT.md`, `task/sources.yml`, `README.md`.
3. Write `task/PROMPT.md` as a **fully self-contained** instruction: every scheduled run starts a fresh session with no memory of this conversation. It must include: the repo name, the sources (or "read task/sources.yml"), the state/coverage rule, the "nothing new = no commit" rule, the digest format, the writing rules, and the exact files to write and commit.
4. Write one real first digest covering the last 7 days into `docs/digests/` so the site isn't empty, and set `task/state.json` to the latest versions it covered.
5. Save this handoff in the repo root as `DESIGN.md` (not in `docs/`, so it isn't published).
6. Create the GitHub repo **`coding-agents-weekly`**, **Public**, and push. Use my local credentials: `gh repo create coding-agents-weekly --public --source . --push` (ask me before running it).
7. Turn on GitHub Pages: branch `main`, folder `/docs` (via `gh api`, or tell me to click it in Settings -> Pages).
8. Tell me the site URL and check the page loads.

## Then, back in the Claude app (not Claude Code)
- Create the **daily Claude scheduled task** using `task/PROMPT.md` as its prompt. Later: edit only its schedule to twice a week.
- **Blocker to test first:** the scheduled task runs in Anthropic's cloud and pushes with Claude's GitHub connection, not my laptop credentials. A previous push from Claude's connection to one of my repos failed with 403. So a successful push from the laptop proves nothing for the cloud task. In the Claude app: attach `coding-agents-weekly` with push access and make one test commit, then create the task, then use "run now" once and check the commit appears.
- Note: creating the repo from the Claude cloud workspace was blocked (account-level action), which is why the laptop creates it.
- Fallback if push fails: GitHub Actions + GitHub Models, with per-tool summaries combined at the end (lower quality).

---

## Setup notes (2026-10-21)

Results of the setup run, recorded so later edits have the facts.

**Sources verified**
- Claude Code: Releases page OK, tags `v2.1.x`. CHANGELOG.md raw URL OK.
- Antigravity CLI: Releases page exists with dates; tags have no `v` (`1.4.4`). Raw CHANGELOG.md OK.
- Codex: first Releases page is all `-alpha` tags; stable tags are `rust-v0.x.y` (latest stable `rust-v0.163.0`, Oct 15).
- Cline: repo name `cline/cline` is right. One repo, four products: extension `v4.x`, CLI `cli-v3.x`, `desktop-v*`, `sdk/sdk/v*`. We track extension + CLI.
- Kilo Code: active (v7.8.15 on Oct 19, not v7.5.15). Many v7 tags are pre-releases; stable release notes repeat the pre-release notes. JetBrains plugin has its own `jetbrains/*` tags (skipped).

**Access from a Claude cloud session**
- `api.github.com` and plain `curl` to `github.com` were refused (403) for repos not attached to the session.
- What worked: the web fetch tool on `github.com/.../releases` pages, `curl` on `raw.githubusercontent.com`, and `git ls-remote --tags`. `task/PROMPT.md` lists these fallbacks.

**Site**
- Jekyll on GitHub Pages. `docs/index.html` lists `docs/digests/*.md` automatically and shows the latest one in full, so the task does not edit the index.

**Format change (2026-10-21, after launch)**
- Digests now contain only the "In one minute" list. Each bullet: bold title + version + one sentence (what / why / when to use) + source link.
- No separate "Action needed" section and no per-tool sections. Breaking changes, removals and deadlines lead the list, marked ⚠️.
- Bullet count follows the news: 1 to 3 on a quiet day, up to ~10 for a busy week, max ~3 per tool except ⚠️ items.
- Update: the list is grouped by tool, in a fixed order: Claude Code, Antigravity CLI, Codex CLI, Cline, Kilo Code, then "Across tools". ⚠️ bullets come first inside each tool. PROMPT.md has a test for when to use ⚠️.

**Schedule and entries change (2026-10-22)**
- Runs twice a day, 08:00 and 20:00 Cairo time, on Haiku 5.5 (cost). Push notification when a run finishes.
- Every run writes an entry, also when nothing is new ("No new releases since ..."), so each check is visible. This replaces "nothing new = no commit".
- Entry files: `docs/digests/YYYY-MM-DD-HHMM.md` (Cairo time). `state.json` tracks `last_run` instead of `last_digest_date`.
- Site: a feed of the latest 14 checks, one box per tool, a strong line between runs, quiet checks shown as one small line.
