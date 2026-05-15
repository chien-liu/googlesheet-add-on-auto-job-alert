// eslint-disable-next-line no-unused-vars
function setupDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "scanAllAlerts") ScriptApp.deleteTrigger(triggers[i]);
  }

  // Align script's timezone with spreadsheet's timezone
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let tz = ss.getSpreadsheetTimeZone();
  Logger.log("Setting script timezone to %s", tz);
  Session.setScriptTimeZone(tz);


  ScriptApp.newTrigger("scanAllAlerts").timeBased().everyDays(1).atHour(7).create();
  let message = t("alertSetupDone");
  try {
    SpreadsheetApp.getUi().alert(message);
  } finally {
    Logger.log(message);
  }
}
