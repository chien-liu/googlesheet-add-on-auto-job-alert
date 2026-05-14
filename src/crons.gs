// eslint-disable-next-line no-unused-vars
function setupDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "scanAllAlerts") ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger("scanAllAlerts").timeBased().everyDays(1).atHour(7).create();
  let message = t("alertSetupDone");
  try {
    SpreadsheetApp.getUi().alert(message);
  } finally {
    Logger.log(message);
  }
}
