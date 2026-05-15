# Job Alert Add-on for Google Sheet

A Google Apps Script that reads **LinkedIn** and **Indeed** job-alert emails from Gmail, scores each listing, and writes the results into a Google Sheet — running automatically every morning.

## Features

- Parses daily job-alert emails from **LinkedIn** (`jobalerts-noreply@linkedin.com`) and **Indeed** (`donotreply@jobalert.indeed.com`)
- Scores every job based on work type, job title, domain, and location keywords (each matching keyword adds points)
- De-duplicates listings so the same job is never added twice
- Sorts rows by application status (`Not Applied → Applied → Pass`) then by score descending
- Dropdown validation and color-coding on the Application Status column
- Bilingual UI — switch between **English** and **中文** from the menu at any time
- Runs automatically every day at 07:00 via a time-based Apps Script trigger
- CI/CD via GitHub Actions: lints on every PR and deploys to Apps Script on every push to `main`

## Scoring

| Condition | Points |
|-----------|--------|
| Remote work (remote / WFH / 遠端) | +2 |
| Hybrid | +1 |
| On-site / unspecified | +0 |
| Each title keyword matched | +1 per keyword |
| Each domain keyword matched | +1 per keyword |
| Each location keyword matched | +1 per keyword |

Keyword matching is case-insensitive. Multiple matching keywords in the same category each add their own point.

## Install the add-on from source

### 1. Subscribe to job-alert emails

1. **LinkedIn** — log in → set your LinkedIn language to **English** (Account → Language) → search for jobs → click *Set alert* → choose *Daily email*
2. **Indeed** — log in → search for jobs → click *Get email updates* → choose *Daily*
3. Confirm both alert emails land in your **Gmail** inbox
4. **(Optional)** Set a Gmail filter to auto-archive job-alert emails so they don't clutter your inbox:
   - In Gmail, click the search bar → **Show search options**
   - In the **From** field enter: `from:(jobalerts-noreply@linkedin.com OR donotreply@jobalert.indeed.com)`
   - Click **Create filter** → check **Skip the Inbox (Archive it)** → **Create filter**

### 2. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Open **Extensions → Apps Script**, which creates a bound script project
3. Copy the script project's ID from the Apps Script URL (the long string after `/projects/`)

### 3. Install clasp and link the project

```bash
npm install -g @google/clasp
clasp login
```

Create a `.clasp.json` file in the project root (this file is gitignored):

```json
{
  "scriptId": "<YOUR_APPS_SCRIPT_PROJECT_ID>",
  "rootDir": "src",
  "parentId": "<YOUR_GOOGLE_SHEET_ID>"
}
```

Then push the code:

```bash
clasp push
```

### 4. Customize keywords

Open the Google Sheet → click **📋 Job Alert** → **⚙️ Preferences** (or **⚙️ 個人設定** in Chinese mode).

Fill in your keyword lists (one per line) and save. Settings are stored in Script Properties.

| Field | Effect |
|-------|--------|
| Job title keywords | +1 pt per keyword matched against job title + location |
| Industry / domain keywords | +1 pt per keyword matched against job title + company name |
| Preferred location keywords | +1 pt per keyword matched against job title + location |
| Scan emails from the last N days | How far back to look in Gmail (default: 7) |
| LinkedIn / Indeed toggles | Enable or disable each source individually |

### 5. First run inside Google Sheets

1. Open the Google Sheet
2. In the menu bar you will see **📋 Job Alert** (to the right of *Help*)
3. Click **🕐 Set up daily auto-scan**
4. A permissions dialog will appear — click *Allow* to grant Gmail and Sheets access
5. This sets up a daily trigger that runs `scanAllAlerts` every morning at 07:00

## Menu options

| Menu item | What it does |
|-----------|--------------|
| 🔍 Scan all jobs now | Scans both LinkedIn and Indeed emails right now |
| 🕐 Set up daily auto-scan | Creates the daily 07:00 trigger (run once) |
| ⚙️ Preferences | Opens the settings sidebar to edit keywords and scan range |
| 🌐 切換為中文 / Switch to English | Toggles the UI language between English and Chinese |

## Program workflow

```
Gmail (LinkedIn / Indeed emails)
        │
        ▼
  parseLinkedInEmail / parseIndeedEmail
  (extract title, company, location, work type, link)
        │
        ▼
  calcScore  →  pts based on keywords + work type
        │
        ▼
  Google Sheet tabs
  ├── LinkedIn Jobs   (date, title, company, location, work type, score, reasons, link, status)
  └── Indeed Jobs     (date, title, company, location, work type, score, reasons, link, status)
```

Each tab is sorted by application status first, then by score descending. The Application Status column has a dropdown (`Not Applied → Applied → Pass`) with conditional color formatting.

## Project structure

| File | Purpose |
|------|---------|
| `src/code.gs` | Entry point — `onOpen` builds the custom Sheets menu |
| `src/config.gs` | Constants (`CONFIG`, headers, status color/order maps) and `getSettings()` / `getDefaultSettings()` which read from ScriptProperties |
| `src/services.gs` | Main entry point `scanAllAlerts`, called by the menu and the daily trigger |
| `src/helpers.gs` | Stateless helpers: `scanEmailSource`, `parseLinkedInEmail`, `parseIndeedEmail`, `detectWorkType`, `calcScore`, sheet utilities |
| `src/crons.gs` | Trigger management: `setupDailyTrigger` registers the 07:00 time-based trigger |
| `src/ui.gs` | Sidebar handlers: `openSettingsSidebar`, `saveSettings`, `loadSettingsForSidebar`, `switchLanguage` |
| `src/i18n.gs` | Internationalisation: `STRINGS` map (EN / ZH), `t()`, `tf()`, `getLanguage()`, `getUiStrings()` |
| `src/settings.html` | Sidebar form UI for editing keyword lists, scan range, and source toggles |

## Local development

```bash
npm install          # install dev dependencies (eslint, prettier, husky)
npm run lint         # run ESLint
npm run format       # run Prettier on src/
clasp push           # push code to Apps Script manually
```

## Privacy

This add-on reads Gmail messages only from the two known job-alert senders (`jobalerts-noreply@linkedin.com` and `donotreply@jobalert.indeed.com`) and writes the extracted job listings into your own Google Sheet.

- **No data is transmitted to any external server.** All processing happens inside Google's infrastructure (Apps Script).
- **No data is stored outside your Google account.** Job listings go into your Sheet; keyword preferences go into Script Properties — both owned by you.
- The only Google API scopes used are `gmail.readonly` (to read job-alert emails), `spreadsheets.currentonly` (to write to the active Sheet), and the standard Apps Script scopes for triggers, storage, and UI.
