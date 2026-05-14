// eslint-disable-next-line no-unused-vars
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("📋 Job Alert")
      .addItem(t("menuScanAll"), "scanAllAlerts")
      .addSeparator()
      .addItem(t("menuSetupTrigger"), "setupDailyTrigger")
      .addSeparator()
      .addItem(t("menuSettings"), "openSettingsSidebar")
      .addItem(t("menuSwitchLang"), "switchLanguage")
      .addToUi();
  } catch (_e) {
    Logger.log(
      "This function is meant to create a custom menu in the Google Sheets UI. " +
        "Do not trigger it from Apps Script editor UI. " +
        "Please open the Google Sheet to see the custom menu."
    );
  }
}
