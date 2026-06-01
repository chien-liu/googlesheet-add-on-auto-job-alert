/* eslint-disable no-unused-vars */
// Internationalisation helpers.
// Language is stored in ScriptProperties under the key "LANGUAGE" ('en' or 'zh').
// Default: 'en' — existing behaviour is preserved on first deploy.

var STRINGS = {
  en: {
    // ── Menu ────────────────────────────────────────────────
    menuSetupTrigger: "🕐 Set up daily auto-scan",
    menuSettings: "⚙️ Preferences",
    menuScanAll: "🔍 Scan all jobs now",
    menuSwitchLang: "🌐 切換為中文",

    // ── Alerts ──────────────────────────────────────────────
    alertSetupDone:
      "✅ All set! Job alert from LinkedIn will be scanned every day at 07:00.\n\n" +
      'Tip: run "Scan LinkedIn now" from the menu to do a first test.',
    alertScanComplete: "✅ {src} scan complete — {count} new job(s) added.",

    // ── Settings sidebar ────────────────────────────────────
    sidebarTitle: "⚙️ Preferences",
    labelTitleKw: "🏷️ Job title keywords  (+1 pt each)",
    labelDomainKw: "🏢 Industry / domain keywords  (+1 pt each)",
    labelLocationKw: "📍 Preferred location keywords  (+1 pt each)",
    labelDays: "📅 Scan emails from the last N days",
    hintKeywords: "One keyword per line · case-insensitive",
    confirmReset: "Reset all preferences to defaults? Your custom keywords and settings will be lost.",
    btnSave: "💾 Save",
    btnReset: "↩ Reset to defaults",
    statusSaving: "Saving…",
    statusSaved: "✅ Saved!",
    statusResetting: "Loading defaults…",
    statusReset: "Defaults restored.",
    statusSaveError: "❌ Could not save: {msg}",
    statusLoadError: "❌ Could not load settings: {msg}",

    // ── Sources section ──────────────────────────────────────
    labelSources: "📡 Job Sources",
    labelScanLinkedIn: "LinkedIn job alert emails",
    labelScanIndeed: "Indeed job alert emails",
    alertNoSourcesEnabled: "No sources enabled for scanning. Please update your preferences.",

    // ── Score reasons (written into sheet cells) ─────────────
    scoreReasonRemote: "Remote +2",
    scoreReasonHybrid: "Hybrid +1",
    scoreReasonTitle: "Title match",
    scoreReasonDomain: "Domain match",
    scoreReasonLocation: "Location match",
    scoreReasonNone: "No bonus",
  },

  zh: {
    // ── Menu ────────────────────────────────────────────────
    menuSetupTrigger: "🕐 設定每日自動掃描",
    menuSettings: "⚙️ 個人設定",
    menuScanAll: "🔍 立即掃描所有職缺",
    menuSwitchLang: "🌐 Switch to English",

    // ── Alerts ──────────────────────────────────────────────
    alertSetupDone:
      "✅ 設定完成！每天早上 7:00 自動掃描 LinkedIn。\n\n提示：可從選單點「立即掃描 LinkedIn」做第一次測試。",
    alertScanComplete: "✅ {src} 掃描完成，新增 {count} 筆職缺。",

    // ── Settings sidebar ────────────────────────────────────
    sidebarTitle: "⚙️ 個人設定",
    labelTitleKw: "🏷️ 職稱關鍵字（每符合 +1 分）",
    labelDomainKw: "🏢 產業 / 領域關鍵字（每符合 +1 分）",
    labelLocationKw: "📍 偏好地點關鍵字（每符合 +1 分）",
    labelDays: "📅 掃描最近幾天的信件",
    hintKeywords: "每行一個關鍵字，英文不分大小寫",
    confirmReset: "確定要還原預設值嗎？您所有自訂的關鍵字與設定都將會遺失。",
    btnSave: "💾 儲存",
    btnReset: "↩ 還原預設",
    statusSaving: "儲存中…",
    statusSaved: "✅ 已儲存！",
    statusResetting: "載入預設值…",
    statusReset: "已還原預設值，按儲存以套用。",
    statusSaveError: "❌ 儲存失敗：{msg}",
    statusLoadError: "❌ 無法載入設定：{msg}",

    // ── Sources section ──────────────────────────────────────
    labelSources: "📡 職缺來源",
    labelScanLinkedIn: "LinkedIn 職缺提醒信件",
    labelScanIndeed: "Indeed 職缺提醒信件",
    alertNoSourcesEnabled: "未啟用任何來源，請至偏好設定更新。",

    // ── Score reasons (written into sheet cells) ─────────────
    scoreReasonRemote: "遠端 +2",
    scoreReasonHybrid: "混合辦公 +1",
    scoreReasonTitle: "職稱符合",
    scoreReasonDomain: "領域符合",
    scoreReasonLocation: "地點符合",
    scoreReasonNone: "無額外加分",
  },
};

/** Returns the active language code ('en' or 'zh'), falling back to English. */
function getLanguage() {
  return PropertiesService.getScriptProperties().getProperty("LANGUAGE") || "en";
}

/** Returns the localised string for key, falling back to key itself for debugging. */
function t(key) {
  var lang = getLanguage();
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
}

/**
 * Like t() but replaces {placeholder} tokens with values from vars.
 * e.g. tf('alertScanComplete', { li: 5 })
 */
function tf(key, vars) {
  var s = t(key);
  for (var k in vars) {
    s = s.replace("{" + k + "}", vars[k]);
  }
  return s;
}

/** Returns the full strings map for the active language (used by settings.html). */
function getUiStrings() {
  var lang = getLanguage();
  return STRINGS[lang] || STRINGS.en;
}
