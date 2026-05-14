// ============================================================
// Settings sidebar
// ============================================================
// eslint-disable-next-line no-unused-vars
function openSettingsSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("settings").setTitle(t("sidebarTitle")).setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

// Called by the sidebar to persist user input to ScriptProperties.
// eslint-disable-next-line no-unused-vars
function saveSettings(data) {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    TITLE_KEYWORDS: JSON.stringify(data.titleKeywords || []),
    DOMAIN_KEYWORDS: JSON.stringify(data.domainKeywords || []),
    LOCATION_KEYWORDS: JSON.stringify(data.locationKeywords || []),
    DAYS_TO_SCAN: String(parseInt(data.daysToScan, 10) || 7),
    IS_LINKEDIN_ENABLED: data.isLinkedInEnabled === false ? "false" : "true",
    IS_INDEED_ENABLED: data.isIndeedEnabled === false ? "false" : "true",
  });
}

// Called by the sidebar to populate the form with the current saved settings.
// eslint-disable-next-line no-unused-vars
function loadSettingsForSidebar() {
  return getSettings();
}

// Toggles the UI language between 'en' and 'zh' and rebuilds the menu immediately.
// eslint-disable-next-line no-unused-vars
function switchLanguage() {
  var current = getLanguage();
  var next = current === "zh" ? "en" : "zh";
  PropertiesService.getScriptProperties().setProperty("LANGUAGE", next);
  onOpen();
}
