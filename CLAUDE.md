# Job Alert Filter — Google Sheets Add-on

A Google Apps Script add-on that scans LinkedIn and Indeed job-alert emails in Gmail, scores each job against user-defined keywords, and writes results into a Google Sheet.

## Architecture

The add-on runs entirely inside Google Apps Script (no external backend). All files live in `src/` and are deployed via [clasp](https://github.com/google/clasp).

| File | Purpose |
|------|---------|
| `src/code.gs` | Entry point — `onOpen` menu, first-run sidebar auto-open |
| `src/config.gs` | Global constants (`CONFIG`, `JOB_ENTRY_HEADERS`, status maps) and `getSettings()` / `getDefaultSettings()` |
| `src/services.gs` | `scanAllAlerts()` — orchestrates scanning for each enabled source |
| `src/helpers.gs` | `scanEmailSource`, `parseLinkedInEmail`, `parseIndeedEmail`, `calcScore`, sheet utilities |
| `src/crons.gs` | `setupDailyTrigger` — installs a time-based trigger that calls `scanAllAlerts` daily at 07:00 |
| `src/ui.gs` | Sidebar open/save/load/language-switch functions |
| `src/i18n.gs` | `t()` / `tf()` helpers, `STRINGS` map for `en` and `zh` |
| `src/settings.html` | Sidebar HTML/JS rendered by `HtmlService` |
| `appsscript.json` | Apps Script manifest — OAuth scopes, add-on metadata, runtime |
| `.clasp.json` | clasp config — script ID, `rootDir: "src"`, parent spreadsheet ID |

## Key data flow

1. User triggers **Scan all jobs now** (or the daily cron fires `scanAllAlerts`).
2. `scanEmailSource` searches Gmail for emails from the configured sender within the last N days.
3. `parseLinkedInEmail` / `parseIndeedEmail` extract job fields via regex from the HTML email body.
4. `calcScore` awards points for title, domain, location keyword matches and work-type (Remote +2, Hybrid +1).
5. New jobs are prepended to the source-specific sheet tab, deduplicated by link/job-key.
6. The sheet is sorted by Application Status order (`Not Applied → Applied → Pass`) then score descending.
7. Dropdown validation and conditional formatting are applied to the **Application Status** column.

## User settings (ScriptProperties)

| Key | Type | Default |
|-----|------|---------|
| `TITLE_KEYWORDS` | JSON string array | `["senior","machine learning","platform"]` |
| `DOMAIN_KEYWORDS` | JSON string array | `["aucoustic","chatbot","automotive","healthcare"]` |
| `LOCATION_KEYWORDS` | JSON string array | `["berlin","munich","taipei"]` |
| `DAYS_TO_SCAN` | string integer | `"7"` |
| `IS_LINKEDIN_ENABLED` | `"true"/"false"` | `"true"` |
| `IS_INDEED_ENABLED` | `"true"/"false"` | `"true"` |
| `LANGUAGE` | `"en"/"zh"` | `"en"` |

## Development workflow

```bash
npm install          # install dev tools (eslint, prettier, husky, lint-staged)
npm run lint         # lint all .gs and .js files
npm run format       # prettier-format src/

clasp login          # authenticate with Google (one-time)
clasp push           # push src/ to Apps Script
clasp open           # open the script in the browser
```

Pre-commit hook runs `prettier` + `eslint --fix` on staged `src/` files via lint-staged.

## OAuth scopes (appsscript.json)

| Scope | Reason |
|-------|--------|
| `spreadsheets.currentonly` | Read/write the active spreadsheet only |
| `gmail.readonly` | Search and read job-alert emails |
| `script.scriptapp` | Install/delete time-based triggers |
| `script.storage` | Read/write ScriptProperties (user settings) |
| `script.container.ui` | Show menus and sidebars |

`gmail.readonly` is a **restricted scope** and requires Google's OAuth API verification before the add-on can be published publicly.

## Publishing roadmap (remaining work)

See `TODOs.md` for the full checklist. Blocking items in order:

1. **GCP project** — create project, link to Apps Script, enable Gmail + Sheets APIs, configure OAuth consent screen (External, with privacy policy URL).
2. **Privacy policy** — host `docs/privacy.html` and `docs/terms.html` on GitHub Pages or similar.
3. **Gmail restricted scope review** — submit OAuth API verification form; expect 4–6 weeks.
4. **GWM listing** — enable Google Workspace Marketplace SDK, fill in listing details, submit for review.

Terraform will be used to define the GCP project and marketplace configuration before publishing.

## Known issues / tech debt

- `timeZone: "Europe/Berlin"` is hardcoded in `appsscript.json`; `crons.gs` already calls `Session.setScriptTimeZone(ss.getSpreadsheetTimeZone())` at trigger-setup time as a workaround.
- `parseIndeedEmail` regex is fragile to HTML structure changes; it logs a warning when 0 jobs are parsed from a non-empty body.
