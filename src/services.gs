// eslint-disable-next-line no-unused-vars
function scanAllAlerts() {
  Logger.log("=== scanAllAlerts 開始 ===");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settings = getSettings();

  var summary = [];

  // Parse LinkedIn job alert emails and add new jobs to corresponding sheet
  if (settings.isLinkedInEnabled) {
    const linkedinCount = scanEmailSource(ss, {
      sheetName: CONFIG.SHEET_LINKEDIN,
      sender: CONFIG.SENDER_LINKEDIN,
      parser: parseLinkedInEmail,
      label: "LinkedIn",
    });
    summary.push(tf("alertScanComplete", { src: "LinkedIn", count: linkedinCount }));
    Logger.log("LinkedIn scanning complete: " + linkedinCount + " job(s) added.");
  } else {
    Logger.log("LinkedIn scanning disabled, skipping.");
  }

  // Parse Indeed job alert emails and add new jobs to corresponding sheet
  if (settings.isIndeedEnabled) {
    const indeedCount = scanEmailSource(ss, {
      sheetName: CONFIG.SHEET_INDEED,
      sender: CONFIG.SENDER_INDEED,
      parser: parseIndeedEmail,
      label: "Indeed",
    });
    summary.push(tf("alertScanComplete", { src: "Indeed", count: indeedCount }));
    Logger.log("Indeed scanning complete: " + indeedCount + " job(s) added.");
  } else {
    Logger.log("Indeed scanning disabled, skipping.");
  }

  Logger.log("=== scanAllAlerts completed ===");
  try {
    if (summary.length > 0) {
      SpreadsheetApp.getUi().alert(summary.join("\n\n"));
    } else {
      SpreadsheetApp.getUi().alert(t("alertNoSourcesEnabled"));
    }
  } catch (_e) {
    // Running from a trigger — no UI context available
  }
}
